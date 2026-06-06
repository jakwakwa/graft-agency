import { stitch } from "@google/stitch-sdk";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";

/**
 * Same-origin proxy that re-fetches a Stitch screen's HTML on demand and
 * serves it as `text/html` so the browser renders the page inline.
 *
 * The `htmlUrl` stored in `designConcepts` is a time-limited signed GCS URL
 * that (a) expires quickly and (b) forces a file download via
 * `Content-Disposition: attachment`. This endpoint calls `screen.getHtml()`
 * via the Stitch SDK to obtain a fresh URL, fetches the bytes, and re-serves
 * them with the correct content-type so the browser opens it as a page.
 *
 * Query params:
 *   - `projectId` (required) — Stitch project ID
 *   - `screenId`  (required) — Stitch screen ID
 */
export async function GET(req: NextRequest): Promise<Response> {
  const authResult = await requirePlatformAccess();
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  const screenId = req.nextUrl.searchParams.get("screenId");

  if (!projectId || !screenId) {
    return NextResponse.json({ error: "Missing projectId or screenId" }, { status: 400 });
  }

  if (!process.env.STITCH_API_KEY?.trim()) {
    return NextResponse.json({ error: "STITCH_API_KEY not configured" }, { status: 500 });
  }

  try {
    const project = stitch.project(projectId);
    const screen = await project.getScreen(screenId);
    const freshUrl = await screen.getHtml();

    if (!freshUrl) {
      return new NextResponse(null, { status: 404 });
    }

    const upstream = await fetch(freshUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; GraftToday/1.0; +https://graft.today) stitch-html-proxy/1.0",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const html = await upstream.text();

    return new NextResponse(html, {
      status: 200,
      headers: {
        // Force inline rendering — override the GCS attachment disposition
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
        // Needed so the HTML can load its own relative/CDN assets
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stitch-html] Failed to fetch screen HTML:", message);
    return NextResponse.json({ error: "Failed to fetch screen HTML" }, { status: 502 });
  }
}
