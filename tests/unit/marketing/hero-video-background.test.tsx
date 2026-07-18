import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeroVideoBackground } from "@/components/marketing/landing-v2/hero-video-background";

function getRenderedBackgroundImage() {
  const image = document.querySelector("img.hero-video");
  if (!image) {
    throw new Error("Expected hero background image to render");
  }

  return image;
}

describe("HeroVideoBackground", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders the static hero background image on desktop", () => {
    render(<HeroVideoBackground src="/Robot_concierge.mp4" />);

    expect(getRenderedBackgroundImage()).toHaveAttribute("src", "Robot_concierge.jpg");
  });

  it("does not render the retired video element", () => {
    render(<HeroVideoBackground src="/Robot_concierge.mp4" />);

    expect(document.querySelector("video")).not.toBeInTheDocument();
  });
});
