import { Typography } from "@/components/ui/typography";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import { agentService } from "@/lib/services/agent.service";
import { BotSettingsForm, type KnowledgeSnippet } from "./_components/bot-settings-form";

export default async function PortalSettingsPage() {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  const config = await agentService.getConfig(clientId);

  const initialData = {
    ...config,
    knowledgeBase: config.knowledgeBase as unknown as KnowledgeSnippet[] | null,
  };

  return (
    <div className="w-full max-w-6xl space-y-8 mx-auto p-8">
      <div className="flex flex-col gap-2">
        <Typography.H1>Bot settings</Typography.H1>
        <Typography.Lead>Customise how your bot looks, sounds, and what it knows.</Typography.Lead>
      </div>

      <BotSettingsForm initialData={initialData} />
    </div>
  );
}
