import { execSync } from "node:child_process";

export type DependencyStatus = {
  name: string;
  required: boolean;
  installed: boolean;
  version?: string;
  installHint?: string;
};

function readVersion(command: string): string | undefined {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return undefined;
  }
}

function isInstalled(bin: string): boolean {
  const checker = process.platform === "win32" ? `where ${bin}` : `which ${bin}`;
  try {
    execSync(checker, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function runDoctorChecks(): DependencyStatus[] {
  return [
    {
      name: "Node.js",
      required: true,
      installed: isInstalled("node"),
      version: readVersion("node --version"),
      installHint: "winget install OpenJS.NodeJS.LTS",
    },
    {
      name: "cloudflared",
      required: true,
      installed: isInstalled("cloudflared"),
      version: readVersion("cloudflared --version"),
      installHint: "winget install Cloudflare.cloudflared",
    },
    {
      name: "Git",
      required: false,
      installed: isInstalled("git"),
      version: readVersion("git --version"),
      installHint: "winget install Git.Git",
    },
  ];
}

export function summarizeDoctorResult(rows: DependencyStatus[]): {
  ok: boolean;
  missingRequired: DependencyStatus[];
} {
  const missingRequired = rows.filter((r) => r.required && !r.installed);
  return {
    ok: missingRequired.length === 0,
    missingRequired,
  };
}
