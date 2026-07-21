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

export const metadata = {
  title: "Terms of Service — GRAFT.TODAY",
  description: "The terms and conditions that govern your use of GRAFT.TODAY.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="inline-block text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
      >
        ← Back to home
      </Link>

      <div className="mb-4">
        <Typography.H1 className="block">Terms of Service</Typography.H1>
      </div>
      <Typography.Muted>Last updated: 21 June 2026</Typography.Muted>

      <Typography.Lead className="mt-8">
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of GRAFT.TODAY. Please read them
        carefully. By registering for or using GRAFT.TODAY, you agree to be bound by these Terms.
      </Typography.Lead>

      {/* ─── Section 1 ─── */}
      <Section id="about" title="1. About GRAFT.TODAY">
        <Typography.P>
          GRAFT.TODAY is operated by <strong>Jacob Kotzee trading as GRAFT.TODAY</strong>, a sole proprietor registered
          in the Republic of South Africa (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;). Our platform is
          accessible at{" "}
          <a
            href="https://graft.today"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
          >
            https://graft.today
          </a>
          .
        </Typography.P>
        <Typography.P>
          These Terms constitute a binding legal agreement between you (the subscriber or user) and us. References to
          &ldquo;you&rdquo; or &ldquo;your&rdquo; mean the person or entity that registers for or uses GRAFT.TODAY.
        </Typography.P>
      </Section>

      {/* ─── Section 2 ─── */}
      <Section id="services" title="2. The Services">
        <Typography.P>GRAFT.TODAY provides the following services to subscribers:</Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>
            <strong className="text-foreground">AI chatbot widget (GRAFT AI Assistant):</strong> An embeddable chatbot powered by
            AI that engages your website visitors, captures leads, and answers queries on your behalf
          </li>
          <li>
            <strong className="text-foreground">Lead management and appointment booking:</strong> Tools for reviewing
            leads captured by your chatbot, managing conversations, and booking appointments through the Cal.com
            integration
          </li>
          <li>
            <strong className="text-foreground">GRAFT AI Assistant website setup packages:</strong> Fixed-scope software
            implementation packages that deliver a landing page or multi-page site with the GRAFT AI Assistant widget installed
            and configured, as described on our pricing page — not standalone design or marketing agency services
          </li>
          <li>
            <strong className="text-foreground">Subscriber dashboard:</strong> A management interface for conversations,
            leads, billing, and settings
          </li>
        </ul>
        <Typography.P>
          We reserve the right to modify, suspend, or discontinue any part of the services at any time with reasonable
          notice. Features described as &ldquo;beta&rdquo; or &ldquo;preview&rdquo; are provided as-is and may change or
          be removed without notice.
        </Typography.P>
      </Section>

      {/* ─── Section 3 ─── */}
      <Section id="accounts" title="3. Accounts and Registration">
        <Typography.P>
          You must create an account to access GRAFT.TODAY. Account creation and identity management is handled by Clerk
          (clerk.com). By creating an account, you agree to:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>Provide accurate, complete, and current information during registration</li>
          <li>Maintain the security of your account credentials</li>
          <li>Notify us immediately of any unauthorised use of your account</li>
          <li>Accept responsibility for all activity that occurs under your account</li>
        </ul>
        <Typography.P>
          You must be at least 18 years old (or the age of majority in your jurisdiction) to create an account. We
          reserve the right to refuse registration or suspend accounts at our sole discretion.
        </Typography.P>
      </Section>

      {/* ─── Section 4 ─── */}
      <Section id="payments" title="4. Payments, Billing, and Subscriptions">
        <Typography.P>
          <strong>Merchant of Record:</strong> All payment processing for GRAFT.TODAY subscriptions is handled by{" "}
          <a
            href="https://paddle.com"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            Paddle
          </a>{" "}
          (paddle.com), which acts as our Merchant of Record. Paddle is responsible for charging your payment method,
          issuing invoices and receipts, and managing VAT, GST, and sales tax compliance globally. By subscribing, you
          also agree to Paddle&rsquo;s terms and policies at{" "}
          <a
            href="https://www.paddle.com/legal"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            paddle.com/legal
          </a>
          .
        </Typography.P>
        <Typography.P>
          <strong>Subscription:</strong> GRAFT.TODAY is provided on a subscription basis (monthly or annual as chosen at
          checkout). Your subscription starts when Paddle confirms payment and provides access to the selected
          plan&rsquo;s features.
        </Typography.P>
        <Typography.P>
          <strong>Automatic renewal:</strong> Subscriptions renew automatically at the end of each billing period.
          Paddle will charge your payment method on file unless you cancel before the renewal date.
        </Typography.P>
        <Typography.P>
          <strong>Refunds:</strong> Refund requests are handled by Paddle in accordance with their Merchant of Record
          refund policy. For billing disputes or refund requests, contact Paddle support directly through your invoice
          or at{" "}
          <a
            href="https://paddle.com"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            paddle.com
          </a>
          .
        </Typography.P>
        <Typography.P>
          <strong>Price changes:</strong> We reserve the right to change subscription prices. We will give you at least
          30 days&rsquo; advance notice of any price change by email and/or in-platform notification. Your continued
          subscription after the effective date constitutes acceptance of the new price.
        </Typography.P>
      </Section>

      {/* ─── Section 5 ─── */}
      <Section id="acceptable-use" title="5. Acceptable Use">
        <Typography.P>
          You may use GRAFT.TODAY only for lawful purposes and in accordance with these Terms. You agree not to:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>Use the services to process personal data you do not have a lawful right or basis to process</li>
          <li>
            Use the services to send unsolicited communications in violation of applicable laws (including POPIA Section
            69 in South Africa, CAN-SPAM in the US, or the GDPR in the EU)
          </li>
          <li>Reverse-engineer, decompile, disassemble, or attempt to extract the source code of the platform</li>
          <li>Resell, sublicense, or white-label the platform without our express written permission</li>
          <li>
            Introduce malware, malicious code, or attempt unauthorised access to platform systems or infrastructure
          </li>
          <li>Impersonate another person, organisation, or entity</li>
          <li>Use the services in any way that could bring GRAFT.TODAY into disrepute</li>
          <li>Violate any applicable local, national, or international law or regulation</li>
        </ul>
        <Typography.P>
          Automated features (AI chatbot responses, engagement jobs, API calls) are subject to the fair-use limits
          defined in your subscription plan. Excessive use that materially impacts platform performance for other users
          may result in throttling or account suspension.
        </Typography.P>
      </Section>

      {/* ─── Section 6 ─── */}
      <Section id="ai-content" title="6. AI-Generated Content">
        <Typography.P>
          GRAFT.TODAY uses AI models (including Google Gemini and Anthropic Claude) to generate content such as chatbot
          responses, engagement copy, and lead analyses. You acknowledge and agree that:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>
            AI-generated content may be inaccurate, incomplete, biased, or inappropriate for your specific use case
          </li>
          <li>
            You are solely responsible for reviewing, editing, and approving all AI-generated content before using it or
            sending it to any third party
          </li>
          <li>
            GRAFT.TODAY makes no warranty regarding the accuracy, legal compliance, or suitability of AI-generated
            content
          </li>
          <li>
            You must not present AI-generated content in a way that constitutes fraud, misrepresentation, or deception
          </li>
        </ul>
      </Section>

      {/* ─── Section 7 ─── */}
      <Section id="ip-data" title="7. Intellectual Property and Your Data">
        <Typography.P>
          <strong>Your content:</strong> You retain full ownership of all data, content, and materials you upload or
          create through GRAFT.TODAY (&ldquo;Customer Data&rdquo;). You grant GRAFT.TODAY a limited, non-exclusive,
          royalty-free license to process your Customer Data solely as necessary to provide the services to you.
        </Typography.P>
        <Typography.P>
          <strong>Our platform:</strong> All platform software, code, design, trademarks, logos, and proprietary
          technology are and remain the intellectual property of GRAFT.TODAY. These Terms do not transfer any ownership
          or intellectual property rights to you. You may not copy, reproduce, or create derivative works from platform
          content without our express written permission.
        </Typography.P>
        <Typography.P>
          <strong>Feedback:</strong> If you provide us with feedback, suggestions, or ideas about the services, you
          grant us a non-exclusive, perpetual, royalty-free right to use that feedback without any obligation to you.
        </Typography.P>
      </Section>

      {/* ─── Section 8 ─── */}
      <Section id="confidentiality" title="8. Confidentiality">
        <Typography.P>
          Each party agrees to keep the other party&rsquo;s non-public business information confidential and not to
          disclose it to third parties, except: (a) as required by applicable law or a court order; (b) to service
          providers bound by equivalent confidentiality obligations; or (c) with the other party&rsquo;s prior written
          consent.
        </Typography.P>
      </Section>

      {/* ─── Section 9 ─── */}
      <Section id="disclaimer" title="9. Disclaimer of Warranties">
        <Typography.P>
          GRAFT.TODAY is provided <strong>&ldquo;as is&rdquo;</strong> and <strong>&ldquo;as available&rdquo;</strong>{" "}
          without warranties of any kind, whether express or implied. To the maximum extent permitted by law, we
          disclaim all warranties, including but not limited to implied warranties of merchantability, fitness for a
          particular purpose, and non-infringement. In particular, we do not warrant that:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>The services will be uninterrupted, error-free, or available at all times</li>
          <li>AI-generated content will be accurate, complete, or fit for any particular purpose</li>
          <li>
            Results from the chatbot or engagement features will meet your business objectives or generate any
            particular outcome
          </li>
          <li>The services will be free from bugs, vulnerabilities, or data loss</li>
        </ul>
      </Section>

      {/* ─── Section 10 ─── */}
      <Section id="liability" title="10. Limitation of Liability">
        <Typography.P>
          To the maximum extent permitted by South African law, GRAFT.TODAY&rsquo;s total cumulative liability to you
          for any and all claims arising out of or related to these Terms or the services shall not exceed the total
          amount you paid to Paddle for the services in the <strong>three (3) calendar months</strong> immediately
          preceding the event giving rise to the claim.
        </Typography.P>
        <Typography.P>
          In no event shall GRAFT.TODAY be liable for any indirect, incidental, special, consequential, or punitive
          damages, including but not limited to loss of profits, loss of revenue, loss of data, loss of goodwill, or
          cost of substitute services — even if we have been advised of the possibility of such damages and even if a
          remedy set forth in these Terms is found to have failed its essential purpose.
        </Typography.P>
        <Typography.P>
          Nothing in these Terms excludes or limits liability for death or personal injury caused by our negligence,
          fraud, or any other liability that cannot be excluded or limited by South African law.
        </Typography.P>
      </Section>

      {/* ─── Section 11 ─── */}
      <Section id="indemnification" title="11. Indemnification">
        <Typography.P>
          You agree to indemnify, defend, and hold harmless GRAFT.TODAY and its personnel from and against any claims,
          liabilities, losses, damages, and expenses (including reasonable legal fees) arising out of or relating to:
          (a) your use of the services; (b) your violation of these Terms; (c) your violation of any third-party rights
          (including intellectual property or data protection rights); or (d) content or data you submit through the
          platform.
        </Typography.P>
      </Section>

      {/* ─── Section 12 ─── */}
      <Section id="termination" title="12. Termination">
        <Typography.P>
          <strong>By you:</strong> You may cancel your subscription at any time through the billing section of your
          dashboard or by emailing{" "}
          <a
            href="mailto:hello@graft.today"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
          >
            hello@graft.today
          </a>
          . Cancellation takes effect at the end of the current paid billing period; no partial-period refunds are
          issued unless required by applicable law.
        </Typography.P>
        <Typography.P>
          <strong>By us:</strong> We may suspend or terminate your account immediately and without prior notice if you:
          breach these Terms; engage in fraudulent, illegal, or abusive behaviour; or pose a risk to the security or
          reputation of the platform or other users.
        </Typography.P>
        <Typography.P>
          <strong>Effect of termination:</strong> On termination, your right to use the services ends immediately. We
          will handle your data in accordance with our{" "}
          <Link href="/privacy" className="underline underline-offset-4 text-foreground hover:text-muted-foreground">
            Privacy Policy
          </Link>
          . Sections that by their nature should survive termination (IP, confidentiality, liability, governing law)
          remain in effect.
        </Typography.P>
      </Section>

      {/* ─── Section 13 ─── */}
      <Section id="governing-law" title="13. Governing Law and Jurisdiction">
        <Typography.P>
          These Terms are governed by and construed in accordance with the laws of the{" "}
          <strong>Republic of South Africa</strong>, without regard to conflict-of-law rules. Any dispute arising out of
          or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of South
          Africa, and you consent to personal jurisdiction in those courts.
        </Typography.P>
        <Typography.P>
          We encourage you to contact us at{" "}
          <a
            href="mailto:hello@graft.today"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
          >
            hello@graft.today
          </a>{" "}
          to resolve any dispute informally before initiating formal proceedings.
        </Typography.P>
      </Section>

      {/* ─── Section 14 ─── */}
      <Section id="changes" title="14. Changes to These Terms">
        <Typography.P>
          We may update these Terms from time to time to reflect changes to our services, applicable law, or business
          practices. When we make material changes, we will notify you by email and/or in-platform notification at least{" "}
          <strong>30 days</strong> before the revised Terms take effect. Your continued use of GRAFT.TODAY after the
          effective date constitutes your acceptance of the updated Terms.
        </Typography.P>
        <Typography.P>
          If you do not agree to updated Terms, you may cancel your subscription before the effective date.
        </Typography.P>
      </Section>

      {/* ─── Section 15 ─── */}
      <Section id="contact" title="15. Contact">
        <Typography.P>For any questions or concerns about these Terms, please contact us:</Typography.P>
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
            <strong>Operator:</strong> Jacob Kotzee trading as GRAFT.TODAY
          </li>
          <li>
            <strong>Physical address:</strong> Parkview Heights, Cape Town, WC, 7550, South Africa
          </li>
        </ul>
        <Typography.P>
          <em>
            These Terms are a good-faith effort to provide clear and fair terms of use. They do not constitute legal
            advice. We recommend consulting a South African attorney for a full legal review before launch.
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
