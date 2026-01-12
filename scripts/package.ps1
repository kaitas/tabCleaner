# Tab Cleanup Packaging Script

$version = (Get-Content ".\tab-cleanup-extension\manifest.json" | ConvertFrom-Json).version
$zipName = "tab-cleanup-v$version.zip"
$sourceDir = ".\tab-cleanup-extension"
$exclude = @("*.map", "*.DS_Store", "Thumbs.db")

Write-Host "Packaging Tab Cleanup v$version..."

if (Test-Path $zipName) {
    Remove-Item $zipName
    Write-Host "Removed old package: $zipName"
}

Compress-Archive -Path "$sourceDir\*" -DestinationPath $zipName -Force

Write-Host "Done! Created $zipName"
