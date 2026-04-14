import svgPaths from "@/imports/Landing/svg-3bp3v10rhn";

export function LandingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <svg
        role="presentation"
        className="absolute top-0 left-0 h-full w-full opacity-40 mix-blend-screen"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 979 583"
      >
        <path d={svgPaths.p53f4d80} fill="#2F71F5" fillOpacity="0.05" />
      </svg>
      <svg
        role="presentation"
        className="absolute top-[20%] right-[-10%] h-[623px] w-[1065px] opacity-40 mix-blend-screen"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1065 623"
      >
        <path d={svgPaths.p9436980} fill="#5810C4" fillOpacity="0.05" />
        <path d={svgPaths.p9436980} fill="#612FF5" fillOpacity="0.05" />
      </svg>
    </div>
  );
}
