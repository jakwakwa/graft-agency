"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/components/ui/use-mobile";
import Image from "next/image";
interface HeroVideoBackgroundProps {
  src: string;
  poster?: string;
}

export function HeroVideoBackground({ src, poster }: HeroVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isMobile = useIsMobile();
  const markLoaded = useCallback(() => setIsLoaded(true), []);

  useEffect(() => {
    if (isMobile) return;

    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      markLoaded();
    }

    video.addEventListener("loadeddata", markLoaded);
    video.addEventListener("canplay", markLoaded);

    // Ensure autoplay on desktop (needs muted + playsinline)
    video.play().catch(() => {
      // Autoplay blocked — still show the poster/fallback
    });

    return () => {
      video.removeEventListener("loadeddata", markLoaded);
      video.removeEventListener("canplay", markLoaded);
    };
  }, [isMobile, markLoaded]);

  return (
    <div className="hero-video-wrap" aria-hidden>
      {/* Gradient mask: top + bottom fade to black */}
      <div className="hero-video-mask" />

      {/* Scanline overlay for CRT effect */}
      <div className="hero-scanlines" />

      {/* Radial vignette */}
      <div className="hero-vignette" />

      {/* Chromatic edge glow */}
      <div className="hero-chromatic-edge" />

      {!isMobile && <img className="hero-video" src={"Robot_concierge.jpg"} />}
    </div>
  );
}
