param([string]$InstallerPath, [string]$SourceCommit = $env:GITHUB_SHA, [switch]$RequirePrivateUpdates)
$ErrorActionPreference = 'Stop'
$installer = if ($InstallerPath) { Get-Item -LiteralPath $InstallerPath } else { Get-ChildItem release -Filter '*UNSIGNED-DEV.exe' | Select-Object -First 1 }
if (-not $installer) { throw 'Development installer is missing' }
$destination = Join-Path $env:RUNNER_TEMP 'Meldiq-install-smoke'
$installedExecutable = Join-Path $destination 'Meldiq.exe'
$install = Start-Process -FilePath $installer.FullName -ArgumentList @('/S', "/D=$destination") -Wait -PassThru
if ($install.ExitCode -ne 0 -or -not (Test-Path $installedExecutable)) { throw 'Silent installation failed' }
# Inspect the installed executable, not merely the source builder settings.
$branding = & "$PSScriptRoot/windows-branding-check.ps1" -Executable $installedExecutable
$protocolKey = Get-Item 'HKCU:\Software\Classes\meldiq\shell\open\command' -ErrorAction Stop
$protocolCommand = $protocolKey.GetValue('')
if (-not $protocolCommand.Contains('"' + $installedExecutable + '"') -or -not $protocolCommand.Contains('"%1"')) { throw 'Protocol command does not quote the installed executable and callback argument' }
$shortcutRoot = [Environment]::GetFolderPath('Programs')
$shortcut = Get-ChildItem -LiteralPath $shortcutRoot -Filter 'Meldiq.lnk' -Recurse | Select-Object -First 1
if (-not $shortcut) { throw 'Meldiq Start Menu shortcut is missing' }
$link = (New-Object -ComObject WScript.Shell).CreateShortcut($shortcut.FullName)
if ($link.TargetPath -cne $installedExecutable) { throw 'Start Menu shortcut points to the wrong executable' }
$manifestTool = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\mt.exe" -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
if (-not $manifestTool) { throw 'Windows SDK manifest inspection tool is required' }
$manifestFile = Join-Path $env:RUNNER_TEMP 'Meldiq-installed-manifest.xml'
& $manifestTool.FullName "-inputresource:$installedExecutable;#1" "-out:$manifestFile"
if ($LASTEXITCODE -ne 0 -or (Get-Content -Raw $manifestFile) -notmatch 'requestedExecutionLevel[^>]+level=["'']asInvoker["'']') { throw 'Installed executable must request asInvoker privileges' }
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
  # Dispatch through the actual registered Windows URI association, not an in-process synthetic event.
  Start-Process 'meldiq://settings/about'
  Start-Sleep -Seconds 3
  $launched.Refresh()
  if ($launched.HasExited -or $launched.MainWindowHandle -eq 0) { throw 'Protocol dispatch did not retain the running application window' }
  $visibleMainWindows = @(Get-Process -Name Meldiq -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 })
  if ($visibleMainWindows.Count -ne 1 -or $visibleMainWindows[0].Id -ne $launched.Id) { throw 'Protocol dispatch created duplicate main windows' }
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
$remainingHandler = Get-Item 'HKCU:\Software\Classes\meldiq\shell\open\command' -ErrorAction SilentlyContinue
if ($remainingHandler -and $remainingHandler.GetValue('').Contains($installedExecutable)) { throw 'Uninstall left a dangling owned protocol registration' }
$report = @{
  sourceCommit = $SourceCommit
  platform = 'Windows CI virtual machine'
  osVersion = [Environment]::OSVersion.VersionString
  installer = $installer.Name
  installerBytes = $installer.Length
  signature = 'Unsigned Windows installer; publisher certificate is not configured'
  branding = $branding
  protocolCommandVerified = $true
  startMenuShortcutVerified = $true
  executionLevel = 'asInvoker'
  passed = @('actual silent NSIS installation', 'installed native application window launch', 'actual silent uninstall', 'canonical embedded executable icon', 'quoted per-user protocol registration', 'Start Menu shortcut target', 'asInvoker executable manifest', 'actual OS protocol dispatch reuses the running window', 'uninstall removes owned protocol registration')
  pending = @('versioned upgrade', 'signed update', 'physical hardware benchmarks', 'complete authenticated Windows feature acceptance')
}
New-Item -ItemType Directory -Force test-results | Out-Null
$report | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 test-results/windows-install.json
$report | ConvertTo-Json -Depth 5
