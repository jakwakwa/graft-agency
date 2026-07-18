import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BotSettingsForm } from "@/app/(portal)/portal/settings/_components/bot-settings-form";

// Mocks
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    useFormStatus: () => ({ pending: false }),
  };
});

const actionMocks = vi.hoisted(() => ({
  saveBotSettingsAction: vi.fn(),
}));

vi.mock("@/app/(portal)/portal/settings/actions", () => ({
  saveBotSettingsAction: actionMocks.saveBotSettingsAction,
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: toastMocks,
}));

describe("BotSettingsForm", () => {
  const defaultProps = {
    initialData: {
      agentName: "Test Bot",
      greetingMessage: "Hi there!",
      systemPrompt: "You are a tester.",
      widgetPrimaryColour: "#000000",
      calComUsername: null,
      defaultEventSlug: null,
      knowledgeBase: [],
    },
    bookingEnabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an error toast when saveBotSettingsAction throws", async () => {
    const user = userEvent.setup();
    actionMocks.saveBotSettingsAction.mockRejectedValue(new Error("Network error"));

    render(<BotSettingsForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() => {
      expect(actionMocks.saveBotSettingsAction).toHaveBeenCalled();
    });

    expect(toastMocks.error).toHaveBeenCalledWith("Couldn't save. Try again, or refresh and check your connection.");
  });

  it("shows a success toast when saveBotSettingsAction succeeds", async () => {
    const user = userEvent.setup();
    actionMocks.saveBotSettingsAction.mockResolvedValue({ success: true });

    render(<BotSettingsForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() => {
      expect(actionMocks.saveBotSettingsAction).toHaveBeenCalled();
    });

    expect(toastMocks.success).toHaveBeenCalledWith(
      "Saved. Your bot will use these settings on the next conversation.",
    );
  });
});
