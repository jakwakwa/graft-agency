"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HeroVideoBackgroundProps {
  src: string;
  poster?: string;
}

export function HeroVideoBackground({ src, poster }: HeroVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markLoaded = useCallback(() => setIsLoaded(true), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      markLoaded();
    }

    video.addEventListener("loadeddata", markLoaded);
    video.addEventListener("canplay", markLoaded);

    // Ensure autoplay on mobile (needs muted + playsinline)
    video.play().catch(() => {
      // Autoplay blocked — still show the poster/fallback
    });

    return () => {
      video.removeEventListener("loadeddata", markLoaded);
      video.removeEventListener("canplay", markLoaded);
    };
  }, [markLoaded]);

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

      <video
        ref={videoRef}
        className="hero-video"
        autoPlay
        muted
        playsInline
        
        preload="auto"
        poster={poster}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
