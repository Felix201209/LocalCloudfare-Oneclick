import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { APP_DIR, CONFIG_PATH } from "./paths.js";
import { LocalCloudflareConfig, LocalCloudflareConfigSchema } from "./schema.js";

export async function ensureAppDir(): Promise<void> {
  await fs.mkdir(APP_DIR, { recursive: true });
}

export async function writeConfig(config: LocalCloudflareConfig): Promise<void> {
  await ensureAppDir();
  const parsed = LocalCloudflareConfigSchema.parse(config);
  await fs.writeFile(CONFIG_PATH, JSON.stringify(parsed, null, 2), "utf-8");
}

export async function readConfig(): Promise<LocalCloudflareConfig> {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(`配置文件不存在: ${CONFIG_PATH}。请先运行 localcloudflare init`);
  }

  const raw = await fs.readFile(CONFIG_PATH, "utf-8");
  const json = JSON.parse(raw);
  return LocalCloudflareConfigSchema.parse(json);
}
