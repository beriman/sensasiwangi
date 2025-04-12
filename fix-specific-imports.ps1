$files = @(
    "src/components/forum/ForumThreadList.tsx",
    "src/components/gamification/ShareAchievement.tsx",
    "src/components/layout/MainNavbar.tsx"
)

foreach ($file in $files) {
    $content = Get-Content -Path $file -Raw
    
    # Replace @/components/ui/avatar with ../../components/ui/avatar
    $content = $content -replace '@/components/ui/avatar', '../../components/ui/avatar'
    
    # Replace @/components/ui/select with ../../components/ui/select
    $content = $content -replace '@/components/ui/select', '../../components/ui/select'
    
    # Replace @/components/ui/dropdown-menu with ../../components/ui/dropdown-menu
    $content = $content -replace '@/components/ui/dropdown-menu', '../../components/ui/dropdown-menu'
    
    # Write the updated content back to the file
    Set-Content -Path $file -Value $content
    
    Write-Host "Fixed imports in $file"
}

Write-Host "Fixed specific import paths."
