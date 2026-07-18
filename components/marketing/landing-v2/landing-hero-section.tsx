"use client";

import { SignUpButton } from "@clerk/nextjs";
import { Link, Zap } from "lucide-react";
import { motion, useScroll, useTransform, type Variants } from "motion/react";
import { useRef } from "react";
import { HeroFloatingCards } from "./hero-floating-cards";
import { HeroVideoBackground } from "./hero-video-background";

function scrollToPricing() {
  const target = document.getElementById("bot-pricing");
  if (!target) return;
  const offset = 150; // Leave space for sticky header & tab switcher
  const bodyRect = document.body.getBoundingClientRect().top;
  const elementRect = target.getBoundingClientRect().top;
  const elementPosition = elementRect - bodyRect;
  const offsetPosition = elementPosition - offset;
  window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  window.history.replaceState(null, "", "#bot-pricing");
}

const HEADLINE_VARIANTS: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const WORD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 50, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function LandingHeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax: video sinks back on scroll, content lifts
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={sectionRef} id="hero" className="hero-section">
      {/* ── Video Background Layer ── */}
      <motion.div className="hero-video-layer" style={{ y: videoY, opacity: heroOpacity }}>
        <HeroVideoBackground src="/Robot_concierge.mp4" poster={"//Robot_concierge.jpeg/"} />
      </motion.div>

      {/* ── Ambient glow orbs ── */}
      <div className="hero-orbs" aria-hidden>
        <div className="hero-orb hero-orb--primary" />
        <div className="hero-orb hero-orb--secondary" />
        <div className="hero-orb hero-orb--accent" />
      </div>

      {/* ── Content ── */}
      <motion.div className="hero-content" style={{ y: contentY }}>
        <div className="hero-content__inner">
          {/* Left: text */}
          <div className="hero-text">
            {/* Pill badge */}
            <motion.div className="hero-badge" variants={FADE_UP} initial="hidden" animate="visible" custom={0}>
              <span className="hero-badge__glow" />
              <Zap className="hero-badge__icon" />
              <span>Hyper-Performance AI Engine</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 className="hero-headline" variants={HEADLINE_VARIANTS} initial="hidden" animate="visible">
              {["The Assistant"].map((word) => (
                <motion.span key={word} className="hero-headline__word" variants={WORD_VARIANTS}>
                  {word}{" "}
                </motion.span>
              ))}
              <br />
              {["That Never"].map((word) => (
                <motion.span
                  key={word}
                  className="hero-headline__word hero-headline__word--gradient"
                  variants={WORD_VARIANTS}
                >
                  {word}{" "}
                </motion.span>
              ))}
              <motion.span className="hero-headline__word hero-headline__word--gradient" variants={WORD_VARIANTS}>
                Sleeps.
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p className="hero-subtitle" variants={FADE_UP} initial="hidden" animate="visible" custom={0.7}>
              While you and your competitors close for the night, your GRAFT white-labelled AI assistant can tirelessly
              answer customer questions, capture leads, and book appointments with unmatched reliability and
              affordability - while also triaging more complex customer queries to you or your teams in your GRAFT.TODAY
              assistant dashboard
            </motion.p>

            {/* CTA buttons */}
            <motion.div className="hero-cta-group" variants={FADE_UP} initial="hidden" animate="visible" custom={0.9}>
              <SignUpButton mode="modal">
                <button type="button" className="hero-cta hero-cta--primary">
                  <span className="hero-cta__shimmer" />
                  Hire Graft Bot
                </button>
              </SignUpButton>
              <button type="button" className="hero-cta hero-cta--ghost" onClick={scrollToPricing}>
                View Pricing
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="hero-stats font-display text-sm"
              variants={FADE_UP}
              initial="hidden"
              animate="visible"
              custom={1.1}
            >
              {[
                { value: "Ai Chatbots", label: "Instant Setup" },
                { value: "Scheduler", label: "Reliance" },
                { value: "24/7", label: "Up-Time" },
              ].map((stat) => (
                <div key={stat.label} className="hero-stat">
                  <span className="hero-stat__value text-sm">{stat.value}</span>
                  <span className="hero-stat__label text-xs">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: visual area (video shows through, cards float) */}
          <div className="hero-visual">
            <HeroFloatingCards />
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="hero-scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <div className="hero-scroll-indicator__line" />
        <span className="hero-scroll-indicator__text">SCROLL</span>
      </motion.div>
    </section>
  );
}
