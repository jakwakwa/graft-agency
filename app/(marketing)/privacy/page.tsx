import { Typography } from "@/components/ui/typography";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Typography.H1>Privacy</Typography.H1>
      <Typography.P className="mt-4 text-muted-foreground">
        We process personal data in line with applicable law. For the full privacy notice or data subject requests,
        email{" "}
        <a href="mailto:hello@graft.today" className="font-medium text-foreground underline underline-offset-4">
          hello@graft.today
        </a>
        .
      </Typography.P>
    </div>
  );
}
