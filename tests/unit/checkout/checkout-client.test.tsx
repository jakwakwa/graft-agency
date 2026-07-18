import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutClient } from "@/app/(marketing)/checkout/checkout-client";

const paddleMocks = vi.hoisted(() => ({
  initializePaddle: vi.fn(),
}));

vi.mock("@paddle/paddle-js", () => ({
  initializePaddle: paddleMocks.initializePaddle,
}));

describe("CheckoutClient", () => {
  beforeEach(() => {
    paddleMocks.initializePaddle.mockReset();
    paddleMocks.initializePaddle.mockResolvedValue({});
  });

  it("initializes Paddle so a _ptxn payment link can open checkout", async () => {
    render(<CheckoutClient clientToken="test_client_token" environment="sandbox" />);

    await waitFor(() => {
      expect(paddleMocks.initializePaddle).toHaveBeenCalledWith({
        environment: "sandbox",
        token: "test_client_token",
      });
    });
    expect(screen.getByText("Secure checkout")).toBeInTheDocument();
  });

  it("shows a configuration error when the Paddle client token is missing", () => {
    render(<CheckoutClient clientToken="" environment="production" />);

    expect(paddleMocks.initializePaddle).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Checkout is temporarily unavailable");
  });
});
