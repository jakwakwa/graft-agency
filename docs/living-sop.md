**AI Website Gold Rush: Architecture & Implementation Blueprint**

This blueprint outlines the architecture for "GRAFT AI Web Solutions," a production-grade, multi-tenant AI platform designed for high performance and strict client isolation. The system operates on three core pillars:

1. **Inbound Platform-Level Lead Capture Bot:**  
   * **Purpose:** To capture leads, answer supporting questions, and schedule online consultation conferences, replacing the traditional contact form or phone call.  
   * **Implementation:** Must be a native integration on the Graft platform website (no `iframe` needed).  
   * **Tooling:** Relies on **deterministic tool calling** using Zod-validated "skills" to perform controlled actions:  
     * `captureLeadDetails`: Extracts customer details and creates a Lead record, returning the `leadId`.  
     * `checkCalendarAvailability`: Queries the Cal.com v2 API for free time slots.  
     * `bookAppointment`: Finalizes the process, pushing lead data to Cal.com and updating the Lead status to `BOOKED`.  
2. **White-Labeled AI Bots for Clients (Tenants):**  
   * **Core Function:** A 90% mirror of the Platform-Level Lead Capture bot, packaged as an `iframe` snippet for clients to embed on their own websites.  
   * **Monetization:** Clients subscribe monthly for this service (MRR model).  
   * **Client Isolation/Access:**  
     * Provided as an `iframe` snippet with a unique token.  
     * Connects to the Graft platform database and AI bot control room.  
     * Clients **do not** have access to the Outbound Prospecting Agent (Pillar 3).  
   * **Configuration & Customization:**  
     * **Activation:** Activated by a unique token generated upon purchase.  
     * **API Keys:** Clients must securely enter their own API keys for the AI model (currently Gemini, with future support for others via Vercel SDK) and their own Cal.com account.  
     * **Scheduling:** Bookings are managed directly on the client's Cal.com account, not on the Graft platform.  
     * **Analytics:** Graft pulls analytics and metrics to display on the client's single-page tenant dashboard.  
     * **Brain Customization:** Clients can update their bot's "Knowledge Base" via a user-friendly UI/UX dashboard, which updates the backend JSON configuration.  
     * **Local Context:** The bot can be customized by the client (via their dashboard) to understand localized terms (e.g., "bakkie") and local schedules (e.g., load shedding).  
3. **Autonomous Outbound Prospecting Engine (Exclusively Platform-Owned):**  
   * **Purpose:** To programmatically find and qualify potential clients (businesses without existing AI bots).  
   * **Process:** An autonomous Extract, Transform, Load (ETL) pipeline.  
     * **Extraction & Audit:** Identifies businesses and audits their web presence for AI readiness using `generateObject`.  
     * **Scraping:** Uses a Scraper tool (Firecrawl and Google Search combo) that trims the output to a token-friendly 25,000 characters.  
     * **Logic:** The `processOutboundProspect` server action uses tools to perform a structured audit against a `prospectAuditSchema`. It **skips** pitching businesses that already have detected AI capabilities.  
     * **Transformation:** If the audit is successful, it drafts hyper-contextualized outreach messages.  
     * **Load:** A new Lead is created with the status `DRAFT_PENDING`.  
   * **Automation:** Configured as a Vercel Cron job, scheduled to run daily at 3:00 AM, processing a batch size of 5 prospects per run.

\-----Key Operational Components

**Operational Dashboard & Client Onboarding (The "CEO View"):**

* **Platform Dashboard:** Provides aggregated metrics such as Monthly Recurring Revenue (MRR) and Lead Conversion Rates.  
* **Prospect Triage & Context-Rich Editing:** A split-pane UI allows the agency to review the AI-generated `scrapedData` (pain points) while editing the final pitch draft, providing essential oversight before dispatch.  
* **Transactional Client Onboarding:** Uses Prisma's "Nested Write" for transactional integrity, simultaneously creating the Client record and the associated `AgentConfig` when provisioning a new tenant.

**Third-Party Integrations:**

* **Payment API (Paddle):** Used as the Merchant of Record to offload tax and payment complexity.  
  * **"Gatekeeper" Logic:** The `clientId` is passed via Paddle's `customData` field during checkout. The webhook handler uses this ID to update the Client record to `subscriptionActive: true` upon a `subscription.activated` event.  
* **Scheduling API (Cal.com):** Provides a headless API for scheduling.  
  * **Webhook Security & State Recovery:** Webhook security is ensured via HMAC SHA-256 signature verification. State recovery is implemented for events like `BOOKING_CANCELLED` to maintain dashboard accuracy, updating the Lead status and setting a follow-up date.

---

## Update Block

**Last updated:** 2026-03-16

**What changed:** Living SOP adaptation. Platform vs tenant split: `Client.isPlatformClient`, `getPlatformClientId()`. `captureLeadDetails` now a factory with `clientId`. Native platform chat on home page (`clientId: "platform"`). Outbound restricted to platform-only (queue, leads APIs). Restored automation dashboard (hub, queue, leads) with prospect triage split-pane. Customer portal at `/portal` (dashboard, embed, billing, settings)—replaced tenant dashboard at `/dashboard/tenant`; removed dynamic `[domain]` segment. Paddle webhook (`subscription.activated`), Cal.com webhook (`BOOKING_CANCELLED`). Client onboarding API `POST /api/admin/clients`. Auth: `proxy.ts` uses `createRouteMatcher` for public routes; dashboard protected.

**Verification performed:** `bun run test` (126 passed), `bun run build` (passed).