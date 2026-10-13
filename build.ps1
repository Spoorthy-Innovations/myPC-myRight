Write-Host "Starting build process..."

# Build Public Version
Write-Host "Building Public version..."
New-Item -ItemType Directory -Force -Path ".\build\public" | Out-Null
Copy-Item -Path ".\src\core\*" -Destination ".\build\public\" -Recurse -Force
if (Test-Path ".\src\public\*") {
    Copy-Item -Path ".\src\public\*" -Destination ".\build\public\" -Recurse -Force
}

# Build Pro Version
Write-Host "Building Pro version..."
New-Item -ItemType Directory -Force -Path ".\build\pro" | Out-Null
Copy-Item -Path ".\src\core\*" -Destination ".\build\pro\" -Recurse -Force
if (Test-Path ".\src\pro\*") {
    Copy-Item -Path ".\src\pro\*" -Destination ".\build\pro\" -Recurse -Force
}

Write-Host "Creating ZIP packages..."

# Compress-Archive on Windows PowerShell 5.1 writes "icons\icon16.png" entry names; the Chrome
# Web Store needs forward slashes or manifest paths like "icons/icon16.png" won't resolve.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
function New-ExtensionZip($sourceDir, $zipPath) {
    $root = (Resolve-Path $sourceDir).Path.TrimEnd('\')
    $zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Get-ChildItem -Path $root -Recurse -File | ForEach-Object {
            $entryName = $_.FullName.Substring($root.Length + 1).Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    } finally {
        $zip.Dispose()
    }
}

$version = (Get-Content -Raw package.json | ConvertFrom-Json).version
$publicSource = ".\build\public"
$publicZip    = ".\build\myPC-myRight-public-$version.zip"
$proSource    = ".\build\pro"
$proZip       = ".\build\myPC-myRight-pro-$version.zip"

if (Test-Path $publicZip) {
    Remove-Item $publicZip -Force
}
if (Test-Path $proZip) {
    Remove-Item $proZip -Force
}

if (Test-Path $publicSource) {
    New-ExtensionZip $publicSource (Join-Path (Get-Location) $publicZip)
    Write-Host "Public ZIP created at $publicZip"
} else {
    Write-Warning "Public build folder not found: $publicSource"
}

if (Test-Path $proSource) {
    New-ExtensionZip $proSource (Join-Path (Get-Location) $proZip)
    Write-Host "Pro ZIP created at $proZip"
} else {
    Write-Warning "Pro build folder not found: $proSource"
}

Write-Host "Build complete! Extensions and ZIPs are in .\build"
