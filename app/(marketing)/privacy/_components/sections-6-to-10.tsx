import { Typography } from "@/components/ui/typography";
import { PolicySection } from "@/components/marketing/policy-section";
import { SubTable } from "./sub-table";
import React from "react";

export function Sections6To10() {
  return (
    <>
      {/* ─── Section 6 ─── */}
      <PolicySection id="legal-basis" title="6. Legal Basis for Processing">
        <Typography.P>
          Under POPIA, all processing of personal information must be lawful. The table below sets out the legal grounds
          we rely on:
        </Typography.P>
        <SubTable
          headers={["Processing activity", "Legal basis"]}
          rows={[
            ["Account registration and authentication", "Contractual necessity"],
            ["Subscription and billing management", "Contractual necessity"],
            ["Transactional service communications", "Contractual necessity"],
            ["Security monitoring and fraud prevention", "Legitimate interest"],
            ["Anonymised analytics for service improvement", "Legitimate interest"],
            ["Compliance with legal or regulatory obligations", "Legal obligation"],
          ]}
        />
      </PolicySection>

      {/* ─── Section 7 ─── */}
      <PolicySection id="sub-processors" title="7. Sub-Processors and Third-Party Services">
        <Typography.P>
          We share your personal information only with trusted third-party service providers who process it on our
          behalf and under our instructions. Below is our current list of sub-processors:
        </Typography.P>
        <SubTable
          headers={["Provider", "Purpose", "Location"]}
          rows={[
            ["Clerk (clerk.com)", "User authentication and identity management", "United States"],
            [
              "Paddle (paddle.com)",
              "Payment processing and subscription management — Merchant of Record",
              "United Kingdom / United States",
            ],
            ["Vercel (vercel.com)", "Application hosting and global content delivery", "United States (global CDN)"],
            [
              "Google (Gemini, Stitch, Jules)",
              "AI model inference, design generation, and code generation",
              "United States",
            ],
            ["Inngest (inngest.com)", "Background job orchestration", "United States"],
            ["Resend (resend.com)", "Transactional email delivery", "United States"],
            ["Cal.com", "Appointment and booking scheduling", "United States"],
            ["Cloud database (PostgreSQL)", "Encrypted relational data storage (TLS in transit)", "Cloud-hosted"],
          ]}
        />
        <Typography.P>
          All sub-processors are contractually required to process data in accordance with our instructions and
          applicable data protection law. We review our sub-processor list regularly and will update this policy if it
          changes.
        </Typography.P>
      </PolicySection>

      {/* ─── Section 8 ─── */}
      <PolicySection id="retention" title="8. Data Retention">
        <Typography.P>
          We keep your personal information for as long as your account is active or as otherwise required by law.
          Specifically:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>Account and usage data is deleted within 90 days of account closure</li>
          <li>
            Billing records are retained for up to 7 years to satisfy South African tax and commercial law requirements
          </li>
          <li>
            Chatbot conversation logs are retained for the period configured in your dashboard; you may request earlier
            deletion at any time
          </li>
          <li>Where we are legally required to retain data for longer, we will do so and inform you if practicable</li>
        </ul>
      </PolicySection>

      {/* ─── Section 9 ─── */}
      <PolicySection id="security" title="9. Security">
        <Typography.P>
          We implement reasonable technical and organisational measures to protect your personal information against
          unauthorised access, accidental loss, alteration, or destruction. These measures include:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>All data in transit is encrypted using TLS</li>
          <li>Database connections require SSL/TLS</li>
          <li>Production system access is restricted to authorised personnel</li>
          <li>Authentication is managed by Clerk with industry-standard credential security</li>
          <li>Third-party payment security is delegated entirely to Paddle (PCI-DSS compliant)</li>
        </ul>
        <Typography.P>
          No method of transmission over the internet or electronic storage is completely secure. If we become aware of
          a data breach that poses a risk to your rights and freedoms, we will notify you and the Information Regulator
          as required by POPIA Section 22.
        </Typography.P>
      </PolicySection>

      {/* ─── Section 10 ─── */}
      <PolicySection id="rights" title="10. Your Rights as a Data Subject">
        <Typography.P>
          Under POPIA (Sections 23–25), you have the following rights in relation to your personal information:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>
            <strong className="text-foreground">Right of access:</strong> Request a description of the personal
            information we hold about you and how it is processed
          </li>
          <li>
            <strong className="text-foreground">Right to correction:</strong> Request correction of inaccurate,
            irrelevant, outdated, or incomplete information
          </li>
          <li>
            <strong className="text-foreground">Right to deletion:</strong> Request deletion or destruction of personal
            information that is no longer lawfully retained
          </li>
          <li>
            <strong className="text-foreground">Right to object:</strong> Object to the processing of your personal
            information on grounds relating to your particular situation
          </li>
          <li>
            <strong className="text-foreground">Right to complain:</strong> Lodge a complaint with the Information
            Regulator of South Africa
          </li>
        </ul>
        <Typography.P>
          To exercise any of these rights, contact our Information Officer at{" "}
          <a
            href="mailto:hello@graft.today"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
          >
            hello@graft.today
          </a>
          . We will respond within a reasonable time, and in any event within the timeframes required by POPIA.
        </Typography.P>
        <div className="mt-4 rounded-lg border border-border px-4 py-3 text-sm">
          <p className="font-semibold text-foreground mb-1">Information Regulator of South Africa</p>
          <p className="text-muted-foreground">
            If you believe we have handled your personal information unlawfully, you may lodge a formal complaint with
            the Information Regulator at{" "}
            <a
              href="https://inforegulator.org.za"
              className="underline underline-offset-4 text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              inforegulator.org.za
            </a>
            .
          </p>
        </div>
      </PolicySection>
    </>
  );
}
