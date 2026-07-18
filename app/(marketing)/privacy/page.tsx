import Link from "next/link";
import { Typography } from "@/components/ui/typography";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-8">
      <Typography.H3 className="block mb-4 text-foreground">{title}</Typography.H3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SubTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-muted">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 text-left font-semibold border-b border-border whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0 even:bg-muted/30">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

      {/* ─── Section 1 ─── */}
      <Section id="about" title="1. About GRAFT.TODAY">
        <Typography.P>
          GRAFT.TODAY is operated by <strong>Jacob Kotzee trading as GRAFT.TODAY</strong>, a sole proprietor registered
          in the Republic of South Africa. We are the &ldquo;responsible party&rdquo; for the personal information of
          our subscribers and website visitors, as defined by the Protection of Personal Information Act 4 of 2013
          (&ldquo;POPIA&rdquo;).
        </Typography.P>
        <Typography.P>
          This Privacy Policy covers our website at{" "}
          <a
            href="https://graft.today"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
          >
            https://graft.today
          </a>
          , the subscriber dashboard, any embedded chatbot widgets delivered through our service, and all related
          GRAFT.TODAY products.
        </Typography.P>
        <ul className="list-none space-y-1 text-sm text-muted-foreground mt-2">
          <li>
            <strong className="text-foreground">Information Officer:</strong> Jacob Kotzee &mdash; hello@graft.today
          </li>
          <li>
            <strong className="text-foreground">Physical address:</strong> Parkview Heights, Cape Town, Western Cape,
            7550, South Africa
          </li>
        </ul>
      </Section>

      {/* ─── Section 2 ─── */}
      <Section id="roles" title="2. Our Two Roles — Responsible Party and Operator">
        <Typography.P>
          Because GRAFT.TODAY is a multi-tenant platform, we process personal information in two distinct capacities:
        </Typography.P>
        <div className="space-y-4 mt-2">
          <div className="rounded-lg border border-border px-4 py-3">
            <p className="font-semibold text-sm mb-1">Responsible party (for our subscribers)</p>
            <p className="text-sm text-muted-foreground">
              When you create an account and use GRAFT.TODAY, we determine the purpose and means of processing your
              personal information — your account details, billing data, and platform usage. We are the responsible
              party under POPIA for this data.
            </p>
          </div>
          <div className="rounded-lg border border-border px-4 py-3">
            <p className="font-semibold text-sm mb-1">Operator (for your customers&rsquo; data)</p>
            <p className="text-sm text-muted-foreground">
              When your customers interact with your embedded chatbot widget, <em>you</em> are the responsible party for
              their personal information and GRAFT.TODAY acts as your operator (processor), handling that data only on
              your instructions. Your end-users&rsquo; rights are primarily exercised through you. If you deploy
              GRAFT.TODAY services to your own customers, you should disclose GRAFT.TODAY as a sub-processor in your own
              privacy notices.
            </p>
          </div>
        </div>
      </Section>

      {/* ─── Section 3 ─── */}
      <Section id="data-collected" title="3. Personal Information We Collect About You (as a Subscriber)">
        <Typography.P>
          We collect the following categories of personal information when you register for and use GRAFT.TODAY:
        </Typography.P>
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="font-semibold text-foreground mb-1">Account and identity</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Name and email address (collected via Clerk authentication)</li>
              <li>Organisation or company name</li>
              <li>Profile picture (optional, if provided)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Billing and subscription</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Subscription plan, status, and renewal date</li>
              <li>Payment history and invoice records</li>
            </ul>
            <p className="text-muted-foreground mt-1">
              All payment card data is processed exclusively by{" "}
              <a
                href="https://www.paddle.com"
                className="underline underline-offset-4 text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                Paddle
              </a>{" "}
              (our Merchant of Record). GRAFT.TODAY never stores or has access to your card number, CVV, or full payment
              details.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Usage and technical data</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Pages visited, features used, and session timestamps</li>
              <li>Device type and browser</li>
              <li>IP address (used for security and abuse prevention, not for advertising)</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ─── Section 4 ─── */}
      <Section id="operator-data" title="4. Data We Process on Your Behalf (as an Operator)">
        <Typography.P>
          When you use GRAFT.TODAY&rsquo;s products to serve your own customers, we process the following categories of
          data as your operator:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>
            <strong className="text-foreground">Chatbot conversations:</strong> Messages exchanged between your
            end-users and your deployed GraftBot widget, including personal information they voluntarily share (name,
            email, contact details, queries).
          </li>
          <li>
            <strong className="text-foreground">Leads:</strong> Contact details and engagement data your end-users share
            through your deployed GraftBot widget.
          </li>
          <li>
            <strong className="text-foreground">Appointment data:</strong> Booking information integrated via Cal.com on
            your behalf.
          </li>
        </ul>
        <Typography.P>
          You are responsible for ensuring you have a lawful basis to collect and process your own customers&rsquo;
          data, and for complying with applicable data protection law in your jurisdiction.
        </Typography.P>
      </Section>

      {/* ─── Section 5 ─── */}
      <Section id="use" title="5. How We Use Your Personal Information">
        <Typography.P>We process your personal information only for the following purposes:</Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>
            <strong className="text-foreground">Service delivery:</strong> Creating and managing your account,
            authenticating sessions, and delivering platform features
          </li>
          <li>
            <strong className="text-foreground">Billing:</strong> Processing your subscription via Paddle, handling
            invoices and renewal events
          </li>
          <li>
            <strong className="text-foreground">Transactional communications:</strong> Sending receipts, onboarding
            guides, important service notices, and alerts (via Resend)
          </li>
          <li>
            <strong className="text-foreground">Security and fraud prevention:</strong> Monitoring for abuse, detecting
            suspicious activity, and maintaining audit logs
          </li>
          <li>
            <strong className="text-foreground">Service improvement:</strong> Analysing aggregated, anonymised usage
            patterns to improve platform performance and features
          </li>
        </ul>
        <Typography.P>
          We <strong>do not sell</strong> your personal information to third parties, and we{" "}
          <strong>do not use your data</strong> for targeted advertising.
        </Typography.P>
      </Section>

      {/* ─── Section 6 ─── */}
      <Section id="legal-basis" title="6. Legal Basis for Processing">
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
      </Section>

      {/* ─── Section 7 ─── */}
      <Section id="sub-processors" title="7. Sub-Processors and Third-Party Services">
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
      </Section>

      {/* ─── Section 8 ─── */}
      <Section id="retention" title="8. Data Retention">
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
      </Section>

      {/* ─── Section 9 ─── */}
      <Section id="security" title="9. Security">
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
      </Section>

      {/* ─── Section 10 ─── */}
      <Section id="rights" title="10. Your Rights as a Data Subject">
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
      </Section>

      {/* ─── Section 11 ─── */}
      <Section id="cookies" title="11. Cookies and Tracking">
        <Typography.P>
          GRAFT.TODAY uses only essential cookies — those strictly necessary for session management and authentication.
          We do not use advertising cookies, third-party tracking pixels, or cross-site tracking technology.
        </Typography.P>
        <Typography.P>
          You may configure cookie preferences in your browser settings. Disabling essential cookies will impair your
          ability to log in and use the platform.
        </Typography.P>
      </Section>

      {/* ─── Section 12 ─── */}
      <Section id="transfers" title="12. International Data Transfers">
        <Typography.P>
          GRAFT.TODAY serves customers globally. Your personal information may be processed by our sub-processors on
          servers located outside South Africa — primarily in the United States and European Union. In these cases, we
          take reasonable steps to ensure that cross-border transfers are subject to appropriate safeguards, consistent
          with POPIA Section 72.
        </Typography.P>
        <Typography.P>
          By using GRAFT.TODAY, you acknowledge that your personal information may be transferred to and processed in
          jurisdictions outside South Africa.
        </Typography.P>
      </Section>

      {/* ─── Section 13 ─── */}
      <Section id="direct-marketing" title="13. Electronic Direct Marketing">
        <Typography.P>
          We will only send you marketing communications if you have opted in, or where we have an existing business
          relationship that permits it, in compliance with POPIA Section 69. You may opt out of marketing emails at any
          time by clicking the unsubscribe link in any email or contacting us at{" "}
          <a
            href="mailto:hello@graft.today"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
          >
            hello@graft.today
          </a>
          .
        </Typography.P>
        <Typography.P>
          <strong>Note for GRAFT.TODAY subscribers:</strong> If you use the services to communicate with your own
          customers or leads, you are responsible for ensuring those communications comply with applicable electronic
          direct marketing laws in your jurisdiction (including POPIA Section 69 in South Africa, CAN-SPAM in the United
          States, and the GDPR in the European Union).
        </Typography.P>
      </Section>

      {/* ─── Section 14 ─── */}
      <Section id="changes" title="14. Changes to This Policy">
        <Typography.P>
          We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last updated&rdquo;
          date at the top of this page. Where changes are material, we will notify active subscribers by email at least
          30 days before they take effect. Continued use of GRAFT.TODAY after the effective date constitutes acceptance
          of the revised policy.
        </Typography.P>
      </Section>

      {/* ─── Section 15 ─── */}
      <Section id="contact" title="15. Contact Us">
        <Typography.P>
          For any privacy-related questions, data subject access requests, or to reach our Information Officer:
        </Typography.P>
        <ul className="list-none space-y-1 text-sm mt-2">
          <li>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:hello@graft.today"
              className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
            >
              hello@graft.today
            </a>
          </li>
          <li>
            <strong>Information Officer:</strong> Jacob Kotzee
          </li>
          <li>
            <strong>Operator:</strong> Jacob Kotzee trading as GRAFT.TODAY
          </li>
          <li>
            <strong>Physical address:</strong> Parkview Heights, Cape Town, WC, 7550, South Africa
          </li>
        </ul>
        <Typography.P>
          <em>
            This policy is a good-faith effort to comply with POPIA and applicable international data protection law.
          </em>
        </Typography.P>
      </Section>

      <div className="mt-16 pt-8 border-t border-border">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
