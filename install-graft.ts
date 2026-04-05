import { existsSync } from "node:fs";
import { $ } from "bun";

async function install() {
  console.log("🚀 Starting GRAFT Engine Installation (Base UI Edition)...");

  if (!existsSync("./package.json")) {
    await $`bun init -y`;
  }

  const deps = [
    "next@latest",
    "react@19",
    "react-dom@19",
    "ai@latest",
    "@ai-sdk/openai@latest",
    "@ai-sdk/react@latest",
    "@clerk/nextjs@latest",
    "@prisma/client@latest",
    "@paddle/paddle-node-sdk@latest",
    "@paddle/paddle-js@latest",
    "@base-ui-components/react@latest",
    "resend@latest",
    "lucide-react",
    "zod",
    "clsx",
    "tailwind-merge",
    "cheerio",
    "svix",
    "date-fns",
  ];

  const devDeps = [
    "prisma@latest",
    "tailwindcss@latest",
    "@tailwindcss/postcss@latest",
    "@types/node",
    "@types/react@19",
    "@types/react-dom@19",
    "typescript",
    "@playwright/test",
    "vitest",
  ];

  console.log("📦 Installing dependencies...");
  await $`bun add ${deps}`;
  await $`bun add -d ${devDeps}`;

  if (!existsSync("./prisma")) {
    await $`bunx prisma init`;
  }

  console.log("\n✅ GRAFT Engine (Base UI) dependencies installed.");
  console.log("Note: Manual configuration of Base UI components is required as shadcn-ui is Radix-centric.");
}

install().catch(console.error);
