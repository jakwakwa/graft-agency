import prisma from "@/lib/db/prisma";
import { createJulesSession, findJulesSessionByLeadTag, type JulesSession } from "@/lib/services/jules-github.service";
import {
  canProvisionRenderService,
  findRenderServiceByName,
  provisionRenderService,
  type RenderProvisionedService,
} from "@/lib/services/render.service";

// ---------------------------------------------------------------- Jules ---

export async function ensureJulesSession(params: {
  leadId: string;
  companyName: string;
  companySlug: string;
  makePrompt: () => string;
  repoSource: string;
  startingBranch?: string;
}): Promise<{ session: JulesSession; created: boolean }> {
  const { leadId, companyName, companySlug, makePrompt, repoSource, startingBranch = "main" } = params;

  // 1. Already persisted — fetch and return.
  const existing = await prisma.productSpec.findUnique({
    where: { leadId },
    select: { julesSessionId: true, julesSessionIntentKey: true },
  });

  if (existing?.julesSessionId) {
    return {
      session: {
        sessionId: existing.julesSessionId,
        sessionUrl: `https://jules.google.com/task/${existing.julesSessionId}`,
        state: "QUEUED",
      },
      created: false,
    };
  }

  // 2. Intent key set but session id missing — prior run created the session but
  //    the DB write failed. Look up by the [leadId] tag embedded in the title.
  if (existing?.julesSessionIntentKey) {
    const found = await findJulesSessionByLeadTag(leadId);
    if (found) {
      await prisma.productSpec.update({
        where: { leadId },
        data: { julesSessionId: found.sessionId, julesState: found.state },
      });
      return { session: found, created: false };
    }
  }

  // 3. Claim the intent key atomically. If another concurrent run already claimed
  //    it (unique violation), a Prisma error is thrown here and Inngest will retry.
  await prisma.productSpec.update({
    where: { leadId },
    data: { julesSessionIntentKey: `${leadId}:v1` },
  });

  // 4. Create the session. Embed [leadId] sentinel in the title for recovery.
  const title = `Prospect landing page: ${companyName} [${leadId}]`;
  const session = await createJulesSession({
    repoSource,
    startingBranch,
    title,
    prompt: makePrompt(),
    requirePlanApproval: false,
  });

  // 5. Persist session id atomically with the intent key update.
  await prisma.productSpec.update({
    where: { leadId },
    data: { julesSessionId: session.sessionId, julesState: session.state, julesLastPolledAt: new Date() },
  });

  return { session, created: true };
}

// --------------------------------------------------------------- Render ---

export async function ensureRenderService(params: {
  leadId: string;
  companySlug: string;
  repoSource: string;
  rootDir: string;
  branch?: string;
}): Promise<{ service: RenderProvisionedService | null; created: boolean }> {
  if (!canProvisionRenderService()) return { service: null, created: false };

  const { leadId, companySlug, repoSource, rootDir, branch } = params;

  // 1. Already persisted.
  const existing = await prisma.productSpec.findUnique({
    where: { leadId },
    select: { renderServiceId: true, renderServiceIntentKey: true },
  });

  if (existing?.renderServiceId) {
    return {
      service: {
        serviceId: existing.renderServiceId,
        serviceName: `prospect-${companySlug}`,
        serviceUrl: null,
        raw: {},
      },
      created: false,
    };
  }

  // 2. Intent key set but service id missing — look up by deterministic name.
  const serviceName = `prospect-${companySlug}`.slice(0, 63);
  if (existing?.renderServiceIntentKey) {
    const found = await findRenderServiceByName(serviceName);
    if (found) {
      await prisma.productSpec.update({
        where: { leadId },
        data: {
          renderServiceId: found.serviceId,
          renderServiceName: found.serviceName,
          deploymentUrl: found.serviceUrl ?? undefined,
        },
      });
      return { service: found, created: false };
    }
  }

  // 3. Claim intent key.
  await prisma.productSpec.update({
    where: { leadId },
    data: { renderServiceIntentKey: `${leadId}:v1` },
  });

  // 4. Create service.
  const service = await provisionRenderService({ companySlug, julesRepoSource: repoSource, rootDir, branch });

  // 5. Persist.
  await prisma.productSpec.update({
    where: { leadId },
    data: {
      renderServiceId: service.serviceId,
      renderServiceName: service.serviceName,
      deploymentUrl: service.serviceUrl ?? undefined,
    },
  });

  return { service, created: true };
}
