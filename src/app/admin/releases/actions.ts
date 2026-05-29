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
