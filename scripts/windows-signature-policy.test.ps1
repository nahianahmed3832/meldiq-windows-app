$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/windows-signature-policy.ps1"
function New-TestSignature([string]$Name, [string]$Status = 'Valid', [string]$Type = 'Authenticode') {
    $cert = [pscustomobject]@{ TestName = $Name; Subject = "CN=$Name, O=QA" }
    $cert | Add-Member -MemberType ScriptMethod -Name GetNameInfo -Value { param($type, $issuer) return $this.TestName }
    return [pscustomobject]@{ Status = $Status; SignatureType = $Type; SignerCertificate = $cert }
}
$expected = 'Expected Publisher'
if (-not (Test-MeldiqSignature (New-TestSignature $expected) $expected)) { throw 'Expected signer rejected' }
$mismatched = New-TestSignature 'Expected Publisher Extra'
# Reproduce the former release workflow flaw: substring matching accepts a different signer.
if ($mismatched.SignerCertificate.Subject -notlike "*CN=$expected*") { throw 'Legacy substring mismatch reproduction failed' }
foreach ($sig in @($mismatched, (New-TestSignature 'expected publisher'), (New-TestSignature 'Other Publisher'), (New-TestSignature $expected 'NotSigned'), (New-TestSignature $expected 'UnknownError'), (New-TestSignature $expected 'Valid' 'Catalog'), $null)) {
    if (Test-MeldiqSignature $sig $expected) { throw 'Invalid or mismatched signer accepted' }
}
if (Test-MeldiqSignature (New-TestSignature $expected) '') { throw 'Empty publisher accepted' }
Write-Output 'Signature policy passed: exact publisher, Authenticode only, fail closed; former substring flaw reproduced.'
