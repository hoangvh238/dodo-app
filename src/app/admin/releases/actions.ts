"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

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

  const sb = createServiceClient();
  let fileUrl = "";
  let fileName = "";
  let fileSize = 0;

  if (mode === "file") {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) throw new Error("No file provided.");

    const bytes = await file.arrayBuffer();
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `releases/${platform}/${version}/${sanitized}`;

    const { error: upErr } = await sb.storage
      .from("release")
      .upload(path, bytes, { contentType: file.type, upsert: true });

    if (upErr) throw new Error(upErr.message);

    const { data: urlData } = sb.storage.from("release").getPublicUrl(path);
    fileUrl = urlData.publicUrl;
    fileName = file.name;
    fileSize = file.size;
  } else {
    fileUrl = (formData.get("linkUrl") as string | null ?? "").trim();
    if (!fileUrl) throw new Error("Download URL is required.");
    fileName = guessFileName(fileUrl);
  }

  const { error: dbErr } = await sb.from("app_releases").insert({
    version, platform, channel,
    file_name: fileName,
    file_size: fileSize,
    file_url: fileUrl,
    release_notes: notes,
  });

  if (dbErr) throw new Error(dbErr.message);

  revalidatePath("/admin/releases");
}

export async function deleteReleaseAction(id: string, fileUrl: string) {
  const sb = createServiceClient();
  await sb.from("app_releases").delete().eq("id", id);
  try {
    const path = new URL(fileUrl).pathname.split("/object/public/release/")[1];
    if (path) await sb.storage.from("release").remove([path]);
  } catch { /* external URL — nothing to remove from bucket */ }
  revalidatePath("/admin/releases");
}

export async function fetchReleasesAction() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("app_releases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return [];
  return data ?? [];
}
