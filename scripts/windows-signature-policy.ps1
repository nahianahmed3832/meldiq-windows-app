function Test-MeldiqSignature {
    param($Signature, [string]$Publisher)
    if ([string]::IsNullOrWhiteSpace($Publisher) -or $null -eq $Signature -or $null -eq $Signature.SignerCertificate) { return $false }
    if ($Signature.Status.ToString() -cne 'Valid' -or $Signature.SignatureType.ToString() -cne 'Authenticode') { return $false }
    $actual = $Signature.SignerCertificate.GetNameInfo([System.Security.Cryptography.X509Certificates.X509NameType]::SimpleName, $false)
    return [string]::Equals($actual, $Publisher, [System.StringComparison]::Ordinal)
}
