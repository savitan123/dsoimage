---
description: Always push the entire site when deploying
---
# Deploy Site Workflow

Whenever I need to deploy changes, push to GitHub, or save my work, I will ALWAYS stage and push the entire repository to ensure no dependencies, image assets, or linked HTML files are missed.

1. First, check the status to see what has changed (optional but good practice):
   `git status`

2. Stage EVERYTHING in the workspace, including new untracked files:
// turbo-all
   `git add .`

3. Commit the changes with a highly descriptive message:
   `git commit -m "[Detailed description of all changes]"`

4. Push everything to the remote repository:
   `git push`
