import chalk from "chalk";
import dotenv from "dotenv";
import { createAdminServer } from "../admin/server.js";
import { initAdminDb } from "../admin/db.js";
import { CLOUDFLARED_CONFIG_PATH, ENV_PATH, WINDOWS_SERVICE_SCRIPT_PATH } from "../config/paths.js";
import { readConfig } from "../config/store.js";
import { runDoctorChecks, summarizeDoctorResult } from "../wizard/doctor.js";
import { runInitWizard } from "../wizard/init.js";

export async function cmdDoctor(): Promise<void> {
  const checks = runDoctorChecks();
  for (const row of checks) {
    const icon = row.installed ? chalk.green("✔") : chalk.red("✘");
    console.log(`${icon} ${row.name}${row.version ? ` (${row.version})` : ""}`);
    if (!row.installed) {
      console.log(`   安装建议: ${row.installHint}`);
    }
  }

  const summary = summarizeDoctorResult(checks);
  if (!summary.ok) {
    console.log(chalk.red("\n❌ 缺少必需依赖，请先安装后再执行 init/start。"));
    return;
  }

  console.log(chalk.green("\n✅ 环境检查通过"));
}

export async function cmdInit(): Promise<void> {
  await runInitWizard();
}

export async function cmdStart(): Promise<void> {
  dotenv.config({ path: ENV_PATH });
  const config = await readConfig();

  await initAdminDb(config.admin);
  const server = await createAdminServer({
    ...config,
    security: {
      ...config.security,
      accessAud: process.env.CF_ACCESS_AUD || config.security.accessAud,
    },
  });
  await server.start();

  console.log(chalk.green("\n✅ admin 服务已启动（仅 localhost）"));
  console.log(`- 本地: http://127.0.0.1:${config.admin.adminPort}/health`);
  console.log(`- Tunnel 配置文件: ${CLOUDFLARED_CONFIG_PATH}`);
  console.log(`\ncloudflared 运行建议:`);
  console.log(`cloudflared tunnel --config "${CLOUDFLARED_CONFIG_PATH}" run ${config.tunnel.name}`);
  console.log(`\nWindows 服务安装脚本: ${WINDOWS_SERVICE_SCRIPT_PATH}`);
}

export async function cmdStatus(): Promise<void> {
  const config = await readConfig();

  console.log(chalk.cyan("=== LocalCloudflare 状态摘要 ==="));
  console.log(`项目: ${config.projectName}`);
  console.log(`Zone: ${config.cloudflare.zoneName} (${config.cloudflare.zoneId})`);
  console.log(`Tunnel: ${config.tunnel.name} (${config.tunnel.tunnelId})`);
  console.log(`App URL: https://${config.hostnames.app}`);
  console.log(`Admin URL: https://${config.hostnames.admin}`);
  console.log(`Admin 端口(本地): ${config.admin.adminPort}`);
  console.log(`Access 保护(admin): ${config.security.requireCloudflareAccessForAdmin ? "开启" : "关闭"}`);
  console.log(`更新时间: ${config.updatedAt}`);
}
