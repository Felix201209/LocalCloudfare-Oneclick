import fs from "node:fs";
import pino from "pino";
import { APP_DIR, AUDIT_LOG_PATH } from "../config/paths.js";

if (!fs.existsSync(APP_DIR)) {
  fs.mkdirSync(APP_DIR, { recursive: true });
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: {
    targets: [
      {
        target: "pino/file",
        options: { destination: 1 },
      },
      {
        target: "pino/file",
        options: { destination: AUDIT_LOG_PATH, mkdir: true },
      },
    ],
  },
});

export function audit(event: string, detail: Record<string, unknown>): void {
  logger.info({ type: "audit", event, detail }, "audit");
}
