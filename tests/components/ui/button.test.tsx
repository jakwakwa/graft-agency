import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children through the default export", () => {
    render(<Button>Subscribe</Button>);

    expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
  });

  it("disables the button and shows the spinner when loading", () => {
    render(
      <Button isLoading>
        <Button.Spinner />
        <Button.Label>Saving</Button.Label>
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
  });
});
