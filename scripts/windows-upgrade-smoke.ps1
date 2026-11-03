param([Parameter(Mandatory=$true)][string]$CandidateDirectory, [string]$CandidateInstaller)
$ErrorActionPreference = 'Stop'
if ($env:CI -ne 'true') { throw 'Run this destructive installation harness only on a disposable CI runner, never a user laptop' }
$baseline = Get-Content -Raw docs/desktop/evidence/private-update-0.2.1/publication.json | ConvertFrom-Json
$baselineFile = Join-Path $env:RUNNER_TEMP 'Meldiq-Setup-0.2.1-baseline.exe'
Invoke-WebRequest -Uri $baseline.download -OutFile $baselineFile
if ((Get-FileHash -Algorithm SHA256 $baselineFile).Hash.ToLowerInvariant() -cne $baseline.sha256 -or (Get-Item $baselineFile).Length -ne $baseline.bytes) { throw 'Published baseline integrity mismatch' }
$candidate = if ($CandidateInstaller) { Get-Item -LiteralPath $CandidateInstaller } else { Get-ChildItem -LiteralPath (Join-Path $CandidateDirectory 'release') -Filter '*UNSIGNED-DEV.exe' | Select-Object -First 1 }
if (-not $candidate) { throw 'Installer is missing from the qualified candidate artifact' }
if ($candidate.Directory.FullName -cne (Resolve-Path (Join-Path $CandidateDirectory 'release')).Path) { throw 'Candidate installer must be inside its qualified release directory' }
$checksumFile = Join-Path $CandidateDirectory 'release/checksums.sha256'
$checksum = Get-Content $checksumFile | Where-Object { $_.EndsWith($candidate.Name) } | Select-Object -First 1
if (-not $checksum -or -not $checksum.StartsWith((Get-FileHash -Algorithm SHA256 $candidate.FullName).Hash.ToLowerInvariant())) { throw 'Candidate artifact checksum mismatch' }
$destination = Join-Path $env:RUNNER_TEMP 'Meldiq-upgrade-smoke'
$exe = Join-Path $destination 'Meldiq.exe'
$fixture = Join-Path $env:APPDATA 'Meldiq/qa-upgrade-retention.txt'
$fixtureValue = [Guid]::NewGuid().ToString()
function Install-Meldiq([string]$Installer) {
  $result = Start-Process -FilePath $Installer -ArgumentList @('/S', "/D=$destination") -Wait -PassThru
  if ($result.ExitCode -ne 0 -or -not (Test-Path $exe)) { throw 'Installation failed in upgrade harness' }
}
function Stop-OwnedMeldiq {
  # Kill only this disposable installation's processes, including Electron child processes.
  Get-CimInstance Win32_Process -Filter "Name = 'Meldiq.exe'" | Where-Object { $_.ExecutablePath -eq $exe } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 1
}
function Launch-Meldiq {
  $process = Start-Process $exe -PassThru
  $deadline = (Get-Date).AddSeconds(45)
  do { Start-Sleep -Milliseconds 250; $process.Refresh() } until ($process.HasExited -or $process.MainWindowHandle -ne 0 -or (Get-Date) -ge $deadline)
  if ($process.HasExited -or $process.MainWindowHandle -eq 0) { throw 'Installed application failed to open after upgrade/reinstall' }
  return $process
}
function Check-InstalledMeldiq {
  $branding = & "$PSScriptRoot/windows-branding-check.ps1" -Executable $exe
  $command = (Get-Item 'HKCU:\Software\Classes\meldiq\shell\open\command').GetValue('')
  if (-not $command.Contains('"' + $exe + '"') -or -not $command.Contains('"%1"')) { throw 'Upgrade protocol association is stale or unquoted' }
  $linkFile = Get-ChildItem -LiteralPath ([Environment]::GetFolderPath('Programs')) -Filter 'Meldiq.lnk' -Recurse | Select-Object -First 1
  if (-not $linkFile) { throw 'Start Menu shortcut missing after upgrade/reinstall' }
  $link = (New-Object -ComObject WScript.Shell).CreateShortcut($linkFile.FullName)
  if ($link.TargetPath -cne $exe) { throw 'Shortcut points to an obsolete executable' }
  $shell = New-Object -ComObject Shell.Application
  $item = $shell.NameSpace($linkFile.DirectoryName).ParseName($linkFile.Name)
  $aumid = $item.ExtendedProperty('System.AppUserModel.ID')
  if ($aumid -cne 'app.meldiq.desktop') { throw 'Shortcut AppUserModelID differs from runtime/installer identity' }
  return @{ branding = $branding; shortcutAppUserModelId = $aumid; protocol = 'quoted per-user installed path' }
}
function Uninstall-Meldiq {
  Stop-OwnedMeldiq
  $result = Start-Process -FilePath (Join-Path $destination 'Uninstall Meldiq.exe') -ArgumentList '/S' -Wait -PassThru
  if ($result.ExitCode -ne 0) { throw 'Uninstaller failed' }
  $deadline = (Get-Date).AddSeconds(30)
  while ((Test-Path $exe) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 250 }
  if (Test-Path $exe) { throw 'Uninstaller left the executable' }
}
try {
  Install-Meldiq $baselineFile
  $old = Launch-Meldiq
  New-Item -ItemType Directory -Force (Split-Path $fixture) | Out-Null
  Set-Content -LiteralPath $fixture -Value $fixtureValue -NoNewline
  Stop-OwnedMeldiq
  Install-Meldiq $candidate.FullName
  if ((Get-Content -Raw $fixture) -cne $fixtureValue) { throw 'Upgrade changed the run-owned profile fixture' }
  $afterUpgrade = Check-InstalledMeldiq
  $current = Launch-Meldiq
  Start-Process 'meldiq://settings/about'
  Start-Sleep -Seconds 3
  $current.Refresh()
  if ($current.HasExited) { throw 'Protocol return lost the upgraded running application' }
  Uninstall-Meldiq
  if ((Get-Content -Raw $fixture) -cne $fixtureValue) { throw 'Uninstall deleted profile data' }
  Install-Meldiq $candidate.FullName
  $afterReinstall = Check-InstalledMeldiq
  $reinstalled = Launch-Meldiq
  if ((Get-Content -Raw $fixture) -cne $fixtureValue) { throw 'Reinstall changed profile data' }
  Uninstall-Meldiq
  $report = @{ recordedAt = (Get-Date).ToUniversalTime().ToString('o'); platform = 'Windows Server CI VM'; osVersion = [Environment]::OSVersion.VersionString; baselineVersion = $baseline.version; baselineSha256 = $baseline.sha256; candidate = $candidate.Name; candidateSha256 = (Get-FileHash -Algorithm SHA256 $candidate.FullName).Hash.ToLowerInvariant(); afterUpgrade = $afterUpgrade; afterReinstall = $afterReinstall; passed = @('actual published 0.2.1 baseline installation and launch', 'actual in-place NSIS upgrade', 'canonical executable icon after upgrade', 'quoted protocol registration after upgrade', 'correct Start Menu AppUserModelID and target', 'OS protocol dispatch after upgrade', 'profile fixture retained across upgrade', 'profile fixture retained across uninstall', 'actual reinstall and launch', 'branding and registration after reinstall', 'profile fixture retained across reinstall', 'final uninstall'); limitation = 'A run-owned profile file is not an authenticated session/message fixture; physical Windows 10/11, publisher signing, pinned taskbar icon-cache visuals and real provider acceptance remain pending.' }
  New-Item -ItemType Directory -Force test-results | Out-Null
  $report | ConvertTo-Json -Depth 7 | Set-Content -Encoding utf8 test-results/windows-upgrade.json
  $report | ConvertTo-Json -Depth 7
} finally { Stop-OwnedMeldiq; Remove-Item -LiteralPath $fixture -Force -ErrorAction SilentlyContinue }
