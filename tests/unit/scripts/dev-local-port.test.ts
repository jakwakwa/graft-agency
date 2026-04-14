import { describe, expect, test } from "vitest";

import { assertLocalPortAvailable } from "@/scripts/dev-local-port";

describe("assertLocalPortAvailable", () => {
  test("rejects invalid PORT", async () => {
    await expect(assertLocalPortAvailable("not-a-port")).rejects.toThrow(/Invalid PORT/);
  });

  test("rejects out-of-range port", async () => {
    await expect(assertLocalPortAvailable("0")).rejects.toThrow(/Invalid PORT/);
  });
});
