import { Typography } from "@/components/ui/typography";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Typography.H1>Terms of service</Typography.H1>
      <Typography.P className="mt-4 text-muted-foreground">
        These terms govern use of GRAFT.TODAY. For a copy of the full agreement or commercial terms, contact{" "}
        <a href="mailto:hello@graft.today" className="font-medium text-foreground underline underline-offset-4">
          hello@graft.today
        </a>
        .
      </Typography.P>
    </div>
  );
}
