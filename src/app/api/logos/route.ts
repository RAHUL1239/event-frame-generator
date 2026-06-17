import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { isPrivateBlobUrl } from "@/lib/logo-storage";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !isPrivateBlobUrl(url)) {
    return NextResponse.json({ error: "Invalid logo URL" }, { status: 400 });
  }

  try {
    const result = await get(url, { access: "private" });
    if (!result?.stream) {
      return NextResponse.json({ error: "Logo not found" }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Logo proxy error:", error);
    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  }
}
