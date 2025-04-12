$filesToCopy = @(
    @{
        Source = "sensasiwangi\src\lib\forum.ts"
        Destination = "src\lib\forum.ts"
    },
    @{
        Source = "sensasiwangi\src\lib\reputation.ts"
        Destination = "src\lib\reputation.ts"
    },
    @{
        Source = "sensasiwangi\src\lib\social.ts"
        Destination = "src\lib\social.ts"
    },
    @{
        Source = "sensasiwangi\src\supabase\supabase.ts"
        Destination = "src\supabase\supabase.ts"
    }
)

foreach ($file in $filesToCopy) {
    # Create the destination directory if it doesn't exist
    $destDir = Split-Path -Path $file.Destination -Parent
    if (-not (Test-Path -Path $destDir)) {
        New-Item -Path $destDir -ItemType Directory -Force | Out-Null
        Write-Host "Created directory: $destDir"
    }
    
    # Copy the file
    Copy-Item -Path $file.Source -Destination $file.Destination -Force
    Write-Host "Copied $($file.Source) to $($file.Destination)"
}

Write-Host "All missing files copied successfully."
