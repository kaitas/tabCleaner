<#
.SYNOPSIS
    Automates the release process for Tab Cleanup extension.
    Bumps version in manifest.json, background.js (if needed), popup.html, and updates package.json.
    Creates a git commit and tag, then pushes to origin.

.EXAMPLE
    .\scripts\release.ps1 -Type patch
    .\scripts\release.ps1 -Type minor
    .\scripts\release.ps1 -Type major
    .\scripts\release.ps1 -Version 0.5.0
#>

param (
    [string]$Type = "patch",
    [string]$Version = ""
)

$manifestPath = ".\tab-cleanup-extension\manifest.json"
$popupPath = ".\tab-cleanup-extension\popup.html"
$packageJwtPath = ".\backend\package.json" # If exists

# 1. Read current version
$manifest = Get-Content $manifestPath | ConvertFrom-Json
$currentVersion = $manifest.version
Write-Host "Current Version: $currentVersion" -ForegroundColor Cyan

# 2. Calculate new version
if ($Version) {
    $newVersion = $Version
} else {
    $v = [version]$currentVersion
    switch ($Type) {
        "major" { $newVersion = "{0}.0.0" -f ($v.Major + 1) }
        "minor" { $newVersion = "{0}.{1}.0" -f $v.Major, ($v.Minor + 1) }
        "patch" { $newVersion = "{0}.{1}.{2}" -f $v.Major, $v.Minor, ($v.Build + 1) }
        Default { Write-Error "Invalid type. Use patch, minor, or major."; exit 1 }
    }
}
Write-Host "New Version: $newVersion" -ForegroundColor Green

# 3. Update manifest.json
$manifest.version = $newVersion
$manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath
Write-Host "Updated manifest.json"

# 4. Update popup.html (Footer version display)
$popupContent = Get-Content $popupPath
$popupContent = $popupContent -replace "<span>v$currentVersion</span>", "<span>v$newVersion</span>"
$popupContent | Set-Content $popupPath
Write-Host "Updated popup.html"

# 5. Update backend/package.json if exists (Keep synchronized usually good practice)
if (Test-Path $packageJwtPath) {
    $pkg = Get-Content $packageJwtPath | ConvertFrom-Json
    $pkg.version = $newVersion
    $pkg | ConvertTo-Json -Depth 10 | Set-Content $packageJwtPath
    Write-Host "Updated backend/package.json"
}

# 6. Git Operations
Write-Host "Committing and Tagging..." -ForegroundColor Yellow
git add .
git commit -m "chore: release v$newVersion"
git tag "v$newVersion"

Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
git push origin "v$newVersion"

Write-Host "Done! GitHub Action should trigger the release build." -ForegroundColor Green
Write-Host "Check status at: https://github.com/kaitas/tabCleaner/actions"
