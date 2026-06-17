import { getPlatformClientId } from "@/lib/auth/resolve-client";
import { inngest } from "@/lib/inngest/client";
import { runProspectingScheduledJob } from "@/lib/services/prospecting-scheduler.service";

export async function runProspectingInngestStep(): Promise<Record<string, unknown>> {
  const platformClientId = await getPlatformClientId();
  if (!platformClientId) {
    return { skipped: true, reason: "Platform client not found" };
  }

  const outcome = await runProspectingScheduledJob(platformClientId, new Date());

  if (outcome.status === "skipped") {
    return { skipped: true, reason: outcome.reason };
  }

  if (outcome.status === "error") {
    return { error: true, message: outcome.message };
  }

  return { ok: true, result: outcome.result };
}

export const prospectingScheduledTick = inngest.createFunction(
  {
    id: "prospecting-scheduled-tick",
    name: "Prospecting scheduled tick",
    triggers: [{ cron: "0 8 * * *" }],
  },
  async ({ step }) => {
    const summary = await step.run("execute-prospecting", runProspectingInngestStep);

    if (summary.error === true && typeof summary.message === "string") {
      throw new Error(summary.message);
    }

    return summary;
  },
);
