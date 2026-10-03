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
    Compress-Archive -Path "$publicSource\*" -DestinationPath $publicZip
    Write-Host "Public ZIP created at $publicZip"
} else {
    Write-Warning "Public build folder not found: $publicSource"
}

if (Test-Path $proSource) {
    Compress-Archive -Path "$proSource\*" -DestinationPath $proZip
    Write-Host "Pro ZIP created at $proZip"
} else {
    Write-Warning "Pro build folder not found: $proSource"
}

Write-Host "Build complete! Extensions and ZIPs are in .\build"
