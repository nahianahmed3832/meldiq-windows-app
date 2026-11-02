param([string]$Directory = 'release', [string]$Publisher = $env:MELDIQ_SIGNING_PUBLISHER)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/windows-signature-policy.ps1"
if ([string]::IsNullOrWhiteSpace($Publisher)) { throw 'Missing approved signing publisher' }
$files = @(Get-ChildItem -LiteralPath $Directory -Recurse -Filter *.exe)
if ($files.Count -eq 0) { throw 'No release executables to verify' }
foreach ($file in $files) {
    if (-not (Test-MeldiqSignature (Get-AuthenticodeSignature -LiteralPath $file.FullName) $Publisher)) { throw "Invalid Authenticode signature or unexpected publisher: $($file.Name)" }
}
Write-Output "Verified exact approved publisher and valid Authenticode on $($files.Count) executables."
