Write-Host "Starting build process..."

# Build Free Version
Write-Host "Building Free version..."
New-Item -ItemType Directory -Force -Path ".\build\free" | Out-Null
Copy-Item -Path ".\src\core\*" -Destination ".\build\free\" -Recurse -Force
if (Test-Path ".\src\free\*") {
    Copy-Item -Path ".\src\free\*" -Destination ".\build\free\" -Recurse -Force
}

# Build Pro Version
Write-Host "Building Pro version..."
New-Item -ItemType Directory -Force -Path ".\build\pro" | Out-Null
Copy-Item -Path ".\src\core\*" -Destination ".\build\pro\" -Recurse -Force
if (Test-Path ".\src\pro\*") {
    Copy-Item -Path ".\src\pro\*" -Destination ".\build\pro\" -Recurse -Force
}

Write-Host "Build complete! Extensions are in .\build\free and .\build\pro"
