import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";

function isAllowedGoogleUserContentHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "lh3.googleusercontent.com" || h.endsWith(".googleusercontent.com");
}

/**
 * Same-origin proxy for Stitch / Google-hosted previews. Browsers often get 429
 * when loading lh3.googleusercontent.com directly (hotlink + referrer limits).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const authResult = await requirePlatformAccess();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !isAllowedGoogleUserContentHost(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 (compatible; GraftToday/1.0; +https://graft.today) engagement-image-proxy/1.0",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const buf = await upstream.arrayBuffer();

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
