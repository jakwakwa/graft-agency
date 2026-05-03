import { Environment } from "@paddle/paddle-node-sdk";
import { describe, expect, it } from "vitest";
import { resolvePaddleEnvironment } from "@/lib/paddle";

describe("Paddle environment configuration", () => {
  it("defaults deployed environments to Paddle sandbox until production is explicitly enabled", () => {
    expect(resolvePaddleEnvironment()).toBe(Environment.sandbox);
  });

  it("uses Paddle production only when explicitly configured", () => {
    expect(resolvePaddleEnvironment("production")).toBe(Environment.production);
  });
});
