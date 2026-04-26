import { ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { redirectToAccessRequired, requireAuthOrSignIn } from "@/lib/auth/guards";
import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";

export default async function PortalEmbedPage() {
  await requireAuthOrSignIn();

  const clientId = await resolveClientIdFromAuth();
  if (!clientId) redirectToAccessRequired();

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://kona.agency";

  const floatingSnippet = `<script src="${origin}/api/embed/${clientId}" async></script>`;
  const iframeSnippet = `<iframe src="${origin}/widget/${clientId}" width="100%" height="500px" style="border:none;border-radius:12px"></iframe>`;

  return (
    <div className="w-full max-w-4xl space-y-8 mx-auto p-8">
      <div className="flex flex-col gap-2">
        <Typography.H1>Add your bot to your site</Typography.H1>
        <Typography.Lead>Drop one of these snippets into your website's HTML.</Typography.Lead>
      </div>

      <div className="grid gap-8">
        {/* Floating Button Snippet */}
        <Card>
          <CardHeader>
            <CardTitle>Floating chat button (recommended)</CardTitle>
            <CardDescription>This adds a chat button to the bottom-right corner of your site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock code={floatingSnippet} language="html">
              <CodeBlockHeader>
                <CodeBlockTitle>Script Tag</CodeBlockTitle>
                <CodeBlockActions>
                  <CodeBlockCopyButton />
                </CodeBlockActions>
              </CodeBlockHeader>
            </CodeBlock>
            <Typography.Small className="text-muted-foreground">
              Paste this before the closing &lt;/body&gt; tag on all pages where you want the bot to appear.
            </Typography.Small>
          </CardContent>
        </Card>

        {/* Inline Iframe Snippet */}
        <Card>
          <CardHeader>
            <CardTitle>Inline iframe</CardTitle>
            <CardDescription>For pages where you want the chat embedded directly into the content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock code={iframeSnippet} language="html">
              <CodeBlockHeader>
                <CodeBlockTitle>Iframe Tag</CodeBlockTitle>
                <CodeBlockActions>
                  <CodeBlockCopyButton />
                </CodeBlockActions>
              </CodeBlockHeader>
            </CodeBlock>
          </CardContent>
        </Card>

        {/* Preview Link */}
        <div className="flex justify-center">
          <Link
            href={`/widget/${clientId}`}
            target="_blank"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Open my bot in a new tab
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
