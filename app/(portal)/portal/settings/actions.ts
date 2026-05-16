"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import { cacheTags, invalidateCacheTags } from "@/lib/db/cache";
import prisma from "@/lib/db/prisma";

const botSettingsSchema = z.object({
  agentName: z.string().min(1, "Bot name is required"),
  greetingMessage: z.string().min(1, "Greeting message is required"),
  systemPrompt: z.string().min(1, "Instructions are required"),
  widgetPrimaryColour: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  calComUsername: z.string().optional().nullable(),
  defaultEventSlug: z.string().optional().nullable(),
  knowledgeBase: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .optional()
    .nullable(),
});

function optionalFormString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveBotSettingsAction(formData: FormData) {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) throw new Error("Unauthorized");

  const rawKnowledgeBase = formData.get("knowledgeBase");
  let knowledgeBase = null;
  if (typeof rawKnowledgeBase === "string") {
    try {
      knowledgeBase = JSON.parse(rawKnowledgeBase);
    } catch {
      knowledgeBase = [];
    }
  }

  const data = botSettingsSchema.parse({
    agentName: formData.get("agentName"),
    greetingMessage: formData.get("greetingMessage"),
    systemPrompt: formData.get("systemPrompt"),
    widgetPrimaryColour: formData.get("widgetPrimaryColour") || "#7c3aed",
    calComUsername: optionalFormString(formData.get("calComUsername")),
    defaultEventSlug: optionalFormString(formData.get("defaultEventSlug")),
    knowledgeBase,
  });

  await prisma.agentConfig.upsert({
    where: { clientId },
    create: {
      clientId,
      ...data,
      knowledgeBase: data.knowledgeBase ?? [],
    },
    update: {
      ...data,
      knowledgeBase: data.knowledgeBase ?? [],
    },
  });

  await invalidateCacheTags([cacheTags.agentConfig(clientId)]);

  revalidatePath("/portal/settings");
  revalidatePath("/portal/embed");
  // Also revalidate the widget route if possible, though it's an API/iframe

  return { success: true };
}
