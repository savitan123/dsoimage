# backup_site.ps1
# Creates a compressed zip archive of the entire site directory, ignoring .git to save space.

$sourcePath = "C:\Users\Savit\Documents\dsoimage-site"
$parentPath = "C:\Users\Savit\Documents"
$timestamp = Get-Date -Format "yyyy_MM_dd_HHmmss"
$zipName = "dsoimage_backup_$timestamp.zip"
$destinationZip = Join-Path -Path $parentPath -ChildPath $zipName

Write-Host "Creating backup of $sourcePath ..."
Write-Host "Destination: $destinationZip"

# Remove any old temp folder if it exists
$tempPath = Join-Path -Path $parentPath -ChildPath "dsoimage_backup_temp"
if (Test-Path $tempPath) {
    Remove-Item -Path $tempPath -Recurse -Force
}

# Create a temporary folder to hold the files we want to zip
New-Item -ItemType Directory -Path $tempPath | Out-Null

# Copy everything EXCEPT the .git folder to the temp location
Get-ChildItem -Path $sourcePath -Exclude ".git" | Copy-Item -Destination $tempPath -Recurse -Force

# Compress the temporary folder into the final zip file
Compress-Archive -Path "$tempPath\*" -DestinationPath $destinationZip -Force

# Clean up the temporary folder
Remove-Item -Path $tempPath -Recurse -Force

Write-Host "Backup completed successfully!"
Write-Host "File saved to: $destinationZip"
