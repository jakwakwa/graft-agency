import { render, screen } from "@testing-library/react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

describe("Card", () => {
  it("renders without ring border and uses ambient shadow", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>,
    );
    const card = screen.getByText("Title").closest("[data-slot=card]");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("shadow-ambient");
    expect(card).not.toHaveClass("ring-1");
  });

  it("renders footer without top border utility", () => {
    render(
      <Card>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    const footer = screen.getByText("Footer").closest("[data-slot=card-footer]");
    expect(footer).toBeInTheDocument();
    expect(footer).not.toHaveClass("border-t");
  });
});
