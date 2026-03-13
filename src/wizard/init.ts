import fs from "node:fs/promises";
import prompts from "prompts";
import chalk from "chalk";
import { CloudflareClient } from "../cloudflare/client.js";
import { setupTunnelAndDns } from "../cloudflare/setup.js";
import { CLOUDFLARED_CONFIG_PATH, ENV_PATH } from "../config/paths.js";
import { LocalCloudflareConfig } from "../config/schema.js";
import { ensureAppDir, writeConfig } from "../config/store.js";
import { initAdminDb } from "../admin/db.js";

function isValidHostname(hostname: string): boolean {
  return /^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(hostname);
}

export async function runInitWizard(): Promise<void> {
  await ensureAppDir();

  const base = await prompts([
    {
      type: "password",
      name: "apiToken",
      message: "请输入 Cloudflare API Token（建议最小权限 token）",
      validate: (v: string) => (v?.trim() ? true : "Token 不能为空"),
    },
    {
      type: "text",
      name: "projectName",
      message: "项目名",
      initial: "localcloudflare-app",
      validate: (v: string) => (v?.trim() ? true : "项目名不能为空"),
    },
    {
      type: "text",
      name: "tunnelName",
      message: "Tunnel 名称",
      initial: "localcloudflare-tunnel",
    },
    {
      type: "number",
      name: "appPort",
      message: "本地 app 端口",
      initial: 3000,
    },
    {
      type: "number",
      name: "adminPort",
      message: "本地 admin 端口",
      initial: 3001,
    },
    {
      type: "number",
      name: "websocketPort",
      message: "本地 WebSocket 端口",
      initial: 3002,
    },
  ]);

  const client = new CloudflareClient(base.apiToken);
  await client.checkToken();

  const zones = await client.listZones();
  if (!zones.length) {
    throw new Error("当前 token 下没有可用 zone/domain");
  }

  const zonePick = await prompts({
    type: "select",
    name: "zoneId",
    message: "选择要绑定的域名 zone",
    choices: zones.map((z) => ({ title: z.name, value: z.id })),
  });

  const zone = zones.find((z) => z.id === zonePick.zoneId);
  if (!zone) {
    throw new Error("未选择有效 zone");
  }

  const hostnames = await prompts([
    {
      type: "text",
      name: "appHostname",
      message: "app 子域名（如 app.example.com）",
      validate: (v: string) => (isValidHostname(v) ? true : "hostname 格式不正确"),
    },
    {
      type: "text",
      name: "adminHostname",
      message: "admin 子域名（如 admin.example.com）",
      validate: (v: string) => (isValidHostname(v) ? true : "hostname 格式不正确"),
    },
  ]);

  const setupResult = await setupTunnelAndDns(client, {
    accountId: zone.account.id,
    zone,
    tunnelName: base.tunnelName,
    appHostname: hostnames.appHostname,
    adminHostname: hostnames.adminHostname,
    appPort: base.appPort,
    adminPort: base.adminPort,
  });

  const config: LocalCloudflareConfig = {
    projectName: base.projectName,
    cloudflare: {
      accountId: zone.account.id,
      zoneId: zone.id,
      zoneName: zone.name,
      apiTokenEnv: "CLOUDFLARE_API_TOKEN",
    },
    tunnel: {
      name: base.tunnelName,
      tunnelId: setupResult.tunnelId,
      credentialsFile: `C:/Users/%USERNAME%/.cloudflared/${setupResult.tunnelId}.json`,
      configFile: CLOUDFLARED_CONFIG_PATH,
    },
    hostnames: {
      app: hostnames.appHostname,
      admin: hostnames.adminHostname,
    },
    admin: {
      appPort: base.appPort,
      adminPort: base.adminPort,
      websocketPort: base.websocketPort,
      allowedOrigins: [
        `https://${hostnames.appHostname}`,
        `https://${hostnames.adminHostname}`,
      ],
      siteTitle: "LocalCloudflare Admin",
      rateLimitPerMinute: 120,
    },
    security: {
      requireCloudflareAccessForAdmin: true,
    },
    updatedAt: new Date().toISOString(),
  };

  await writeConfig(config);
  await initAdminDb(config.admin);

  await fs.writeFile(
    ENV_PATH,
    `# 请填写真实值\nCLOUDFLARE_API_TOKEN=${base.apiToken}\nCF_ACCESS_AUD=\n`,
    "utf-8"
  );

  console.log(chalk.green("\n✅ 初始化完成"));
  console.log(`- Tunnel ID: ${setupResult.tunnelId} (${setupResult.reused ? "复用" : "新建"})`);
  console.log(`- app: https://${config.hostnames.app}`);
  console.log(`- admin: https://${config.hostnames.admin} (建议开启 Cloudflare Access Policy)`);
  console.log(`\n下一步:`);
  console.log(`1) cloudflared tunnel login`);
  console.log(`2) cloudflared tunnel run ${config.tunnel.name}`);
  console.log(`3) 或参考生成脚本注册 Windows 服务`);
}
