$files = Get-ChildItem -Path sensasiwangi\src -Recurse -Include *.tsx,*.ts

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $relativePath = $file.FullName.Replace("$PWD\sensasiwangi\src\", "")
    $depth = ($relativePath.Split("\") | Measure-Object).Count
    $prefix = "../" * ($depth - 1)

    if ($content -match "@/components|@/lib|@/types") {
        Write-Host "Fixing imports in $relativePath"

        # Replace @/components with relative paths
        $content = $content -replace '@/components/ui', "$($prefix)components/ui"
        $content = $content -replace '@/components/forum', "$($prefix)components/forum"
        $content = $content -replace '@/components/messages', "$($prefix)components/messages"
        $content = $content -replace '@/components/profile', "$($prefix)components/profile"
        $content = $content -replace '@/components/layout', "$($prefix)components/layout"
        $content = $content -replace '@/components/admin', "$($prefix)components/admin"
        $content = $content -replace '@/components/marketplace', "$($prefix)components/marketplace"
        $content = $content -replace '@/components/auth', "$($prefix)components/auth"
        $content = $content -replace '@/components/dashboard', "$($prefix)components/dashboard"
        $content = $content -replace '@/components/settings', "$($prefix)components/settings"

        # Replace @/lib with relative paths
        $content = $content -replace '@/lib', "$($prefix)lib"

        # Replace @/types with relative paths
        $content = $content -replace '@/types', "$($prefix)types"

        # Write the updated content back to the file
        Set-Content -Path $file.FullName -Value $content
    }
}

Write-Host "Import paths fixed in all files."
