import { CopyIcon } from "lucide-react";
import { CodeBlock, CodeBlockCopyButton } from "@/components/ai-elements/code-block";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export default function PortalEmbedPage() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center p-8">
      <Typography.H1>Kona Embed</Typography.H1>
      <Typography.P className="mt-2">Copy your iframe code and paste it on your website.</Typography.P>

      <Card className="mt-6 w-full max-w-2xl">
        <CodeBlock
          code="<iframe src='https://kona.agency/widget/1234567890' width='100%' height='500px'></iframe>"
          language="html"
        />
        <CodeBlockCopyButton size="lg" className="p-2 w-fit mx-auto" variant="default">
          <CopyIcon size={16} /> Copy
        </CodeBlockCopyButton>
      </Card>
      <Card className="mt-6 w-full max-w-2xl">
        <Typography.P>Copy your activation (webhook) token to enable webhook events for your Kona Bot.</Typography.P>
        <CodeBlock code="1234567890" language="bash" />
        <CodeBlockCopyButton size="sm" className="p-2 w-fit mx-auto" variant="default">
          <CopyIcon size={16} /> Copy
        </CodeBlockCopyButton>
      </Card>
    </section>
  );
}
