$sourceDir = "sensasiwangi\src\components\ui"
$destDir = "src\components\ui"

# Get all files from the source directory
$files = Get-ChildItem -Path $sourceDir -File

# Copy each file to the destination directory
foreach ($file in $files) {
    Copy-Item -Path $file.FullName -Destination $destDir -Force
    Write-Host "Copied $($file.Name) to $destDir"
}

Write-Host "All UI components copied successfully."
