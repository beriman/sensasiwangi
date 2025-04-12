$files = Get-ChildItem -Path sensasiwangi\src\components\admin -Recurse -Include *.tsx

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Replace @/components/ui with ../ui
    $content = $content -replace '@/components/ui', '../ui'
    
    # Replace @/lib with ../../../lib
    $content = $content -replace '@/lib', '../../../lib'
    
    # Replace @/types with ../../../types
    $content = $content -replace '@/types', '../../../types'
    
    # Write the updated content back to the file
    Set-Content -Path $file.FullName -Value $content
}

Write-Host "Import paths fixed in all admin component files."
