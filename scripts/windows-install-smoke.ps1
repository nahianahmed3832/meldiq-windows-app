param([string]$InstallerPath, [string]$SourceCommit = $env:GITHUB_SHA, [switch]$RequirePrivateUpdates)
$ErrorActionPreference = 'Stop'
$installer = if ($InstallerPath) { Get-Item -LiteralPath $InstallerPath } else { Get-ChildItem release -Filter '*UNSIGNED-DEV.exe' | Select-Object -First 1 }
if (-not $installer) { throw 'Development installer is missing' }
$destination = Join-Path $env:RUNNER_TEMP 'Meldiq-install-smoke'
$installedExecutable = Join-Path $destination 'Meldiq.exe'
$install = Start-Process -FilePath $installer.FullName -ArgumentList @('/S', "/D=$destination") -Wait -PassThru
if ($install.ExitCode -ne 0 -or -not (Test-Path $installedExecutable)) { throw 'Silent installation failed' }
$launched = $null
try {
  $launched = Start-Process -FilePath $installedExecutable -PassThru
  $deadline = (Get-Date).AddSeconds(45)
  do {
    Start-Sleep -Milliseconds 500
    $launched.Refresh()
    if ($launched.HasExited) { throw 'Installed application exited before opening its window' }
  } until ($launched.MainWindowHandle -ne 0 -or (Get-Date) -ge $deadline)
  if ($launched.MainWindowHandle -eq 0) { throw 'Installed application did not open its native window' }
  if ($RequirePrivateUpdates) {
    node scripts/inspect-private-installed.mjs (Join-Path $destination 'resources/app.asar')
    if ($LASTEXITCODE -ne 0) { throw 'Installed private updater configuration is invalid' }
  }
} finally {
  # Only the disposable installed test process is stopped; this is an ephemeral Windows CI runner.
  if ($launched -and -not $launched.HasExited) { Stop-Process -Id $launched.Id -Force }
}
$uninstaller = Join-Path $destination 'Uninstall Meldiq.exe'
if (-not (Test-Path $uninstaller)) { throw 'Uninstaller is missing' }
$uninstall = Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait -PassThru
if ($uninstall.ExitCode -ne 0) { throw 'Silent uninstall failed' }
$deadline = (Get-Date).AddSeconds(30)
while ((Test-Path $installedExecutable) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 500 }
if (Test-Path $installedExecutable) { throw 'Uninstall left the application executable behind' }
$report = @{
  sourceCommit = $SourceCommit
  platform = 'Windows CI virtual machine'
  osVersion = [Environment]::OSVersion.VersionString
  installer = $installer.Name
  installerBytes = $installer.Length
  signature = 'Unsigned Windows installer; publisher certificate is not configured'
  passed = @('actual silent NSIS installation', 'installed native application window launch', 'actual silent uninstall')
  pending = @('versioned upgrade', 'signed update', 'physical hardware benchmarks', 'complete authenticated Windows feature acceptance')
}
New-Item -ItemType Directory -Force test-results | Out-Null
$report | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 test-results/windows-install.json
$report | ConvertTo-Json -Depth 5
