$files = @(
    "src/components/profile/BadgeCollection.tsx",
    "src/components/profile/ExpCard.tsx"
)

foreach ($file in $files) {
    $content = Get-Content -Path $file -Raw
    
    # Replace ../lib/forum with ../../lib/forum
    $content = $content -replace '../lib/forum', '../../lib/forum'
    
    # Replace ../lib/reputation with ../../lib/reputation
    $content = $content -replace '../lib/reputation', '../../lib/reputation'
    
    # Write the updated content back to the file
    Set-Content -Path $file -Value $content
    
    Write-Host "Fixed imports in $file"
}

Write-Host "Fixed profile component import paths."
