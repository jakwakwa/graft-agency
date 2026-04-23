/**
 * Initialises jakwakwa/graft-today-engagement-demo-builds with Jules project files.
 * Run once after creating the repo.
 *
 * Usage: bun scripts/init-builds-repo.ts
 */

const REPO = "jakwakwa/graft-today-engagement-demo-builds";
const BASE = `https://api.github.com/repos/${REPO}`;

function ghHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

async function getFileSha(path: string): Promise<string | undefined> {
  const r = await fetch(`${BASE}/contents/${path}`, { headers: ghHeaders() });
  if (r.status === 404) return undefined;
  const body = (await r.json()) as { sha: string };
  return body.sha;
}

async function upsertFile(path: string, content: string, message: string) {
  const sha = await getFileSha(path);
  const r = await fetch(`${BASE}/contents/${path}`, {
    method: "PUT",
    headers: ghHeaders(),
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString("base64"),
      ...(sha ? { sha } : {}),
    }),
  });
  if (!r.ok) {
    const err = (await r.json()) as { message?: string };
    throw new Error(`Failed to upsert ${path}: ${err.message}`);
  }
  console.log(`  ✓ ${path}`);
}

// ------------------------------------------------------------------ content ---

const README = `# GRAFT.TODAY — Engagement Demo Builds

AI-generated prospect landing pages produced by the GRAFT.TODAY engagement pipeline.

## Structure

\`\`\`
prospects/
  {company-slug}/      ← one self-contained Next.js app per prospect
    app/
    components/
    package.json
    next.config.ts
    vercel.json
\`\`\`

Each directory is fully independent. Render deploys each PR as a preview URL that
is sent to the prospect as a sales pitch.

## How it works

1. A prospect enters the GRAFT.TODAY pipeline (profiling → PRD → design)
2. Jules receives a build task via the Jules API and writes the landing page into \`prospects/{slug}/\`
3. Jules opens a PR — Render auto-generates a preview URL
4. The preview URL is sent to the prospect

**Do not merge PRs manually** — the pipeline manages lifecycle.
`;

const AGENTS_MD = `# Jules Project Instructions — GRAFT.TODAY Engagement Demo Builds

## Purpose

You build AI-generated prospect landing pages. Each task gives you a PRD and a design
specification for a specific company. Your job is to produce a polished, compelling
landing page that GRAFT.TODAY can send to that prospect as a sales pitch.

## Non-negotiable rules

- Write ALL files inside \`prospects/{company-slug}/\` — NEVER touch files outside that directory
- Each prospect directory must be fully self-contained (its own \`package.json\`, \`next.config.ts\`, etc.)
- The landing page must look genuinely good — this is a sales asset, not a scaffold or placeholder
- Mobile-first responsive layout
- No TODOs, no placeholder text, no "lorem ipsum"

## Stack

- Next.js 15 App Router
- Tailwind CSS v4
- TypeScript
- shadcn/ui where appropriate
- No database, no auth — purely static/presentational

## PR convention

Title: \`feat: prospect landing page — {Company Name}\`
Branch: Jules will name it automatically.

Do not modify deployment infrastructure files (Render provisioning is managed
by the parent automation pipeline). Focus only on the prospect app directory.

## Quality bar

The prospect will see this page and decide whether to have a conversation with GRAFT.TODAY.
Make it feel like a real product — clear headline, value proposition, social proof section,
and a CTA ("Book a demo" or similar). Use the design spec colours and components exactly.
`;

const SETUP_SH = `#!/bin/bash
# Jules setup script — run this in the Jules repository settings UI.
#
# Paste the contents into the "Setup script" field at:
# jules.google.com → repository settings → graft-today-engagement-demo-builds
#
# This installs dependencies for whichever prospect directory Jules is working in.
# Jules will detect package.json files and install automatically, but this makes it explicit.

set -e

# Install root-level deps if present
if [ -f package.json ]; then
  npm install
fi

# Install deps inside the target prospect directory if Jules is working there
PROSPECT_DIR=$(find prospects -name "package.json" -maxdepth 2 2>/dev/null | head -1 | xargs dirname 2>/dev/null || true)
if [ -n "$PROSPECT_DIR" ] && [ -f "$PROSPECT_DIR/package.json" ]; then
  echo "Installing deps in $PROSPECT_DIR"
  cd "$PROSPECT_DIR" && npm install
fi
`;

const GITKEEP = "";

// ----------------------------------------------------------------------- run ---

async function main() {
  console.log(`Initialising ${REPO}...\n`);

  await upsertFile("README.md", README, "chore: initialise repo with Jules project docs");
  await upsertFile("AGENTS.md", AGENTS_MD, "chore: add Jules project instructions (AGENTS.md)");
  await upsertFile(".jules/setup-hint.sh", SETUP_SH, "chore: add Jules setup script hint");
  await upsertFile("prospects/.gitkeep", GITKEEP, "chore: create prospects/ directory");

  console.log(`\nDone. Next steps:`);
  console.log(`  1. Open https://jules.google.com and go to repository settings for ${REPO}`);
  console.log(`  2. Paste the contents of .jules/setup-hint.sh into the "Setup script" field`);
  console.log(`  3. Click "Run and Snapshot" to validate the environment`);
  console.log(`  4. Enable "Knowledge" (Memory) in repository settings`);
  console.log(`  5. Set JULES_SOURCE_REPO="sources/github/${REPO}" in .env (already done)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
