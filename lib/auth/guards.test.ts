import { describe, expect, it, vi } from "vitest";
import { ACCESS_REQUIRED_PATH, redirectToAccessRequired } from "./guards";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

describe("guards", () => {
  it("redirectToAccessRequired sends users to the access-required route", () => {
    expect(() => redirectToAccessRequired()).toThrow(`redirect:${ACCESS_REQUIRED_PATH}`);
  });
});
