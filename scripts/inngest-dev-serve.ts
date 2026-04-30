#!/usr/bin/env bun
/**
 * Starts `inngest dev` with the correct Next.js serve path for this repo (`/api/graft-today/inngest`).
 * Respects NEXT_PUBLIC_APP_URL or PORT in .env.
 */
import "dotenv/config";
import { spawn } from "node:child_process";

const base = (process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`).replace(/\/$/, "");
const url = `${base}/api/graft-today/inngest`;
console.log(`[inngest dev] sync URL: ${url}\n`);
const child = spawn("bunx", ["inngest", "dev", "-u", url], { stdio: "inherit" });
child.on("exit", (c) => process.exit(c ?? 0));
