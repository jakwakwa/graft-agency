import "dotenv/config";

import { type ChildProcess, spawn } from "node:child_process";

import { assertLocalPortAvailable } from "./dev-local-port";
import { resolvePinggyExecutable } from "./dev-pinggy-resolve";

const projectRoot = process.cwd();
const port = process.env.PORT ?? "3000";
const clerkWebhookPath = "/api/webhooks/clerk";

function spawnInherited(command: string, args: readonly string[]): ChildProcess {
  return spawn(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env, PORT: port },
    shell: false,
  });
}

async function waitForNextReady(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 800);
      const res = await fetch(url, { signal: controller.signal, redirect: "manual" });
      clearTimeout(timer);
      if (res.status < 600) {
        return;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Timed out waiting for Next.js at ${url}`);
}

function printWebhookBanner(): void {
  const base = process.env.WEBHOOK_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const clerkWebhookUrl = base?.endsWith(clerkWebhookPath) ? base : base ? `${base}${clerkWebhookPath}` : null;
  console.log("\n──────── Graft dev ────────");
  if (clerkWebhookUrl) {
    console.log("Clerk webhook URL (Dashboard → Webhooks):");
    console.log(`  ${clerkWebhookUrl}`);
    console.log("Subscribe to: organization.created, organizationMembership.created, organizationMembership.deleted");
    console.log("Paste the signing secret into CLERK_WEBHOOK_SECRET for this endpoint.");
  } else {
    console.log("Set WEBHOOK_PUBLIC_BASE_URL in .env.local to your Pinggy HTTPS origin");
    console.log("(stable hostname: Pinggy Pro + token — https://pinggy.io/docs/persistent_subdomain/)");
    console.log("Then register: https://<your-tunnel>/api/webhooks/clerk");
  }
  if (!process.env.PINGGY_TOKEN) {
    console.log("\nWithout PINGGY_TOKEN the public URL may change each run (Pinggy free tunnels).");
    console.log("Use a Pro token + persistent subdomain, then set WEBHOOK_PUBLIC_BASE_URL once.");
  }
  console.log("HTTP tunnels overview: https://pinggy.io/docs/http_tunnels/");
  console.log("────────────────────────────\n");
}

let nextChild: ChildProcess | null = null;
let pinggyChild: ChildProcess | null = null;

function shutdownChild(child: ChildProcess | null): void {
  if (!child || child.killed) {
    return;
  }
  child.kill("SIGTERM");
}

async function main(): Promise<void> {
  const skipTunnel = process.env.DEV_NO_TUNNEL === "1" || process.env.DEV_NO_TUNNEL === "true";

  await assertLocalPortAvailable(port);

  if (skipTunnel) {
    nextChild = spawnInherited("bun", ["run", "dev:next-only"]);
    await new Promise<void>((resolve, reject) => {
      nextChild?.once("exit", (code) => {
        if (code === 0 || code === null) {
          resolve();
        } else {
          reject(new Error(`Next.js exited with code ${code}`));
        }
      });
      nextChild?.once("error", reject);
    });
    return;
  }

  const pinggyExe = resolvePinggyExecutable(projectRoot);
  nextChild = spawnInherited("bun", ["run", "dev:next-only"]);
  await waitForNextReady(`http://127.0.0.1:${port}`, 120_000);

  const pinggyArgs: string[] = [];
  if (process.env.PINGGY_TOKEN) {
    pinggyArgs.push("--token", process.env.PINGGY_TOKEN);
  }
  // Standalone Pinggy CLI: HTTPS-only ingress, pass CORS preflight (Clerk webhooks)
  pinggyArgs.push("x:https", "x:passpreflight", "-l", port);

  pinggyChild = spawnInherited(pinggyExe, pinggyArgs);
  printWebhookBanner();

  const exitCode = await new Promise<number>((resolve) => {
    let settled = false;
    const finish = (code: number | null): void => {
      if (settled) {
        return;
      }
      settled = true;
      shutdownChild(pinggyChild);
      shutdownChild(nextChild);
      resolve(code ?? 0);
    };

    nextChild?.once("exit", (code) => finish(code));
    pinggyChild?.once("exit", (code) => finish(code));
    nextChild?.once("error", () => finish(1));
    pinggyChild?.once("error", () => finish(1));
  });

  process.exit(exitCode);
}

function onSignal(signal: NodeJS.Signals): void {
  shutdownChild(pinggyChild);
  shutdownChild(nextChild);
  process.exit(signal === "SIGINT" ? 0 : 1);
}

process.once("SIGINT", () => onSignal("SIGINT"));
process.once("SIGTERM", () => onSignal("SIGTERM"));

main().catch((e: unknown) => {
  console.error(e);
  shutdownChild(pinggyChild);
  shutdownChild(nextChild);
  process.exit(1);
});
