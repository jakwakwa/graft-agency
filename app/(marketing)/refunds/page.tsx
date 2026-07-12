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
  title: "Refund & Cancellation Policy — GRAFT.TODAY",
  description:
    "How refunds and cancellations work for GRAFT.TODAY subscriptions, handled by Paddle as our Merchant of Record.",
};

export default function RefundsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="inline-block text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
      >
        ← Back to home
      </Link>

      <div className="mb-4">
        <Typography.H1 className="block">Refund &amp; Cancellation Policy</Typography.H1>
      </div>
      <Typography.Muted>Last updated: 12 July 2026</Typography.Muted>

      <Typography.Lead className="mt-8">
        This policy explains how billing, refunds, and cancellations work for GRAFT.TODAY subscriptions. All payments
        are processed by Paddle, which acts as our Merchant of Record. This page supplements our full{" "}
        <Link href="/terms" className="underline underline-offset-4 text-foreground hover:text-muted-foreground">
          Terms of Service
        </Link>
        .
      </Typography.Lead>

      {/* ─── Merchant of Record ─── */}
      <Section id="merchant-of-record" title="Merchant of Record">
        <Typography.P>
          All payment processing for GRAFT.TODAY subscriptions is handled by{" "}
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
      </Section>

      {/* ─── Subscription ─── */}
      <Section id="subscription" title="Subscription">
        <Typography.P>
          GRAFT.TODAY is provided on a subscription basis (monthly or annual as chosen at checkout). Your subscription
          starts when Paddle confirms payment and provides access to the selected plan&rsquo;s features.
        </Typography.P>
      </Section>

      {/* ─── Automatic renewal ─── */}
      <Section id="automatic-renewal" title="Automatic renewal">
        <Typography.P>
          Subscriptions renew automatically at the end of each billing period. Paddle will charge your payment method on
          file unless you cancel before the renewal date.
        </Typography.P>
      </Section>

      {/* ─── Refunds ─── */}
      <Section id="refunds" title="Refunds">
        <Typography.P>
          Refund requests are handled by Paddle in accordance with their Merchant of Record refund policy. For billing
          disputes or refund requests, contact Paddle support directly through your invoice or at{" "}
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
      </Section>

      {/* ─── Cancellation ─── */}
      <Section id="cancellation" title="Cancellation">
        <Typography.P>
          For compliance reasons, subscription-related emails Paddle sends to customers include a link to cancel. This
          is handled by Paddle — you don&rsquo;t need to build or use any separate process. When you cancel using the
          link in the email from Paddle, your subscription remains active until the end of the current billing period.
        </Typography.P>
        <Typography.P>When a subscription is cancelled, one of two things happens:</Typography.P>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mt-2">
          <li>
            <strong className="text-foreground">Cancel at the end of the billing period:</strong> Paddle creates a
            scheduled change so the subscription is set to cancel on the next billing date. The subscription remains
            active until that date, when its status changes to <em>canceled</em>.
          </li>
          <li>
            <strong className="text-foreground">Cancel immediately:</strong> Paddle cancels the subscription right away
            and its status changes to <em>canceled</em>. If changes had been made to the subscription, or one-time
            charges had been set to bill on the next billing period, those are automatically forgiven.
          </li>
        </ul>
        <Typography.P>
          Canceled subscriptions cannot be reinstated. If you have cancelled and want to return, contact Paddle directly
          to start a new subscription.
        </Typography.P>
      </Section>

      {/* ─── Price changes ─── */}
      <Section id="price-changes" title="Price changes">
        <Typography.P>
          We reserve the right to change subscription prices. We will give you at least 30 days&rsquo; advance notice of
          any price change by email and/or in-platform notification. Your continued subscription after the effective
          date constitutes acceptance of the new price.
        </Typography.P>
      </Section>

      {/* ─── More information ─── */}
      <Section id="more-information" title="More information">
        <Typography.P>
          For the complete terms governing payments, billing, and your use of GRAFT.TODAY, see our{" "}
          <Link href="/terms" className="underline underline-offset-4 text-foreground hover:text-muted-foreground">
            Terms of Service
          </Link>
          . For any questions about billing, refunds, or cancellation, contact us at{" "}
          <a
            href="mailto:hello@graft.today"
            className="underline underline-offset-4 text-foreground hover:text-muted-foreground"
          >
            hello@graft.today
          </a>
          .
        </Typography.P>
        <Typography.P>
          <em>
            This policy is a good-faith summary of how billing and cancellation work and does not constitute legal
            advice.
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
