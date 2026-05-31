"use server";

import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

const RELEASES_DIR = path.join(process.cwd(), "public", "releases");

function guessFileName(url: string): string {
  try { return decodeURIComponent(new URL(url).pathname.split("/").pop() || url); }
  catch { return url; }
}

function extractDriveFileId(input: string): string | null {
  // Handles: /file/d/ID/view, /open?id=ID, id=ID param, or raw ID
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
    /\/d\/([a-zA-Z0-9_-]{10,})/,
  ];
  for (const re of patterns) {
    const m = input.match(re);
    if (m) return m[1];
  }
  // Raw file ID (no slashes, no dots)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(input.trim())) return input.trim();
  return null;
}

export async function resolveGoogleDriveAction(driveInput: string): Promise<{
  fileId: string; fileName: string; fileSize: number; downloadUrl: string;
}> {
  const fileId = extractDriveFileId(driveInput);
  if (!fileId) throw new Error("Cannot extract file ID from Google Drive URL.");

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_DRIVE_API_KEY not configured.");

  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name%2Csize&key=${apiKey}`,
    { next: { revalidate: 0 } }
  );
  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Drive API error ${metaRes.status} — make sure file is publicly shared.`);
  }
  const meta = await metaRes.json();

  return {
    fileId,
    fileName: meta.name ?? fileId,
    fileSize: meta.size ? parseInt(meta.size, 10) : 0,
    downloadUrl: `/api/download/drive/${fileId}`,
  };
}

export async function publishReleaseAction(formData: FormData) {
  const version = (formData.get("version") as string).trim();
  const platform = formData.get("platform") as string;
  const channel = formData.get("channel") as string;
  const notes = (formData.get("notes") as string | null) ?? "";
  const mode = formData.get("mode") as string;

  if (!version) throw new Error("Version is required.");

  let fileUrl = "";
  let fileName = "";
  let fileSize = 0;

  if (mode === "file") {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) throw new Error("No file provided.");

    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const dir = path.join(RELEASES_DIR, platform, version);
    await mkdir(dir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(path.join(dir, sanitized), Buffer.from(bytes));

    fileUrl = `/releases/${platform}/${version}/${sanitized}`;
    fileName = file.name;
    fileSize = file.size;
  } else if (mode === "drive") {
    const driveInput = (formData.get("driveUrl") as string | null ?? "").trim();
    if (!driveInput) throw new Error("Google Drive URL is required.");
    const resolved = await resolveGoogleDriveAction(driveInput);
    fileUrl = resolved.downloadUrl;
    fileName = resolved.fileName;
    fileSize = resolved.fileSize;
  } else {
    fileUrl = (formData.get("linkUrl") as string | null ?? "").trim();
    if (!fileUrl) throw new Error("Download URL is required.");
    fileName = guessFileName(fileUrl);
  }

  const sb = createServiceClient();
  const { error } = await sb.from("app_releases").insert({
    version, platform, channel,
    file_name: fileName,
    file_size: fileSize,
    file_url: fileUrl,
    release_notes: notes,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/releases");
}

export async function deleteReleaseAction(id: string, fileUrl: string) {
  const sb = createServiceClient();
  await sb.from("app_releases").delete().eq("id", id);

  // Only delete local files (relative URLs starting with /releases/)
  if (fileUrl.startsWith("/releases/")) {
    const filePath = path.join(process.cwd(), "public", fileUrl);
    if (existsSync(filePath)) await unlink(filePath).catch(() => {});
  }

  revalidatePath("/admin/releases");
}

export async function fetchReleasesAction() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("app_releases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  return data ?? [];
}

export async function promoteReleaseAction(id: string) {
  const sb = createServiceClient();

  const { data: release, error: fetchErr } = await sb
    .from("app_releases")
    .select("version, file_url, release_notes")
    .eq("id", id)
    .single();

  if (fetchErr || !release) throw new Error("Release not found");

  // Find existing active config so we can preserve min_version, build_hash, etc.
  const { data: existing } = await sb
    .from("app_version_config")
    .select("id, min_version, build_hash, custom_message, is_blocked")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const payload = {
    latest_version: release.version,
    download_url: release.file_url,
    release_notes: release.release_notes ?? "",
    is_active: true,
    // preserve existing gate config if present
    min_version: existing?.min_version ?? release.version,
    build_hash: existing?.build_hash ?? null,
    custom_message: existing?.custom_message ?? null,
    is_blocked: existing?.is_blocked ?? false,
  };

  let error;
  if (existing?.id) {
    ({ error } = await sb.from("app_version_config").update(payload).eq("id", existing.id));
  } else {
    ({ error } = await sb.from("app_version_config").insert(payload));
  }

  if (error) throw new Error(error.message);
  revalidatePath("/admin/version-config");
}
