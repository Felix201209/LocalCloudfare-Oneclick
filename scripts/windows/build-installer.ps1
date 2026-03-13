$ErrorActionPreference = 'Stop'

Write-Host "[build-installer] npm ci"
npm ci

Write-Host "[build-installer] npm run build"
npm run build

$iscc = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if (-not (Test-Path $iscc)) {
  throw "未找到 Inno Setup 编译器: $iscc"
}

Write-Host "[build-installer] compiling Inno Setup script"
& $iscc "installer\LocalCloudflare.iss"
if ($LASTEXITCODE -ne 0) {
  throw "Inno Setup 编译失败，退出码: $LASTEXITCODE"
}

Write-Host "[build-installer] done: dist-installer\LocalCloudflare-Setup.exe"
