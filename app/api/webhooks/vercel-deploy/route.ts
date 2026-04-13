import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { inngest } from "@/lib/inngest/client";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      type: string;
      deployment: { url: string; name: string };
    };

    if (body.type !== "deployment.ready") {
      return NextResponse.json({ skipped: true });
    }

    const deploymentUrl = `https://${body.deployment.url}`;
    const repoName = body.deployment.name; // Vercel project name matches repo name

    // Find the ProductSpec by matching the GitHub repo segment
    const spec = await prisma.productSpec.findFirst({
      where: { githubRepo: { contains: repoName } },
    });

    if (!spec) {
      return NextResponse.json({ skipped: true, reason: "No matching spec" }, { status: 200 });
    }

    await prisma.productSpec.update({
      where: { id: spec.id },
      data: { stage: "DEPLOYED", deploymentUrl },
    });

    await inngest.send({
      name: "engagement/deployment.ready",
      data: { leadId: spec.leadId, clientId: spec.clientId, deploymentUrl },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Vercel webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
