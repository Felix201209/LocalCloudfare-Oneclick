#!/usr/bin/env node
import { buildProgram } from "./cli/program.js";

async function main() {
  const program = buildProgram();
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error("\n[localcloudflare] 执行失败:");
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
