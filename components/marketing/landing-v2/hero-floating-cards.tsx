"use client";

import { motion, type Variants } from "motion/react";

const FLOAT_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 1.2 + i * 0.18,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

interface StatusLine {
  label: string;
  value: string;
  color?: string;
}

const STATUS_LINES: StatusLine[] = [
  { label: "NEURAL_CORE", value: "ACTIVE", color: "#4ade80" },
  { label: "RESPONSE_μs", value: "< 200", color: "#38bdf8" },
  { label: "THREAT_VECTOR", value: "NONE", color: "#4ade80" },
  { label: "ENCRYPTION", value: "AES-256-GCM", color: "#a78bfa" },
];

export function HeroFloatingCards() {
  return (
    <>
      {/* System status card — top-right */}
      <motion.div
        className="hero-float-card hero-float-card--status"
        variants={FLOAT_VARIANTS}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <div className="hero-float-card__header">
          <span className="hero-float-card__pulse" />
          <span className="hero-float-card__title">SYSTEM DIAGNOSTICS</span>
        </div>
        {STATUS_LINES.map((line) => (
          <div key={line.label} className="hero-float-card__row">
            <span className="hero-float-card__label">{line.label}</span>
            <span className="hero-float-card__value" style={{ color: line.color }}>
              {line.value}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Metrics card — bottom-left */}
      <motion.div
        className="hero-float-card hero-float-card--metrics"
        variants={FLOAT_VARIANTS}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <div className="hero-float-card__header">
          <span className="hero-float-card__pulse hero-float-card__pulse--blue" />
          <span className="hero-float-card__title">LIVE PERFORMANCE</span>
        </div>
        <div className="hero-float-card__metric-grid">
          <div className="hero-float-card__metric">
            <span className="hero-float-card__metric-value">2.4k</span>
            <span className="hero-float-card__metric-label">LEADS / MO</span>
          </div>
          <div className="hero-float-card__metric">
            <span className="hero-float-card__metric-value">99.9%</span>
            <span className="hero-float-card__metric-label">UPTIME</span>
          </div>
          <div className="hero-float-card__metric">
            <span className="hero-float-card__metric-value">0ms</span>
            <span className="hero-float-card__metric-label">LATENCY</span>
          </div>
          <div className="hero-float-card__metric">
            <span className="hero-float-card__metric-value">24/7</span>
            <span className="hero-float-card__metric-label">ACTIVE</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
