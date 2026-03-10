---
description: Create a compressed archive of the entire site and its content
---
# Site Backup Workflow

Whenever the user asks to back up the site (or uses `/backup`), I will execute the following steps to safely compress the entire project directory into a single timestamped ZIP file, excluding `.git` so the archive isn't bloated by version control history.

1. **Run the PowerShell Backup Script**
   Execute the `backup_site.ps1` script to generate the timestamped ZIP file in the parent directory (so it isn't accidentally committed to the site repository).
// turbo
   `powershell -ExecutionPolicy Bypass -File scripts\backup_site.ps1`

2. **Confirm Backup**
   Confirm to the user the exact path where the `.zip` file was saved.
