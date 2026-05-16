#!/usr/bin/env bash
# =============================================================================
# setup-jules.sh — Graft Agency · Jules sandbox bootstrap
#
# Run this once after Jules clones the repo. It:
#   1. Validates that required environment variables exist (warns, does not fail)
#   2. Installs all dependencies with Bun
#   3. Generates the Prisma client (runs automatically via postinstall, but
#      we call it explicitly here so the output is visible)
#   4. Runs the unit test suite (vitest, no Playwright/E2E)
#   5. Runs the linter
#
# Usage:
#   bash scripts/setup-jules.sh
#
# The script WILL fail fast on any unexpected error (set -e), but env-var
# warnings are non-fatal — Jules can still compile and run unit tests without
# real external credentials.
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
YEL='\033[0;33m'
GRN='\033[0;32m'
BLU='\033[0;34m'
DIM='\033[2m'
RST='\033[0m'

info()  { echo -e "${BLU}▶${RST}  $*"; }
ok()    { echo -e "${GRN}✔${RST}  $*"; }
warn()  { echo -e "${YEL}⚠${RST}  $*"; }
err()   { echo -e "${RED}✘${RST}  $*" >&2; }
dim()   { echo -e "${DIM}$*${RST}"; }
sep()   { echo -e "${DIM}────────────────────────────────────────────────────${RST}"; }

# ── Verify we are at the repo root ───────────────────────────────────────────
if [[ ! -f "package.json" || ! -f "AGENTS.md" ]]; then
  err "Run this script from the repo root (where package.json and AGENTS.md live)."
  exit 1
fi

echo ""
echo -e "${BLU}╔══════════════════════════════════════════════╗${RST}"
echo -e "${BLU}║   Graft Agency — Jules Sandbox Setup         ║${RST}"
echo -e "${BLU}╚══════════════════════════════════════════════╝${RST}"
echo ""

# ── 1. Runtime check ─────────────────────────────────────────────────────────
sep
info "Checking runtime…"
if ! command -v bun &>/dev/null; then
  err "Bun is not installed or not on PATH."
  err "Install: curl -fsSL https://bun.sh/install | bash"
  exit 1
fi
BUN_VERSION=$(bun --version)
ok "Bun $BUN_VERSION found"

# ── 2. Environment variable audit ────────────────────────────────────────────
sep
info "Auditing environment variables…"
echo ""

# Variables that unit tests (vitest) REQUIRE to not error out.
# Missing = test failure not caused by the agent. Warn only.
REQUIRED_FOR_TESTS=(
  "DATABASE_URL"
  "CLERK_SECRET_KEY"
  "PADDLE_API_KEY"
  "PADDLE_WEBHOOK_SECRET"
  "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN"
)

# Variables that must be present for the app to compile / start.
# These are checked for awareness only in the sandbox.
NICE_TO_HAVE=(
  "PADDLE_ENVIRONMENT"
  "GITHUB_TOKEN"
  "INNGEST_EVENT_KEY"
  "STITCH_API_KEY"
  "CAL_COM_API_KEY"
  "RESEND_API_KEY"
  "WEBHOOK_PUBLIC_BASE_URL"
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  "NEXT_PUBLIC_DATADOG_APPLICATION_ID"
  "NEXT_PUBLIC_DATADOG_CLIENT_TOKEN"
)

MISSING_REQUIRED=0
MISSING_NICE=0

for var in "${REQUIRED_FOR_TESTS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    warn "Missing: $var  ${DIM}(unit tests that need this may fail — verify environment config)${RST}"
    MISSING_REQUIRED=$((MISSING_REQUIRED + 1))
  else
    ok "Present: $var"
  fi
done

echo ""
dim "Optional (nice-to-have for full functionality):"
for var in "${NICE_TO_HAVE[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    dim "  ○ $var not set"
    MISSING_NICE=$((MISSING_NICE + 1))
  else
    dim "  ● $var present"
  fi
done

echo ""
if [[ $MISSING_REQUIRED -gt 0 ]]; then
  warn "$MISSING_REQUIRED required env var(s) missing. Some integration-style unit tests may fail."
else
  ok "All required env vars present (provided by Jules environment)."
fi

# ── 3. Install dependencies ───────────────────────────────────────────────────
sep
info "Installing dependencies with Bun…"
bun install --frozen-lockfile
ok "Dependencies installed"

# ── 4. Generate Prisma client ─────────────────────────────────────────────────
sep
info "Generating Prisma client…"
# postinstall runs `prisma generate` automatically, but running it explicitly
# lets Jules see the output and catch any schema errors immediately.
bunx prisma generate
ok "Prisma client generated"

# ── 5. Lint ───────────────────────────────────────────────────────────────────
sep
info "Running Biome lint check…"
if bun run lint; then
  ok "Lint passed"
else
  warn "Lint reported issues. Run 'bun run format' to auto-fix formatting, then fix any remaining errors."
fi

# ── 6. Unit tests ─────────────────────────────────────────────────────────────
sep
info "Running unit tests (vitest, no E2E)…"
echo ""
dim "NOTE: Environment variables (DATABASE_URL, etc.) are provided to this sandbox."
dim "Pre-existing known failures (safe to ignore):"
dim "  • tests/unit/scripts/dev-local-port.test.ts       — source script missing"
dim "  • tests/unit/scripts/dev-pinggy-resolve.test.ts   — source script missing"
dim "  • tests/unit/auth/get-platform-client-id.test.ts  — requires live DB"
dim "  • tests/unit/marketing/hero-video-background.test.tsx — known bug"
echo ""

set +e  # don't exit on test failure — report it instead
bun run test
TEST_EXIT=$?
set -e

if [[ $TEST_EXIT -eq 0 ]]; then
  ok "All unit tests passed"
else
  warn "Some unit tests failed (exit code $TEST_EXIT)."
  warn "Check output above. If failures are in the known-pre-existing list, proceed."
  warn "If a NEW failure appears, investigate before opening a PR."
fi

# ── Summary ──────────────────────────────────────────────────────────────────
sep
echo ""
echo -e "${GRN}Setup complete.${RST}"
echo ""
echo -e "Next steps for Jules:"
echo -e "  ${BLU}•${RST} Make your changes"
echo -e "  ${BLU}•${RST} ${DIM}bun run test${RST}   — confirm your tests pass"
echo -e "  ${BLU}•${RST} ${DIM}bun run lint${RST}   — fix any Biome errors"
echo -e "  ${BLU}•${RST} ${DIM}bun run format${RST} — auto-fix formatting"
echo -e "  ${BLU}•${RST} Commit with a conventional message: feat:, fix:, test:, chore:"
echo -e "  ${BLU}•${RST} Push and open a PR against ${BLU}main${RST}"
echo -e "  ${BLU}•${RST} Note any pre-existing test failures in the PR description"
echo ""
dim "DO NOT run 'bun run test:all' — Playwright E2E requires live infrastructure."
echo ""

exit $TEST_EXIT
