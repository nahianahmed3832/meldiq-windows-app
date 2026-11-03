param([Parameter(Mandatory=$true)][string]$Executable, [string]$CanonicalIcon = 'desktop/resources/icon.ico')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$version = [Diagnostics.FileVersionInfo]::GetVersionInfo((Resolve-Path $Executable).Path)
if ($version.ProductName -cne 'Meldiq') { throw 'Executable product resources are missing Meldiq branding' }
$expected = [System.Drawing.Icon]::new((Resolve-Path $CanonicalIcon).Path, 32, 32)
$actual = [System.Drawing.Icon]::ExtractAssociatedIcon((Resolve-Path $Executable).Path)
if ($null -eq $actual) { throw 'Executable has no extractable icon' }
$a = $actual.ToBitmap(); $b = $expected.ToBitmap()
try {
  if ($a.Width -ne $b.Width -or $a.Height -ne $b.Height) { throw "Extracted icon dimensions differ: $($a.Width)x$($a.Height), expected $($b.Width)x$($b.Height)" }
  $matched = 0
  for ($x=0; $x -lt $a.Width; $x++) { for ($y=0; $y -lt $a.Height; $y++) { if ($a.GetPixel($x,$y).ToArgb() -eq $b.GetPixel($x,$y).ToArgb()) { $matched++ } } }
  if ($matched -ne $a.Width*$a.Height) { throw "Executable icon pixels differ from the canonical Meldiq ICO ($matched matching pixels)" }
} finally { $a.Dispose(); $b.Dispose(); $actual.Dispose(); $expected.Dispose() }
[pscustomobject]@{ executable = (Split-Path $Executable -Leaf); productName = $version.ProductName; fileDescription = $version.FileDescription; version = $version.ProductVersion; canonicalIconPixels = $true }
