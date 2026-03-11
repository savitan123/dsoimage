---
description: Critical AI Agent Tool Usage Instructions
---

# Critical Agent Instructions Workflow

This workflow serves as a persistent reminder of the core rules for tool usage by the AI agent to prevent repeating past mistakes. These rules govern how the agent interacts with the file system and executes commands.

## 1. Tool Precedence and Restrictions

The core principle is to **always prioritize specific built-in tools** over generic terminal commands (bash/powershell).

*   **File Viewing:** DO NOT use terminal commands like `cat`, `less`, or `Get-Content` to view files. ALWAYS use the `view_file` tool.
*   **Directory Listing:** DO NOT use terminal commands like `ls`, `dir`, or `Get-ChildItem` for listing. ALWAYS use `list_dir` or `find_by_name`.
*   **Searching:** ALWAYS use the `grep_search` tool instead of running `grep` or `Select-String` inside a bash/powershell command, unless absolutely necessary for complex piping.
*   **File Creation & Modification:**
    *   **NEVER** use `cat` (or echo) inside a bash/powershell command to create a new file or append to an existing file.
    *   DO NOT use `sed` or Powershell `-replace` via terminal for replacing text.
    *   ALWAYS use dedicated editing tools: `write_to_file`, `replace_file_content`, or `multi_replace_file_content`.

## 2. Mandatory Thought Process

Before making any tool calls, the agent must explicitly:
1. Think about and list out all relevant tools for the task.
2. Verify that no specific tool is being bypassed in favor of a generic terminal command. 
3. Only execute a generic tool (run_command) if all specific tools are inapplicable or have been exhausted.

## 3. Terminal Safety (Windows/Powershell)

When a terminal command *must* be used (e.g., for `git` operations or running build scripts):
*   **Command Chaining:** Remember that in Windows PowerShell, `&&` is not a valid statement separator. Run commands individually or use `;` if applicable for the PowerShell version.
*   **Verification:** Ensure no side effects are executing silently without user awareness. 

---
*Following this workflow guarantees clean tool usage, prevents terminal parsing errors, and ensures maximum context retention for the active workspace.*
