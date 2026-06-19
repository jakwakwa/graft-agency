import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import { createStitchClient } from "@/lib/engagement/stitch-client";

/**
 * Same-origin proxy that re-fetches a Stitch screen screenshot on demand.
 *
 * The original `screenshotUrl` stored in `designConcepts` is a time-limited
 * signed Google URL that expires quickly (often within an hour). Instead of
 * proxying that dead URL, this endpoint calls `screen.getImage()` via the
 * Stitch SDK to obtain a **fresh** signed URL, fetches the image, and streams
 * the bytes back to the browser.
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

  if (!process.env.GCP_STITCH_SA_ACCOUNT_BASE64_KEY?.trim()) {
    return NextResponse.json({ error: "Stitch service account not configured" }, { status: 500 });
  }

  const { stitch, client } = await createStitchClient();
  try {
    const project = stitch.project(projectId);
    const screen = await project.getScreen(screenId);
    const freshUrl = await screen.getImage();

    if (!freshUrl) {
      return new NextResponse(null, { status: 404 });
    }

    // Fetch the actual image bytes from the fresh signed URL
    const upstream = await fetch(freshUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; GraftToday/1.0; +https://graft.today) stitch-image-proxy/1.0",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!upstream.ok) {
      // If the fresh URL also fails, return the upstream status
      return new NextResponse(null, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/png";
    const buf = await upstream.arrayBuffer();

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 1 hour on the client; the URL is re-fetched each time the
        // browser cache expires.
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stitch-image] Failed to fetch screen image:", message);
    return NextResponse.json({ error: "Failed to fetch screen image" }, { status: 502 });
  } finally {
    await client.close().catch(() => {});
  }
}
