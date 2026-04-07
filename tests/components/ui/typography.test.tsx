import { render, screen } from "@testing-library/react";
import {
  TypographyBlockquote,
  TypographyCode,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography";

describe("Typography", () => {
  describe("TypographyH1", () => {
    it("renders as h1 with expected classes", () => {
      render(<TypographyH1>Heading 1</TypographyH1>);
      const el = screen.getByRole("heading", { level: 1 });
      expect(el.tagName).toBe("H1");
      expect(el).toHaveTextContent("Heading 1");
      expect(el).toHaveClass("font-display", "text-[3.5rem]", "font-bold", "tracking-[-0.04em]");
    });
  });

  describe("TypographyH2", () => {
    it("renders as h2 with expected classes", () => {
      render(<TypographyH2>Heading 2</TypographyH2>);
      const el = screen.getByRole("heading", { level: 2 });
      expect(el.tagName).toBe("H2");
      expect(el).toHaveTextContent("Heading 2");
      expect(el).toHaveClass("font-display", "text-3xl", "font-semibold");
      expect(el).not.toHaveClass("border-b");
    });
  });

  describe("TypographyH3", () => {
    it("renders as h3 with expected classes", () => {
      render(<TypographyH3>Heading 3</TypographyH3>);
      const el = screen.getByRole("heading", { level: 3 });
      expect(el.tagName).toBe("H3");
      expect(el).toHaveTextContent("Heading 3");
      expect(el).toHaveClass("font-display", "text-2xl", "font-semibold");
    });
  });

  describe("TypographyH4", () => {
    it("renders as h4 with expected classes", () => {
      render(<TypographyH4>Heading 4</TypographyH4>);
      const el = screen.getByRole("heading", { level: 4 });
      expect(el.tagName).toBe("H4");
      expect(el).toHaveTextContent("Heading 4");
      expect(el).toHaveClass("font-data", "text-sm", "uppercase");
    });
  });

  describe("TypographyP", () => {
    it("renders as p with expected classes", () => {
      render(<TypographyP>Paragraph text</TypographyP>);
      const el = screen.getByText("Paragraph text");
      expect(el.tagName).toBe("P");
      expect(el).toHaveClass("text-base", "leading-relaxed", "font-sans");
    });
  });

  describe("TypographyBlockquote", () => {
    it("renders as blockquote with RTL-friendly classes", () => {
      render(<TypographyBlockquote>Quote text</TypographyBlockquote>);
      const el = screen.getByText("Quote text");
      expect(el.tagName).toBe("BLOCKQUOTE");
      expect(el).toHaveClass("border-s-2", "border-outline-ghost", "italic");
    });
  });

  describe("TypographyLead", () => {
    it("renders as p with lead styling", () => {
      render(<TypographyLead>Lead paragraph</TypographyLead>);
      const el = screen.getByText("Lead paragraph");
      expect(el.tagName).toBe("P");
      expect(el).toHaveClass("text-xl", "text-muted-foreground");
    });
  });

  describe("TypographyLarge", () => {
    it("renders as div with large text styling", () => {
      render(<TypographyLarge>Large text</TypographyLarge>);
      const el = screen.getByText("Large text");
      expect(el.tagName).toBe("DIV");
      expect(el).toHaveClass("font-display", "text-lg", "font-semibold");
    });
  });

  describe("TypographySmall", () => {
    it("renders as small with expected classes", () => {
      render(<TypographySmall>Small text</TypographySmall>);
      const el = screen.getByText("Small text");
      expect(el.tagName).toBe("SMALL");
      expect(el).toHaveClass("font-data", "text-sm", "font-medium");
    });
  });

  describe("TypographyMuted", () => {
    it("renders as p with muted styling", () => {
      render(<TypographyMuted>Muted text</TypographyMuted>);
      const el = screen.getByText("Muted text");
      expect(el.tagName).toBe("P");
      expect(el).toHaveClass("text-sm", "text-muted-foreground");
    });
  });

  describe("TypographyCode", () => {
    it("renders as code with font-data", () => {
      render(<TypographyCode>@radix-ui/react</TypographyCode>);
      const el = screen.getByText("@radix-ui/react");
      expect(el.tagName).toBe("CODE");
      expect(el).toHaveClass("font-data", "bg-muted");
    });
  });

  describe("TypographyList", () => {
    it("renders as ul with list styling", () => {
      render(
        <TypographyList>
          <li>Item 1</li>
          <li>Item 2</li>
        </TypographyList>,
      );
      const el = screen.getByRole("list");
      expect(el.tagName).toBe("UL");
      expect(el).toHaveClass("list-disc");
    });
  });

  describe("className merging", () => {
    it("merges custom className with base styles", () => {
      render(<TypographyH1 className="custom-class">Title</TypographyH1>);
      const el = screen.getByRole("heading", { level: 1 });
      expect(el).toHaveClass("custom-class", "font-display");
    });
  });
});
