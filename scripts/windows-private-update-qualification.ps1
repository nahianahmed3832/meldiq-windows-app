param([Parameter(Mandatory=$true)][string]$CandidateRun)
$ErrorActionPreference = 'Stop'
if ($CandidateRun -notmatch '^[1-9][0-9]+$') { throw 'Invalid candidate run ID' }
$working = Join-Path $env:RUNNER_TEMP "Meldiq-update-qualification-$CandidateRun"
New-Item -ItemType Directory -Force $working | Out-Null
$tag = "windows-private-candidate-$CandidateRun"
gh release download $tag --pattern private-candidates.json --dir $working
if ($LASTEXITCODE -ne 0) { throw 'Candidate metadata download failed' }
$metadata = Get-Content (Join-Path $working 'private-candidates.json') -Raw | ConvertFrom-Json
if ($metadata.runId -ne $CandidateRun) { throw 'Candidate run mismatch' }
$old = $metadata.artifacts | Where-Object role -eq 'lab-old'
$new = $metadata.artifacts | Where-Object role -eq 'lab-new'
gh release download $tag --pattern $old.filename --dir $working
if ($LASTEXITCODE -ne 0) { throw 'Qualification installer download failed' }
$installer = Join-Path $working $old.filename
if ((Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash.ToLowerInvariant() -ne $old.sha256) { throw 'Qualification installer hash mismatch' }
$controlDirectory = Join-Path $env:APPDATA 'Meldiq Update Lab'
New-Item -ItemType Directory -Force $controlDirectory | Out-Null
$controlFile = Join-Path $controlDirectory "control-$CandidateRun.json"
$env:MELDIQ_UPDATE_LAB_CONTROL = $controlFile
$results = @()
foreach ($scenario in @('bad-signature', 'bad-hash', 'upgrade')) {
    $destination = Join-Path $working "install-$scenario"
    $report = Join-Path $working "$scenario.json"
    $control = @{
        scenario = $scenario
        profile = (Join-Path $working "profile-$scenario")
        report = $report
        oldVersion = $old.version
        newVersion = $new.version
    }
    $control | ConvertTo-Json | Set-Content -LiteralPath $controlFile -Encoding utf8
    $install = Start-Process -FilePath $installer -ArgumentList @('/S', "/D=$destination") -Wait -PassThru
    if ($install.ExitCode -ne 0) { throw "Qualification installation failed: $scenario" }
    $executable = Join-Path $destination 'Meldiq.exe'
    $process = Start-Process -FilePath $executable -PassThru
    try {
        $deadline = (Get-Date).AddMinutes(6)
        $result = $null
        do {
            Start-Sleep -Milliseconds 500
            if (Test-Path $report) {
                try { $result = Get-Content $report -Raw | ConvertFrom-Json } catch { $result = $null }
                if ($result -and $result.status -eq 'failed') { throw "Native updater rejected qualification: $scenario, state=$($result.updateState), cause=$($result.failureKind)" }
                if ($result -and $result.status -eq 'passed') { break }
            }
        } until ((Get-Date) -ge $deadline)
        if (-not $result -or $result.status -ne 'passed') { throw "Native updater qualification timed out: $scenario" }
        if ($scenario -eq 'upgrade') {
            foreach ($check in @('actualInstallerUpgrade','automaticCheckAndDownload','automaticInstallOnSafeExit','busyGuardPassed','accountRetained','messageRetained','sealedSessionRetained','localStorageRetained')) {
                if ($result.$check -ne $true) { throw "Missing qualification evidence: $check" }
            }
            if ($result.version -ne $new.version) { throw 'Installed target version mismatch' }
        }
        $results += $result
    } finally {
        if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
        # Only this run's isolated lab app is installed at this exact path.
        Get-Process Meldiq -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $executable } | Stop-Process -Force -ErrorAction SilentlyContinue
        $uninstaller = Join-Path $destination 'Uninstall Meldiq Update Lab.exe'
        if (Test-Path $uninstaller) { Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait | Out-Null }
    }
}
New-Item -ItemType Directory -Force test-results | Out-Null
@{ status='passed'; candidateRun=$CandidateRun; sourceCommit=$metadata.sourceCommit; keyId=$metadata.keyId; platform='native Windows CI'; tests=$results } | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 test-results/private-update-qualification.json
Get-Content test-results/private-update-qualification.json -Raw | Write-Output
$public = $metadata.artifacts | Where-Object role -eq 'production'
gh release download $tag --pattern $public.filename --dir $working
if ($LASTEXITCODE -ne 0) { throw 'Public candidate download failed' }
$publicInstaller = Join-Path $working $public.filename
if ((Get-FileHash $publicInstaller -Algorithm SHA256).Hash.ToLowerInvariant() -ne $public.sha256) { throw 'Public installer hash mismatch' }
& "$PSScriptRoot/windows-install-smoke.ps1" -InstallerPath $publicInstaller -SourceCommit $metadata.sourceCommit -RequirePrivateUpdates
