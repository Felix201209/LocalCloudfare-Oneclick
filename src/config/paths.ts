import path from "node:path";
import os from "node:os";

export const APP_DIR = path.join(os.homedir(), ".localcloudflare");
export const CONFIG_PATH = path.join(APP_DIR, "config.json");
export const ENV_PATH = path.join(APP_DIR, ".env");
export const AUDIT_LOG_PATH = path.join(APP_DIR, "audit.log");
export const SQLITE_PATH = path.join(APP_DIR, "localcloudflare.db");
export const GENERATED_DIR = path.join(APP_DIR, "generated");
export const CLOUDFLARED_CONFIG_PATH = path.join(GENERATED_DIR, "cloudflared-config.yml");
export const WINDOWS_SERVICE_SCRIPT_PATH = path.join(GENERATED_DIR, "install-cloudflared-service.ps1");
