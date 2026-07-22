import Link from "next/link";
import { Typography } from "@/components/ui/typography";
import { Sections1To5 } from "./_components/sections-1-to-5";
import { Sections6To10 } from "./_components/sections-6-to-10";
import { Sections11To15 } from "./_components/sections-11-to-15";

export const metadata = {
  title: "Privacy Policy — GRAFT.TODAY",
  description: "How GRAFT.TODAY collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="inline-block text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
      >
        ← Back to home
      </Link>

      <div className="mb-4">
        <Typography.H1 className="block">Privacy Policy</Typography.H1>
      </div>
      <Typography.Muted>Last updated: 21 June 2026</Typography.Muted>

      <Typography.Lead className="mt-8">
        GRAFT.TODAY respects your privacy and is committed to protecting the personal information you share with us.
        This policy explains what data we collect, why we collect it, how we protect it, and what rights you have as a
        data subject.
      </Typography.Lead>

      <Sections1To5 />
      <Sections6To10 />
      <Sections11To15 />
      <div className="mt-16 pt-8 border-t border-border">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
