import { fireEvent, render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  describe("rendering", () => {
    it("renders with text content", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
    });

    it("renders string children as button content", () => {
      render(<Button>Submit</Button>);
      const button = screen.getByRole("button", { name: /submit/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Submit");
    });

    it("applies default variant and size classes", () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("applies variant classes when specified", () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive/10", "text-destructive");
    });

    it("applies size classes when specified", () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
    });

    it("applies xs size with text-xs", () => {
      render(<Button size="xs">Tiny</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-xs");
    });

    it("merges custom className", () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("interaction", () => {
    it("calls onClick when clicked", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      fireEvent.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>,
      );
      fireEvent.click(screen.getByRole("button"));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("buttonVariants", () => {
    it("returns correct classes for default variant", () => {
      const classes = buttonVariants({ variant: "default", size: "default" });
      expect(classes).toContain("bg-primary");
    });

    it("returns correct classes for outline variant", () => {
      const classes = buttonVariants({ variant: "outline", size: "default" });
      expect(classes).toContain("border-border");
    });
  });
});
