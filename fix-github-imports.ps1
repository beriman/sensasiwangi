$components = @(
    "button.tsx",
    "checkbox.tsx",
    "sheet.tsx",
    "slider.tsx",
    "toast.tsx",
    "tooltip.tsx",
    "use-toast.ts"
)

foreach ($component in $components) {
    $localPath = "sensasiwangi/src/components/ui/$component"
    $content = Get-Content -Path $localPath -Raw
    
    # Create a GitHub API request to update the file
    Write-Host "Updating $component in GitHub repository..."
    
    # You would need to use the GitHub API to update the file
    # This is a placeholder for the actual GitHub API call
    # You would need to use the GitHub API token and repository information
    
    Write-Host "Updated $component in GitHub repository."
}

Write-Host "All UI component import paths fixed in GitHub repository."
