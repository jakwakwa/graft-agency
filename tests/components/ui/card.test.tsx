import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("renders the compound card sections", () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>Billing</Card.Title>
          <Card.Description>Manage your subscription</Card.Description>
        </Card.Header>
        <Card.Content>Current plan: Pro</Card.Content>
        <Card.Footer>Renews monthly</Card.Footer>
      </Card>,
    );

    expect(screen.getByText("Billing")).toBeInTheDocument();
    expect(screen.getByText("Manage your subscription")).toBeInTheDocument();
    expect(screen.getByText("Current plan: Pro")).toBeInTheDocument();
    expect(screen.getByText("Renews monthly")).toBeInTheDocument();
  });

  it("propagates the small size to child sections", () => {
    render(
      <Card size="sm">
        <Card.Header data-testid="header">Compact header</Card.Header>
        <Card.Content data-testid="content">Compact content</Card.Content>
      </Card>,
    );

    expect(screen.getByTestId("header")).toHaveAttribute("data-size", "sm");
    expect(screen.getByTestId("content")).toHaveAttribute("data-size", "sm");
  });
});
