# PODGRAF-202 — Standalone Refund/Cancellation Policy page + pre-checkout confirmation modal

**Date:** 2026-07-12
**Linear:** PODGRAF-202 (Podslice Ai / GRAFT TODAY)
**Branch:** `jakwakwa/podgraf-202-create-standalone-refundcancellation-policy-page`

## Problem / Motivation

Paddle acts as GRAFT.TODAY's Merchant of Record. Paddle verification requires a
**refund policy on its own publicly reachable page** — it cannot live only inside
the combined Terms of Service. We also want customers to see and acknowledge the
refund/cancellation terms *before* they enter the Paddle checkout, and to
understand how cancellation actually works (Paddle's compliance cancel-link,
cancel-at-period-end vs cancel-immediately).

## Scope

In scope:

1. A standalone `app/(marketing)/refunds/page.tsx` route with the full payment,
   refund, and cancellation policy.
2. A footer link to `/refunds` (plus the currently-missing Terms and Privacy
   links) from the landing footer.
3. A cancellation section that conveys the Paddle cancellation documentation.
4. A pre-checkout confirmation modal that gates the portal subscribe button and
   whose fine-print links to `/refunds`, `/terms`, and `/privacy`.

Out of scope (YAGNI):

- No changes to Paddle API, transaction creation, or `Checkout.open()` logic.
- No checkout modal on the landing page (landing pricing cards only link to
  `/portal/billing`; they never open Paddle checkout).
- No pixel-perfect clone of Canva's mockup (feature timeline icons, Canva-specific
  rows). We reproduce the *structure and intent*, GRAFT-branded.

## Decisions (from brainstorming)

- **Modal fidelity:** GRAFT-branded, essence of the mockup — title, Monthly/Yearly
  toggle with savings badge, price + billing line, feature checklist, primary CTA,
  legal fine-print with links. Styled with existing design tokens
  (`glass-panel`, theme colors), not a pixel clone.
- **Modal scope:** Portal billing only. `handleCheckout` in
  `pricing-section-client.tsx` is only reachable in `mode="portal"`; landing cards
  render a `<Link href="/portal/billing">`, so there is nothing to gate on landing.
- **Refund page content:** Full, self-contained payment terms duplicated on
  `/refunds` (Merchant of Record, Subscription, Automatic renewal, Refunds,
  Cancellation, Price changes) so the page stands alone for Paddle verification,
  with a cross-link to `/terms` for the complete terms.

## Component 1 — `/refunds` page

**File:** `app/(marketing)/refunds/page.tsx` (new)

Mirror the existing `app/(marketing)/terms/page.tsx` conventions exactly:

- Local `Section({ id, title, children })` helper (same markup as terms page).
- `Typography.*` primitives from `@/components/ui/typography`.
- `mx-auto max-w-3xl px-6 py-16` container.
- "← Back to home" link at top and bottom.
- Exported `metadata` (`title`, `description`).
- `Last updated: 12 July 2026`.

### Sections

1. **Merchant of Record** — All payment processing handled by Paddle
   (paddle.com), which charges the payment method, issues invoices/receipts, and
   manages VAT/GST/sales-tax globally. By subscribing you also agree to Paddle's
   terms at paddle.com/legal. (Same wording as terms §4 MoR paragraph.)
2. **Subscription** — Provided on a subscription basis (monthly or annual as
   chosen at checkout); starts when Paddle confirms payment. (Verbatim from issue.)
3. **Automatic renewal** — Renews automatically at the end of each billing period;
   Paddle charges the method on file unless you cancel before renewal. (Verbatim.)
4. **Refunds** — Handled by Paddle per their MoR refund policy; contact Paddle
   support via your invoice or at paddle.com for disputes/refunds. (Verbatim.)
5. **Cancellation** *(new — conveys the Paddle cancellation docs)*:
   - Paddle includes a cancel link in subscription-related emails for compliance;
     you do not need custom logic. Cancelling via that email link keeps the
     subscription active until the end of the current billing period.
   - **Cancel at the end of the billing period** — Paddle creates a scheduled
     change; the subscription stays active until the next billing date, when its
     status changes to `canceled`.
   - **Cancel immediately** — Paddle cancels right away and the status changes to
     `canceled`. Any changes made to the subscription or one-time charges set to
     bill on the next period are automatically forgiven.
   - Canceled subscriptions cannot be reinstated; contact Paddle directly to start
     a new subscription if you cancelled and want to return.
6. **Price changes** — At least 30 days' advance notice by email and/or in-platform
   notification; continued subscription after the effective date constitutes
   acceptance. (Verbatim from issue.)

Close with a paragraph linking to `/terms` (internal `next/link`) for the full
Terms of Service, and the standard "not legal advice" disclaimer note consistent
with the terms page tone.

## Component 2 — Footer links

**File:** `components/marketing/landing-footer.tsx` (edit)

The footer currently exposes only dashboard/portal links and no legal links. Add a
second nav group ("Legal") alongside the existing one:

- `Refund & Cancellation Policy` → `/refunds` (required by this ticket)
- `Terms` → `/terms`
- `Privacy` → `/privacy`

Reuse the existing link styling (`text-sm text-muted-foreground underline-offset-4
transition-colors hover:text-foreground hover:underline`). Keep the existing
"quick links" nav; render the two nav groups side by side within the existing
flex container so the layout degrades cleanly on mobile.

## Component 3 — Pre-checkout confirmation modal

**File:** `components/pricing/subscription-confirm-dialog.tsx` (new client component)

