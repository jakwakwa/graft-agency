import { Typography } from "@/components/ui/typography";
import { PolicySection } from "@/components/marketing/policy-section";
import { SubTable } from "./sub-table";
import React from "react";

export function Sections11To15() {
  return (
    <>
      {/* ─── Section 11 ─── */}
      <PolicySection id="cookies" title="11. Cookies and Tracking">
        <Typography.P>
          GRAFT.TODAY uses only essential cookies — those strictly necessary for session management and authentication.
          We do not use advertising cookies, third-party tracking pixels, or cross-site tracking technology.
        </Typography.P>
        <Typography.P>
          You may configure cookie preferences in your browser settings. Disabling essential cookies will impair your
          ability to log in and use the platform.
        </Typography.P>
      </PolicySection>

      {/* ─── Section 12 ─── */}
      <PolicySection id="transfers" title="12. International Data Transfers">
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
      </PolicySection>

      {/* ─── Section 13 ─── */}
      <PolicySection id="direct-marketing" title="13. Electronic Direct Marketing">
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
          customers ortriaged initiated enquiries you are responsible for ensuring those communications comply with
          applicable electronic direct marketing laws in your jurisdiction (including POPIA Section 69 in South Africa,
          CAN-SPAM in the United States, and the GDPR in the European Union).
        </Typography.P>
      </PolicySection>

      {/* ─── Section 14 ─── */}
      <PolicySection id="changes" title="14. Changes to This Policy">
        <Typography.P>
          We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last updated&rdquo;
          date at the top of this page. Where changes are material, we will notify active subscribers by email at least
          30 days before they take effect. Continued use of GRAFT.TODAY after the effective date constitutes acceptance
          of the revised policy.
        </Typography.P>
      </PolicySection>

      {/* ─── Section 15 ─── */}
      <PolicySection id="contact" title="15. Contact Us">
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
      </PolicySection>
    </>
  );
}
