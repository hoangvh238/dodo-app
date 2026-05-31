import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_BUCKETS = ["releases", "gallery"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bucket, fileName, contentType } = await req.json();
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }

  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const sb = createServiceClient();

  const { data, error } = await sb.storage.from(bucket).createSignedUploadUrl(safeName);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = sb.storage.from(bucket).getPublicUrl(safeName);

  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path, publicUrl });
}
