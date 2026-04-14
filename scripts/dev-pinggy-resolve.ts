import { existsSync } from "node:fs";
import { join } from "node:path";

/** `node_modules/.bin/pinggy` is an npm shim that loads `@pinggy/pinggy` (native addon); skip it so `./bin/` standalone wins. */
export function isSafePathPinggy(absolutePath: string): boolean {
  const normalised = absolutePath.replaceAll("\\", "/");
  return !normalised.includes("/node_modules/");
}

export function resolvePinggyExecutable(projectRoot: string): string {
  if (process.env.PINGGY_BIN) {
    return process.env.PINGGY_BIN;
  }
  const candidates = [
    join(projectRoot, "bin", "pinggy"),
    join(projectRoot, "bin", "pinggy-macos-arm64"),
    join(projectRoot, "bin", "pinggy-macos-x64"),
    join(projectRoot, "bin", "pinggy-linux-x64"),
    join(projectRoot, "bin", "pinggy-linux-arm64"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  const fromPath = Bun.which("pinggy");
  if (fromPath && isSafePathPinggy(fromPath)) {
    return fromPath;
  }
  throw new Error(
    "Pinggy CLI not found. Download the standalone binary (see bin/README.md), place it under ./bin/, set PINGGY_BIN to that executable, or install the standalone CLI on your PATH (not the npm `pinggy` package). Alternatively run with DEV_NO_TUNNEL=true.",
  );
}
