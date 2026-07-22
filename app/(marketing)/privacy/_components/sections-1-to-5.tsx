import { Typography } from "@/components/ui/typography";
import { PolicySection } from "@/components/marketing/policy-section";
import { SubTable } from "./sub-table";
import React from "react";

export function Sections1To5() {
  return (
    <>
      {/* ─── Section 1 ─── */}
      <PolicySection id="about" title="1. About GRAFT.TODAY">
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
      </PolicySection>

      {/* ─── Section 2 ─── */}
      <PolicySection id="roles" title="2. Our Two Roles — Responsible Party and Operator">
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
      </PolicySection>

      {/* ─── Section 3 ─── */}
      <PolicySection id="data-collected" title="3. Personal Information We Collect About You (as a Subscriber)">
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
      </PolicySection>

      {/* ─── Section 4 ─── */}
      <PolicySection id="operator-data" title="4. Data We Process on Your Behalf (as an Operator)">
        <Typography.P>
          When you use GRAFT.TODAY&rsquo;s products to serve your own customers, we process the following categories of
          data as your operator:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>
            <strong className="text-foreground">Chatbot conversations:</strong> Messages exchanged between your
            end-users and your deployed GRAFT AI Assistant widget, including personal information they voluntarily share
            (name, email, contact details, queries).
          </li>
          <li>
            <strong className="text-foreground">Triaged Detail</strong> Contact details and engagement data your
            end-users share through your deployed GRAFT AI Assistant widget.
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
      </PolicySection>

      {/* ─── Section 5 ─── */}
      <PolicySection id="use" title="5. How We Use Your Personal Information">
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
      </PolicySection>
    </>
  );
}
