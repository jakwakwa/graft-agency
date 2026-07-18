import Link from "next/link";
import { Typography } from "@/components/ui/typography";
import { ShieldCheck, Lock, Server, Bot, CreditCard, Users, AlertTriangle, Eye } from "lucide-react";

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-foreground" aria-hidden />
        </div>
        <Typography.H3 className="block text-foreground">{title}</Typography.H3>
      </div>
      <div className="space-y-3 pl-11">{children}</div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
      {children}
    </span>
  );
}

export const metadata = {
  title: "Security — GRAFT.TODAY",
  description: "How GRAFT.TODAY keeps your data, your chatbot, and your customers safe.",
};

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="inline-block text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
      >
        ← Back to home
      </Link>

      <div className="mb-4">
        <Typography.H1 className="block">Security</Typography.H1>
      </div>
      <Typography.Muted>Last updated: 21 June 2026</Typography.Muted>

      <Typography.Lead className="mt-8">
        We built GRAFT.TODAY to handle sensitive business conversations and customer data. This page explains exactly
        how we protect your data, your customers&rsquo; data, and your chatbot — in plain language, not marketing copy.
      </Typography.Lead>

      {/* ─── Infrastructure ─── */}
      <Section id="infrastructure" icon={Server} title="Infrastructure and hosting">
        <Typography.P>
          GRAFT.TODAY is hosted entirely on{" "}
          <a
            href="https://vercel.com/security"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vercel
          </a>
          , a platform built on AWS and Google Cloud. Vercel provides:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>Automatic HTTPS/TLS on all routes — there is no HTTP fallback</li>
          <li>DDoS mitigation and edge-level rate limiting</li>
          <li>Global CDN distribution with automatic failover</li>
          <li>Isolated serverless functions — each request runs in its own execution context</li>
        </ul>
        <Typography.P>
          Our database requires SSL for every connection (
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">sslmode=require</code>). Data at rest and in
          transit between application and database is encrypted.
        </Typography.P>
      </Section>

      {/* ─── Authentication ─── */}
      <Section id="auth" icon={Lock} title="Authentication and access control">
        <Typography.P>
          All user authentication is handled by{" "}
          <a
            href="https://clerk.com/security"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            Clerk
          </a>
          , a dedicated identity platform. GRAFT.TODAY never stores your password — Clerk manages credential storage,
          session tokens, and login flows.
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>Passwords are hashed by Clerk using industry-standard algorithms — we cannot see them</li>
          <li>Sessions use short-lived, signed JWT tokens</li>
          <li>Multi-factor authentication (MFA) is available and recommended for your account</li>
          <li>
            Every authenticated API request and server action verifies your session inside the handler — not just at the
            middleware edge
          </li>
        </ul>
        <Typography.P>
          Access to your organisation&rsquo;s data within the platform is scoped to your Clerk organisation. No other
          tenant can access your leads, conversations, or settings — this is enforced at the data-query layer, not just
          the UI.
        </Typography.P>
      </Section>

      {/* ─── Multi-tenancy ─── */}
      <Section id="multi-tenancy" icon={Users} title="Multi-tenant data isolation">
        <Typography.P>
          GRAFT.TODAY is a multi-tenant platform — many businesses share the same infrastructure. Here is how we ensure
          one tenant cannot access another&rsquo;s data:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>
            Every record in our database is scoped to a{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">clientId</code> that maps 1-to-1 with your
            Clerk organisation
          </li>
          <li>
            All data-access queries filter by{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">clientId</code> in the service layer —
            there is no reliance on UI-layer filtering alone
          </li>
          <li>The platform owner account has elevated access for support purposes only; access is logged</li>
        </ul>
        <Typography.P>
          If you use GRAFT.TODAY to serve your own customers (e.g. deploying a chatbot widget on your site), your
          customers&rsquo; data is similarly isolated under your organisation and is not visible to other GRAFT.TODAY
          tenants.
        </Typography.P>
      </Section>

      {/* ─── Payments ─── */}
      <Section id="payments" icon={CreditCard} title="Payment security">
        <Typography.P>
          All payment processing is handled exclusively by{" "}
          <a
            href="https://www.paddle.com/security"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            Paddle
          </a>{" "}
          as our Merchant of Record.{" "}
          <strong>GRAFT.TODAY never sees, handles, or stores your payment card details.</strong> This means:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>Your card number, CVV, and expiry date go directly to Paddle&rsquo;s PCI-DSS compliant infrastructure</li>
          <li>
            Paddle issues invoices, handles refunds, and manages subscription billing — our servers are never in the
            payment data path
          </li>
          <li>
            Subscription status webhooks from Paddle are verified using a cryptographic signing secret before being
            processed
          </li>
        </ul>
      </Section>

      {/* ─── AI data handling ─── */}
      <Section id="ai" icon={Bot} title="AI models and your data">
        <Typography.P>
          GRAFT.TODAY uses AI models to power the chatbot and engagement features. We want to be fully transparent about
          which providers receive your data and under what conditions.
        </Typography.P>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-border px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold text-sm text-foreground">Google Gemini</p>
              <Pill>AI inference</Pill>
            </div>
            <p className="text-sm text-muted-foreground">
              Used for chatbot responses and engagement analysis. Data sent to Gemini includes conversation messages and
              lead context. Google&rsquo;s API terms state that data submitted via the API is not used to train
              Google&rsquo;s models by default. See{" "}
              <a
                href="https://ai.google.dev/gemini-api/terms"
                className="underline underline-offset-4 text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Gemini API Terms
              </a>
              .
            </p>
          </div>

          <div className="rounded-lg border border-border px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold text-sm text-foreground">Anthropic Claude</p>
              <Pill>AI inference</Pill>
            </div>
            <p className="text-sm text-muted-foreground">
              Used as an alternative model for chatbot responses. Data sent includes conversation history and relevant
              context. Anthropic&rsquo;s API policy states that API inputs and outputs are not used to train their
              models. See{" "}
              <a
                href="https://www.anthropic.com/legal/privacy"
                className="underline underline-offset-4 text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                Anthropic Privacy Policy
              </a>
              .
            </p>
          </div>

          <div className="rounded-lg border border-border px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold text-sm text-foreground">Google Stitch &amp; Jules</p>
              <Pill>Design &amp; code generation</Pill>
            </div>
            <p className="text-sm text-muted-foreground">
              Used during the engagement pipeline to generate design concepts and prototype code for approved leads.
              These are Google Cloud services accessed via a dedicated service account. Data sent is limited to the
              engagement brief and approved lead context.
            </p>
          </div>
        </div>

        <Typography.P>
          We apply data minimisation: AI calls receive only the context necessary for the specific task. We do not send
          your entire database to any AI provider. Conversation messages are sent to the AI model in real time and are
          not persisted by us on third-party AI platforms.
        </Typography.P>
      </Section>

      {/* ─── Chatbot widget ─── */}
      <Section id="widget" icon={ShieldCheck} title="Chatbot widget security">
        <Typography.P>
          When you embed the GraftBot widget on your website, a script loads an iframe served from GRAFT.TODAY. Here is
          what that means for your site&rsquo;s security:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>
            The widget runs in an isolated iframe — it cannot access your page&rsquo;s DOM, cookies, or local storage
          </li>
          <li>
            Your GRAFT.TODAY client ID is used to identify your chatbot configuration. It is a non-secret public
            identifier — possessing it does not grant access to your dashboard or data
          </li>
          <li>Chat conversations are transmitted over HTTPS and stored in your account&rsquo;s isolated data scope</li>
          <li>The widget does not inject any third-party advertising scripts onto your page</li>
        </ul>
        <Typography.P>
          We recommend embedding the widget via our official script tag. Custom or modified embed code is not supported
          and may introduce security risks.
        </Typography.P>
      </Section>

      {/* ─── Transparency ─── */}
      <Section id="transparency" icon={Eye} title="What we do not do">
        <Typography.P>To be explicit about our data practices:</Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>We do not sell your data or your customers&rsquo; data to third parties</li>
          <li>We do not use your conversation data or leads for advertising targeting</li>
          <li>We do not allow any AI provider to train on your data via API calls (per their respective policies)</li>
          <li>We do not share your data between tenants</li>
          <li>We do not store payment card details — ever</li>
        </ul>
      </Section>

      {/* ─── Vulnerability disclosure ─── */}
      <Section id="disclosure" icon={AlertTriangle} title="Reporting a security issue">
        <Typography.P>
          If you discover a vulnerability or security issue in GRAFT.TODAY, please report it responsibly before public
          disclosure. We take all reports seriously and will respond promptly.
        </Typography.P>
        <div className="mt-3 rounded-lg border border-border px-4 py-3 text-sm">
          <p className="font-semibold text-foreground mb-1">Responsible disclosure contact</p>
          <p className="text-muted-foreground">
            Email{" "}
            <a
              href="mailto:hello@graft.today"
              className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
            >
              hello@graft.today
            </a>{" "}
            with the subject line &ldquo;Security disclosure&rdquo;. Please include a description of the issue, steps to
            reproduce, and your contact details. We aim to acknowledge reports within 2 business days and resolve
            confirmed vulnerabilities within 30 days.
          </p>
        </div>
        <Typography.P>
          We ask that you do not access, modify, or delete data belonging to other users while investigating any
          potential issue, and that you give us a reasonable time to resolve the issue before disclosing it publicly.
        </Typography.P>
      </Section>

      {/* ─── Your responsibilities ─── */}
      <Section id="your-responsibilities" icon={Lock} title="Your security responsibilities">
        <Typography.P>
          Security is a shared responsibility. As a GRAFT.TODAY subscriber, you can significantly reduce risk by:
        </Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>Enabling multi-factor authentication (MFA) on your account</li>
          <li>Using a strong, unique password via your identity provider</li>
          <li>Reviewing who has access to your GRAFT.TODAY organisation and removing members who no longer need it</li>
          <li>
            Treating AI-generated content as a draft — review it for accuracy and appropriateness before relying on it
          </li>
          <li>
            Reporting any suspicious activity on your account to us immediately at{" "}
            <a
              href="mailto:hello@graft.today"
              className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
            >
              hello@graft.today
            </a>
          </li>
        </ul>
      </Section>

      {/* ─── More ─── */}
      <div className="mt-12 rounded-lg border border-border bg-muted/30 px-5 py-4 text-sm">
        <p className="font-semibold text-foreground mb-2">More information</p>
        <ul className="space-y-1 text-muted-foreground">
          <li>
            <Link href="/privacy" className="underline underline-offset-4 text-foreground hover:text-muted-foreground">
              Privacy Policy
            </Link>{" "}
            — what personal information we collect and how we use it
          </li>
          <li>
            <Link href="/terms" className="underline underline-offset-4 text-foreground hover:text-muted-foreground">
              Terms of Service
            </Link>{" "}
            — the rules governing use of the platform
          </li>
        </ul>
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
