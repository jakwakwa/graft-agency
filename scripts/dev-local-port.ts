import { createConnection } from "node:net";

/** Fails if something is already accepting TCP on 127.0.0.1:port (avoids a stale Next.js satisfying wait-for-ready). */
export function assertLocalPortAvailable(listenPort: string): Promise<void> {
  const portNum = Number(listenPort);
  if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65_535) {
    return Promise.reject(new Error(`Invalid PORT: ${listenPort}`));
  }
  return new Promise((resolve, reject) => {
    const socket = createConnection({ port: portNum, host: "127.0.0.1" });
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timed out checking whether port ${listenPort} is free.`));
    }, 2_000);
    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.destroy();
      reject(
        new Error(
          `Port ${listenPort} is already in use on 127.0.0.1. Stop the other process (for example a previous \`bun run dev\`) or set PORT to a free value.`,
        ),
      );
    });
    socket.once("error", (err: NodeJS.ErrnoException) => {
      clearTimeout(timeout);
      if (err.code === "ECONNREFUSED") {
        resolve();
        return;
      }
      reject(err);
    });
  });
}
