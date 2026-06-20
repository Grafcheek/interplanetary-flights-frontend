# ZeroTier -> .env.tauri / .env.lan -> npm run tauri:build
# Usage:
#   .\scripts\zerotier-setup.ps1 -NetworkId abcd1234abcd1234
#   .\scripts\zerotier-setup.ps1 -ZeroTierIp 10.99.242.73
#   .\scripts\zerotier-setup.ps1 -ZeroTierIp 10.99.242.73 -Build

param(
  [string]$NetworkId,
  [string]$ZeroTierIp,
  [switch]$Build
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$ZtCli = "C:\ProgramData\ZeroTier\One\zerotier-one_x64.exe"

function Get-ZeroTierIpFromCli {
  param([string]$Id)

  if (-not (Test-Path $ZtCli)) {
    throw "ZeroTier not found. Install: winget install ZeroTier.ZeroTierOne"
  }

  if ($Id) {
    Write-Host "Joining network $Id ..."
    & $ZtCli -q join $Id | Out-Null
    Write-Host "Open https://my.zerotier.com and Authorize this device."
    Write-Host "Waiting 15 seconds ..."
    Start-Sleep -Seconds 15
  }

  $raw = & $ZtCli -q listnetworks 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "zerotier-cli failed. Run PowerShell as admin or pass -ZeroTierIp."
  }

  foreach ($line in $raw) {
    if ($line -match "(\d+\.\d+\.\d+\.\d+)/\d+") {
      return $Matches[1]
    }
  }

  return $null
}

if (-not $ZeroTierIp) {
  $ZeroTierIp = Get-ZeroTierIpFromCli -Id $NetworkId
}

if (-not $ZeroTierIp) {
  Write-Host ""
  Write-Host "ZeroTier IP not found."
  Write-Host "1. Create network: https://my.zerotier.com"
  Write-Host "2. ZeroTier tray -> Join Network -> paste Network ID"
  Write-Host "3. Authorize device on my.zerotier.com"
  Write-Host "4. Retry: .\scripts\zerotier-setup.ps1 -ZeroTierIp YOUR_IP -Build"
  exit 1
}

Write-Host "ZeroTier IP: $ZeroTierIp"

$envTauri = @"
VITE_GUEST_MODE=true
VITE_BASE_PATH=/
VITE_API_BASE_URL=http://${ZeroTierIp}:8080/api
VITE_MINIO_BASE=http://${ZeroTierIp}:9000
"@

$envLan = @"
# LAN / ZeroTier
VITE_BASE_PATH=/
VITE_API_BASE_URL=http://${ZeroTierIp}:8080/api
VITE_MINIO_BASE=http://${ZeroTierIp}:9000
"@

Set-Content -Path (Join-Path $Root ".env.tauri") -Value $envTauri -Encoding utf8NoBOM
Set-Content -Path (Join-Path $Root ".env.lan") -Value $envLan -Encoding utf8NoBOM

Write-Host "Updated .env.tauri and .env.lan"

if ($Build) {
  Push-Location $Root
  node scripts/inject-tauri-env.mjs
  if (Test-Path dist) { Remove-Item dist -Recurse -Force }
  if (Test-Path "src-tauri\target") { Remove-Item "src-tauri\target" -Recurse -Force }
  npm run tauri:build
  Pop-Location
  Write-Host ""
  Write-Host "Run: src-tauri\target\release\app.exe"
  Write-Host "Guest page API should show: http://${ZeroTierIp}:8080/api"
}
