param(
  [string]$InstallDir = "$env:ProgramFiles\LocalCloudflare"
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) {
  Write-Host "[LocalCloudflare Installer] $msg"
}

function Test-Command($name) {
  return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

function Ensure-Dependency($cmd, $wingetId) {
  if (Test-Command $cmd) {
    Write-Step "$cmd 已安装"
    return
  }

  Write-Step "$cmd 未安装，尝试通过 winget 安装 ($wingetId)"
  if (-not (Test-Command "winget")) {
    throw "未检测到 winget，无法自动安装依赖。请先手动安装 $cmd"
  }

  winget install --id $wingetId --exact --accept-source-agreements --accept-package-agreements --silent

  if (-not (Test-Command $cmd)) {
    throw "$cmd 安装后仍不可用，请手动检查。"
  }
}

Write-Step "检查依赖..."
Ensure-Dependency -cmd "node" -wingetId "OpenJS.NodeJS.LTS"
Ensure-Dependency -cmd "cloudflared" -wingetId "Cloudflare.cloudflared"

Write-Step "安装 npm 运行时依赖（首次安装需要联网）..."
Push-Location $InstallDir
try {
  npm install --omit=dev --no-fund --no-audit
  npm run build
} finally {
  Pop-Location
}

Write-Step "创建用户目录 ~/.localcloudflare"
$homeCfg = Join-Path $env:USERPROFILE ".localcloudflare"
New-Item -ItemType Directory -Path $homeCfg -Force | Out-Null

Write-Step "安装后准备完成。你现在可以在开始菜单使用：初始化向导 / 启动服务 / 状态检查"
