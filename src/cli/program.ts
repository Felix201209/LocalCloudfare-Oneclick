import { Command } from "commander";
import { cmdDoctor, cmdInit, cmdStart, cmdStatus } from "./commands.js";

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("localcloudflare")
    .description("Windows 本地服务通过 Cloudflare Tunnel 暴露到公网的安全向导")
    .version("0.1.0");

  program.command("doctor").description("检查环境依赖（Node/cloudflared/Git）").action(cmdDoctor);
  program.command("init").description("交互式初始化配置（Cloudflare zone + tunnel + hostname）").action(cmdInit);
  program.command("start").description("启动本地 admin 服务并输出 cloudflared 运行提示").action(cmdStart);
  program.command("status").description("查看当前配置和服务摘要").action(cmdStatus);

  return program;
}
