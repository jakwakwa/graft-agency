import { Environment } from "@paddle/paddle-node-sdk";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resolvePaddleEnvironment } from "@/lib/paddle";

describe("Paddle environment configuration", () => {
  it("defaults deployed environments to Paddle sandbox until production is explicitly enabled", () => {
    expect(resolvePaddleEnvironment()).toBe(Environment.sandbox);
  });

  it("uses Paddle production only when explicitly configured", () => {
    expect(resolvePaddleEnvironment("production")).toBe(Environment.production);
  });
});

describe("Paddle initialization", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws an error if PADDLE_API_KEY is not defined", async () => {
    delete process.env.PADDLE_API_KEY;
    await expect(import("@/lib/paddle")).rejects.toThrow("PADDLE_API_KEY is required to initialise Paddle.");
  });

  it("initialises Paddle successfully when PADDLE_API_KEY is provided", async () => {
    process.env.PADDLE_API_KEY = "dummy_key";
    const mod = await import("@/lib/paddle");
    expect(mod.paddle).toBeDefined();
  });
});
