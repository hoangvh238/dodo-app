"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

const BUCKET = "gallery";

function getFileType(name: string): string {
  const ext = name.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "webm", "mov"].includes(ext)) return ext;
  if (["gif", "webp", "jpg", "jpeg", "png", "avif"].includes(ext)) return ext;
  return "gif";
}

function storagePathFromUrl(publicUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

export async function uploadGalleryItemAction(formData: FormData) {
  const title = (formData.get("title") as string | null)?.trim() || null;
  const mode = formData.get("mode") as string;
  const sortOrder = parseInt((formData.get("sort_order") as string) || "0") || 0;

  const sb = createServiceClient();
  let fileUrl = "";
  let fileType = "gif";

  if (mode === "file") {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) throw new Error("No file provided.");

    fileType = getFileType(file.name);
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const bytes = await file.arrayBuffer();

    const { data, error } = await sb.storage
      .from(BUCKET)
      .upload(safeName, Buffer.from(bytes), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) throw new Error(error.message);

    const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(data.path);
    fileUrl = publicUrl;
  } else {
    fileUrl = (formData.get("linkUrl") as string | null ?? "").trim();
    if (!fileUrl) throw new Error("URL is required.");
    fileType = getFileType(fileUrl);
  }

  const { error } = await sb.from("hero_gallery").insert({
    title,
    file_url: fileUrl,
    file_type: fileType,
    sort_order: sortOrder,
    is_active: true,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/gallery");
}

export async function deleteGalleryItemAction(id: string, fileUrl: string) {
  const sb = createServiceClient();
  await sb.from("hero_gallery").delete().eq("id", id);

  const storagePath = storagePathFromUrl(fileUrl);
  if (storagePath) {
    await sb.storage.from(BUCKET).remove([storagePath]);
  }

  revalidatePath("/admin/gallery");
}

export async function toggleGalleryItemAction(id: string, isActive: boolean) {
  const sb = createServiceClient();
  await sb.from("hero_gallery").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/gallery");
}

export async function reorderGalleryItemAction(id: string, sortOrder: number) {
  const sb = createServiceClient();
  await sb.from("hero_gallery").update({ sort_order: sortOrder }).eq("id", id);
  revalidatePath("/admin/gallery");
}

export async function fetchGalleryItemsAction() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("hero_gallery")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}
