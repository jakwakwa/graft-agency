import {
  isWithinUtcCronDriftWindow,
  shouldSkipDuplicateRun,
} from "@/lib/cron/prospecting-utc";
import prisma from "@/lib/db/prisma";
import { geminiProspectingService } from "@/lib/services/gemini-prospecting.service";

export type ProspectingScheduleOutcome =
  | { status: "skipped"; reason: string }
  | { status: "ok"; result: unknown }
  | { status: "error"; message: string };

export async function runProspectingScheduledJob(
  platformClientId: string,
  now: Date = new Date(),
): Promise<ProspectingScheduleOutcome> {
  const config = await prisma.prospectingConfig.findUnique({
    where: { clientId: platformClientId },
  });

  if (!config || config.cronEnabled === false) {
    return { status: "skipped", reason: "Cron disabled" };
  }

  if (config.cronStartDate && config.cronStartDate > now) {
    return { status: "skipped", reason: "Cron: start date not yet reached" };
  }

  const frequency = config.cronFrequency === "weekly" ? "weekly" : "daily";

  if (
    frequency === "weekly" &&
    config.cronDay !== null &&
    config.cronDay !== undefined
  ) {
    if (now.getUTCDay() !== config.cronDay) {
      return { status: "skipped", reason: "Cron: not scheduled for today" };
    }
  }

  if (!isWithinUtcCronDriftWindow(now, config.cronTime)) {
    return { status: "skipped", reason: "Cron: outside configured UTC time window" };
  }

  if (shouldSkipDuplicateRun(frequency, config.cronDay, config.lastCronRunAt, now)) {
    return { status: "skipped", reason: "Cron: already ran for this period" };
  }

  if (!config.searchCriteria) {
    return { status: "skipped", reason: "No search criteria configured" };
  }

  try {
    const criteria = config.searchCriteria as {
      industries?: string[];
      locations?: string[];
      keywords?: string[];
    };
    const result = await geminiProspectingService.findAndAuditProspects({
      clientId: platformClientId,
      searchCriteria: criteria,
      valueProposition: config.valueProposition,
    });

    await prisma.prospectingConfig.update({
      where: { clientId: platformClientId },
      data: { lastCronRunAt: now },
    });

    return { status: "ok", result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prospecting failed";
    return { status: "error", message };
  }
}
