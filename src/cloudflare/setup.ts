import fs from "node:fs/promises";
import { CLOUDFLARED_CONFIG_PATH, GENERATED_DIR, WINDOWS_SERVICE_SCRIPT_PATH } from "../config/paths.js";
import { CloudflareClient, Zone } from "./client.js";

export type TunnelSetupInput = {
  accountId: string;
  zone: Zone;
  tunnelName: string;
  appHostname: string;
  adminHostname: string;
  appPort: number;
  adminPort: number;
};

export type TunnelSetupResult = {
  tunnelId: string;
  reused: boolean;
};

export async function ensureHostnameAvailable(client: CloudflareClient, zoneId: string, hostname: string): Promise<void> {
  const existing = await client.getDnsRecordByName(zoneId, hostname);
  if (existing) {
    throw new Error(`域名冲突: ${hostname} 已存在 DNS 记录(${existing.type} -> ${existing.content})`);
  }
}

export async function setupTunnelAndDns(client: CloudflareClient, input: TunnelSetupInput): Promise<TunnelSetupResult> {
  const tunnels = await client.listTunnels(input.accountId);
  const existing = tunnels.find((t) => t.name === input.tunnelName);

  const tunnel = existing ?? (await client.createTunnel(input.accountId, input.tunnelName));
  const tunnelTarget = `${tunnel.id}.cfargotunnel.com`;

  await ensureHostnameAvailable(client, input.zone.id, input.appHostname);
  await ensureHostnameAvailable(client, input.zone.id, input.adminHostname);

  await client.createCnameRecord(input.zone.id, input.appHostname, tunnelTarget);
  await client.createCnameRecord(input.zone.id, input.adminHostname, tunnelTarget);

  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.writeFile(
    CLOUDFLARED_CONFIG_PATH,
    `tunnel: ${tunnel.id}\ncredentials-file: C:/Users/%USERNAME%/.cloudflared/${tunnel.id}.json\ningress:\n  - hostname: ${input.appHostname}\n    service: http://localhost:${input.appPort}\n  - hostname: ${input.adminHostname}\n    service: http://localhost:${input.adminPort}\n  - service: http_status:404\n`,
    "utf-8"
  );

  await fs.writeFile(
    WINDOWS_SERVICE_SCRIPT_PATH,
    `# 以管理员 PowerShell 运行\ncloudflared service uninstall\ncloudflared service install\nWrite-Host \"Cloudflared service installed.\"\nWrite-Host \"检查服务: Get-Service cloudflared\"\nWrite-Host \"查看日志: Get-WinEvent -LogName Application | ? {$_.ProviderName -like '*cloudflared*'}\"\n`,
    "utf-8"
  );

  return {
    tunnelId: tunnel.id,
    reused: Boolean(existing),
  };
}
