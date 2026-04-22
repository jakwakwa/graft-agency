import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
): Promise<NextResponse> {
  const authResult = await requirePlatformAccess();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  const { leadId } = await params;
  const spec = await prisma.productSpec.findUnique({
    where: { leadId },
    select: {
      stage: true,
      profiledNeeds: true,
      prdContent: true,
      designConcepts: true,
      chosenDesign: true,
      githubRepo: true,
      githubIssueUrl: true,
      julesSessionId: true,
      julesState: true,
      julesLastPolledAt: true,
      pullRequestUrl: true,
      deploymentUrl: true,
      offerSentAt: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!spec) return NextResponse.json({ stage: "NOT_STARTED" });
  return NextResponse.json(spec);
}