Built on the existing Radix dialog at `components/ui/dialog.tsx`
(`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`).

### Props

```ts
interface SubscriptionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: PricingOffer;                       // the "ai-chatbot" subscription offer
  selectedCycle: "monthly" | "annual";
  onSelectCycle: (cycle: "monthly" | "annual") => void;
  localizedPrices: Record<string, string>;   // priceId -> formatted price
  onConfirm: () => void;                      // runs existing handleCheckout(offer)
  pending?: boolean;                          // disables CTA while the transaction is created
}
```

### Layout (GRAFT-branded essence of mockup)

- **Title:** "Are you sure you want to subscribe to the AI Chatbot?"
- **Two columns on `sm+`, stacked on mobile.**
- **Left column — plan choice:**
  - Monthly and Annual options as selectable rows (radio-style), each showing its
    localized price (fallback to `option.fallbackPrice` when localized price is
    absent) and suffix.
  - On the annual row, a "Best value — Save {X}" badge when annual savings can be
    computed. Savings helper: parse the numeric portion of the localized/fallback
    monthly and annual prices sharing the same currency prefix; if both parse,
    `save = monthly*12 - annual` and render only when `save > 0`, formatted with
    the detected currency symbol. If parsing fails (mixed/odd formats), omit the
    badge — never render a wrong number.
  - A "Billed today" line showing the selected plan's price (first charge is
    immediate on checkout).
- **Right column — feature checklist:** `offer.features[]` rendered with the same
  `Check` icon + text pattern used in `pricing-card.tsx`.
- **CTA:** primary button "Continue to payment", disabled when `pending`. On click:
  `onConfirm()` (do NOT close the dialog manually — completion/failure is driven by
  the existing checkout flow; on success Paddle's overlay takes over, on failure the
  existing `subscribeError` banner shows below the cards).
- **Fine-print** (small, muted, under the CTA):
  "By continuing you agree to the Terms of Use and confirm you have read our
  Privacy Policy and Refund & Cancellation Policy."
  with `next/link`s to `/terms`, `/privacy`, `/refunds`.

### Savings helper

Extract a small pure function (co-located or in the dialog file) so it is unit
testable:

```ts
// returns a formatted savings string like "R420" / "$240", or null
function computeAnnualSavings(monthly?: string, annual?: string): string | null
```

## Component 4 — Wiring into the pricing section

**File:** `components/pricing/pricing-section-client.tsx` (edit)

- Add state: `const [confirmOpen, setConfirmOpen] = useState(false)` and track the
  offer to confirm (`const [confirmOffer, setConfirmOffer] = useState<PricingOffer | null>(null)`).
- Add `const [confirmPending, setConfirmPending] = useState(false)`.
- Change the subscription card path so `onCheckout` **opens the dialog** instead of
  calling `handleCheckout` directly:
  - `handleRequestCheckout(offer)` → `setConfirmOffer(offer); setConfirmOpen(true)`.
  - Pass `handleRequestCheckout` as `onCheckout` to `PricingCard`.
- `handleCheckout` itself is unchanged (still creates the server transaction and
  calls `paddle.Checkout.open`). The dialog's `onConfirm` wraps it:
  ```ts
  const onConfirm = async () => {
    if (!confirmOffer) return;
    setConfirmPending(true);
    try { await handleCheckout(confirmOffer); }
    finally { setConfirmPending(false); setConfirmOpen(false); }
  };
  ```
- Render `<SubscriptionConfirmDialog>` once at the section level, bound to
  `selectedCycle` / `setSelectedCycle`, `localizedPrices`, and the confirm offer.
- The one-subscription-per-workspace lock, `subscribed`/`canCheckout` gating, and
  the error/sync banners are all untouched — the dialog is purely an interstitial
  before the existing flow.

### Interaction notes

- The dialog only appears for the **subscription** offer (`ai-chatbot`). One-time
  build purchases (`handlePurchaseBuild`) are unchanged and do not get the dialog.
- Because `selectedCycle` is shared state, changing the cycle inside the dialog
  updates the same plan that `handleCheckout` reads — no divergence between what
  the user confirms and what is checked out.

## Testing

- **Vitest unit:**
  - `computeAnnualSavings` — returns correct formatted savings for matching
    currencies; returns `null` on unparseable/mismatched inputs.
  - Render test of `SubscriptionConfirmDialog` (open state): asserts the title, both
    plan options, the feature list, the three legal links (`/terms`, `/privacy`,
    `/refunds`), and the "Continue to payment" CTA; clicking the CTA calls
    `onConfirm`.
- **Build/lint:** `bun run build` (prisma generate + next build) and `bun run lint`
  (Biome) must pass — these catch type/contract errors the IDE misses.
- **Manual verification:**
  - `/refunds` renders, is publicly reachable (no auth), and links to `/terms`.
  - Footer shows Refund & Cancellation Policy, Terms, and Privacy links that
    navigate correctly.
  - In `/portal/billing`, clicking "Subscribe to AI Chatbot" opens the confirmation
    modal; "Continue to payment" proceeds to the Paddle checkout overlay; the
    existing subscribed/locked states still behave.

## Files touched

| File | Change |
| --- | --- |
| `app/(marketing)/refunds/page.tsx` | new — standalone policy page |
| `components/marketing/landing-footer.tsx` | edit — add Legal nav group |
| `components/pricing/subscription-confirm-dialog.tsx` | new — confirmation modal + savings helper |
| `components/pricing/pricing-section-client.tsx` | edit — gate subscribe button with dialog |
| `tests/unit/...` | new — savings helper + dialog render tests |
