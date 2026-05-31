import { NextRequest, NextResponse } from "next/server";

async function fetchWithBypass(fileId: string): Promise<Response> {
  const base = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;

  // First attempt with confirm=t (works for most files)
  let res = await fetch(`${base}&confirm=t`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DoDoApp/1.0)" },
    redirect: "follow",
  });

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) return res;

  // Confirmation page appeared — extract token and retry
  const html = await res.text();
  const tokenMatch =
    html.match(/confirm=([0-9A-Za-z_-]+)/) ||
    html.match(/name="confirm"\s+value="([^"]+)"/);

  if (!tokenMatch) throw new Error("Cannot bypass Google Drive confirmation page.");

  res = await fetch(`${base}&confirm=${tokenMatch[1]}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DoDoApp/1.0)" },
    redirect: "follow",
  });

  return res;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  if (!fileId || !/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
    return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
  }

  try {
    const upstream = await fetchWithBypass(fileId);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Drive returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const headers = new Headers();
    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const contentDisposition = upstream.headers.get("content-disposition");
    const contentLength = upstream.headers.get("content-length");

    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "no-store");
    if (contentDisposition) headers.set("Content-Disposition", contentDisposition);
    if (contentLength) headers.set("Content-Length", contentLength);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Download proxy failed" },
      { status: 500 }
    );
  }
}
