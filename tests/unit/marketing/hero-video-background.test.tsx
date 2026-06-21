import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroVideoBackground } from "@/components/marketing/landing-v2/hero-video-background";

function getRenderedVideo() {
  const video = document.querySelector("video");
  if (!video) {
    throw new Error("Expected hero video to render");
  }

  return video;
}

describe("HeroVideoBackground", () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reveals the video when first frame data is loaded", () => {
    render(<HeroVideoBackground src="/Robot_concierge.mp4" />);

    const video = getRenderedVideo();
    expect(video).toHaveStyle({ opacity: "0" });

    fireEvent.loadedData(video);

    expect(video).toHaveStyle({ opacity: "1" });
  });

  it("loops the background video playback", () => {
    render(<HeroVideoBackground src="/Robot_concierge.mp4" />);

    expect(getRenderedVideo()).toHaveAttribute("loop");
  });
});
