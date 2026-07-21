"use client";

import { CodeIcon, GlobeIcon, InformationCircleIcon, Layout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TerminalIcon } from "lucide-react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";

interface IntegrationGuideProps {
  clientId: string;
  baseUrl: string;
}

export function IntegrationGuide({ clientId, baseUrl }: IntegrationGuideProps) {
  const loaderUrl = `${baseUrl}/api/embed/${clientId}`;
  const widgetUrl = `${baseUrl}/widget/${clientId}`;

  const htmlSnippet = `<script src="${loaderUrl}" async></script>`;

  const reactSnippet = `"use client";

import { useEffect } from "react";

export const ChatBot = () => {
  useEffect(() => {
    // Prevent double injection
    if (document.getElementById("graft-loader")) return;

    const script = document.createElement("script");
    script.id = "graft-loader";
    script.src = "${loaderUrl}";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById("graft-loader");
      if (existing) document.body.removeChild(existing);
    };
  }, []);

  return null;
};`;

  const iframeSnippet = `<iframe 
  src="${widgetUrl}" 
  width="100%" 
  height="600px" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  allow="clipboard-write"
></iframe>`;

  return (
    <div className="w-full space-y-12">
      <Tabs defaultValue="modern" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-10 h-auto p-1 bg-muted/50">
          <TabsTrigger value="modern" className="py-3 gap-2">
            <HugeiconsIcon icon={GlobeIcon} className="size-4" />
            Modern Loader
          </TabsTrigger>
          <TabsTrigger value="react" className="py-3 gap-2">
            <HugeiconsIcon icon={CodeIcon} className="size-4" />
            React / Next.js
          </TabsTrigger>
          <TabsTrigger value="iframe" className="py-3 gap-2">
            <HugeiconsIcon icon={Layout01Icon} className="size-4" />
            Iframe Embed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modern" className="space-y-6 ">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-5 space-y-6">
              <div className="space-y-2">
                <Typography.H3>The Recommended Method</Typography.H3>
                <Typography.P className="text-muted-foreground leading-relaxed text-balance">
                  The modern loader is the easiest and most performant way to integrate. It asynchronously injects a
                  floating chat button and handles all widget states automatically.
                </Typography.P>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 w-full">
                  <HugeiconsIcon icon={InformationCircleIcon} className="size-5 text-emerald-400 mt-0.5 shrink-0" />
                  <Typography.Small className="text-emerald-300 font-normal leading-relaxed italic">
                    Best Practice: Place this{" "}
                    <Typography.Code className=" text-pink-400 border-primary/30 font-light font-mono">
                      script
                    </Typography.Code>{" "}
                    tag just before the closing{" "}
                    <Typography.Code className="text-pink-400 border-primary/30 font-light font-mono">
                      &lt;/body&gt;
                    </Typography.Code>{" "}
                    tag on your website for optimal page load performance.
                  </Typography.Small>
                </div>
              </div>
            </div>

            <div className="md:col-span-5">
              <CodeBlock code={htmlSnippet} language="html" wrap>
                <CodeBlockHeader className="bg-chart-3">
                  <CodeBlockTitle>
                    <HugeiconsIcon icon={GlobeIcon} className="size-3" />
                    HTML Snippet
                  </CodeBlockTitle>
                  <CodeBlockActions>
                    <CodeBlockCopyButton />
                  </CodeBlockActions>
                </CodeBlockHeader>
              </CodeBlock>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="react" className="space-y-6">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <Typography.H3>Framework Integration</Typography.H3>
                <Typography.P className="text-muted-foreground leading-relaxed text-balance">
                  For modern component-based applications, use a dedicated component to manage the assistant&apos;s
                  lifecycle. This ensures clean mounts and unmounts across route changes.
                </Typography.P>
              </div>
            </div>

            <div className="md:col-span-3">
              <CodeBlock code={reactSnippet} language="tsx" wrap>
                <CodeBlockHeader>
                  <CodeBlockTitle>
                    <HugeiconsIcon icon={CodeIcon} className="size-3" />
                    ChatBot.tsx
                  </CodeBlockTitle>
                  <CodeBlockActions>
                    <CodeBlockCopyButton />
                  </CodeBlockActions>
                </CodeBlockHeader>
              </CodeBlock>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="iframe" className="space-y-6">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <Typography.H3>Standard Iframe</Typography.H3>
                <Typography.P className="text-muted-foreground leading-relaxed text-balance">
                  Use the direct <Typography.Code>iframe</Typography.Code> embed if you need the assistant to live
                  within a specific container on your page, rather than as a floating element.
                </Typography.P>
              </div>
            </div>

            <div className="md:col-span-3">
              <CodeBlock code={iframeSnippet} language="html" wrap>
                <CodeBlockHeader>
                  <CodeBlockTitle>
                    <HugeiconsIcon icon={Layout01Icon} className="size-3" />
                    Iframe Snippet
                  </CodeBlockTitle>
                  <CodeBlockActions>
                    <CodeBlockCopyButton />
                  </CodeBlockActions>
                </CodeBlockHeader>
              </CodeBlock>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="glass-panel p-8 bg-muted/20 border-dashed border-2">
        <div className="flex gap-6 items-center">
          <div className="bg-primary/10 p-4 rounded-2xl shrink-0">
            <TerminalIcon className="size-8 text-primary" />
          </div>
          <div className="space-y-1">
            <Typography.H4>Fine-tune Your Assistant</Typography.H4>
            <Typography.P className="text-muted-foreground">
              Want to customise the name, greeting, or primary brand colour? Head over to your Bot Settings to
              personalise the experience.
            </Typography.P>
          </div>
        </div>
      </Card>
    </div>
  );
}
