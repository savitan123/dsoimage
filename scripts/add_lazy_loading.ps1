
$files = Get-ChildItem -Path . -Filter "*.html" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    # Regex to find img tags that DO NOT already have loading=...
    # We look for <img ... > where "loading=" is NOT present inside the tag.
    
    # This acts as a smart replace. 
    # It finds <img (stuff that is not >) >
    # And replaces it with <img $1 loading="lazy">
    
    # Simple approach: Replace <img with <img loading="lazy" if it doesn't exist? 
    # No, attributes order doesn't matter. 
    # Let's just find tags missing it.
    
    $newContent = $content -replace '(<img\s+)(?![^>]*\bloading=)([^>]+>)', '$1$2' 
    # Wait, the regex above doesn't insert it.
    
    # Proper Replace:
    # Find: <img (attrs)>
    # Replace: <img loading="lazy" (attrs)>
    # Condition: (attrs) does not contain "loading="
    
    # PowerShell supports .NET Regex.
    $newContent = [Regex]::Replace($content, '<img\s+(?![^>]*\bloading=)([^>]+)>', '<img loading="lazy" $1>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    
    if ($content -ne $newContent) {
        Write-Host "Updating $($file.Name)"
        $newContent | Set-Content $file.FullName -Encoding UTF8
    }
}
Write-Host "Lazy loading check complete."
