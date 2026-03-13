import express from "express";
import { LocalCloudflareConfig, MutableAdminConfigSchema } from "../config/schema.js";
import { readAdminConfigFromDb, writeAdminConfigToDb } from "./db.js";
import { cloudflareAccessMiddleware } from "../security/access.js";
import { audit, logger } from "../security/logger.js";

export async function createAdminServer(config: LocalCloudflareConfig) {
  const app = express();
  app.use(express.json({ limit: "100kb" }));

  app.use(
    cloudflareAccessMiddleware({
      enabled: config.security.requireCloudflareAccessForAdmin,
      expectedAud: config.security.accessAud,
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "local-admin", timestamp: new Date().toISOString() });
  });

  app.get("/config", async (_req, res) => {
    const dbConfig = await readAdminConfigFromDb();
    res.json({
      config: dbConfig ?? config.admin,
      note: "仅返回白名单配置项。",
    });
  });

  app.put("/config", async (req, res) => {
    const parsed = MutableAdminConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "配置格式无效", detail: parsed.error.flatten() });
    }

    await writeAdminConfigToDb(parsed.data);
    audit("admin_config_updated", {
      changedFields: Object.keys(parsed.data),
      sourceIp: req.ip,
    });

    return res.json({ ok: true, config: parsed.data });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  return {
    start: () =>
      new Promise<void>((resolve) => {
        app.listen(config.admin.adminPort, "127.0.0.1", () => {
          logger.info({ port: config.admin.adminPort }, "admin 服务启动成功 (仅监听 localhost)");
          resolve();
        });
      }),
  };
}
