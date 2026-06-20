# Clears WebView2 cache that can keep stale API URL in Tauri guest app.
$ErrorActionPreference = "SilentlyContinue"
Get-Process -Name "app" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

$paths = @(
  "$env:LOCALAPPDATA\com.rip.interplanetary.flights.guest",
  "$env:LOCALAPPDATA\com.rip.interplanetary.flights.guest.v2"
)

foreach ($p in $paths) {
  if (Test-Path $p) {
    Remove-Item $p -Recurse -Force
    Write-Host "Removed: $p"
  }
}

Write-Host "Tauri WebView cache cleared. Run src-tauri\target\release\app.exe"
