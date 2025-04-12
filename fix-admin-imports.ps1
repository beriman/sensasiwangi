$files = Get-ChildItem -Path sensasiwangi\src\components\admin -Recurse -Include *.tsx,*.ts

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Replace ../../../types with ../../types
    $content = $content -replace '../../../types', '../../types'
    
    # Replace ../../../lib with ../../lib
    $content = $content -replace '../../../lib', '../../lib'
    
    # Write the updated content back to the file
    Set-Content -Path $file.FullName -Value $content
    
    Write-Host "Fixed imports in $($file.FullName)"
}

Write-Host "Import paths fixed in all admin component files."
