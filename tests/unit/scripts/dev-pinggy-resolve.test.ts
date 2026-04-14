import { describe, expect, test } from "vitest";

import { isSafePathPinggy } from "@/scripts/dev-pinggy-resolve";

describe("isSafePathPinggy", () => {
  test("allows typical global or /usr/local installs", () => {
    expect(isSafePathPinggy("/opt/homebrew/bin/pinggy")).toBe(true);
    expect(isSafePathPinggy("/usr/local/bin/pinggy")).toBe(true);
  });

  test("rejects npm bin shims under node_modules", () => {
    expect(isSafePathPinggy("/Users/me/proj/node_modules/.bin/pinggy")).toBe(false);
    expect(isSafePathPinggy(String.raw`C:\proj\node_modules\.bin\pinggy.cmd`)).toBe(false);
  });
});
