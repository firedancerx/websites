# Workspace Environment & Hosting Rules

## 1. Active Folder Rules
* **Active Project Directory**: `D:\Websites\FolioDesk\WebsiteBuild` (this folder).
* **Rule**: This is the ONLY active development and production folder. All development work, file edits, package installations, and production builds (`next build`) must be executed directly in this folder.
* **Ignore Directory**: The folder `D:\Firedancerx\OneDrive\Work2026\Mujib\Site\WebsiteBuild` is a dormant old copy. **DO NOT write code to, read from, or execute commands inside it.**

## 2. Reference & Documentation Directory
* **Reference Directory**: `D:\Firedancerx\OneDrive\Work2026\Mujib\Work`
* **Rule**: This directory contains marketing strategies, campaigns, and systems documentation. Use this folder solely for reference materials.

## 3. Natively Installed Node.js
* The system has a native installation of Node.js at **`C:\Program Files\nodejs\node.exe`** (available globally on PATH).
## 4. Mandatory Interactive Verification Protocol
* **Rule**: NEVER report a task, fix, or script as working without executing full end-to-end interactive runtime tests.
* **Testing Requirements**: Tests must input real data, submit forms, stream API responses, and extract/verify generated file contents (such as rendering PDF page images to confirm non-blank output) before reporting completion.

## 5. Background Process & Task Cleanup
* **Rule**: NEVER leave orphaned background tasks, background servers, timers, or processes running after tests or tasks complete. Always inspect and terminate all spawned tasks using `manage_task` before finishing a turn.

## 6. Standard FolioDesk Backup Procedure
* **Rule**: Whenever the user asks for a FolioDesk backup, execute these exact steps:
  1. **MySQL Database Backup**:
     - Dump MySQL DB `foliodesk` using `C:\Program Files\MySQL\MySQL Server 8.1\bin\mysqldump.exe -u root -proot --routines --triggers foliodesk`.
     - Save to `D:\Websites\FolioDesk\Backups\foliodesk_db_backup_<YYYYMMDD>.sql`.
     - Copy to `D:\Websites\FolioDesk\Backups\foliodesk_latest_dump.sql`.
  2. **Website Zip Backup**:
     - Compress `D:\Websites\FolioDesk` using `C:\Program Files\7-Zip\7z.exe a "D:\Websites\Backups\FolioDesk_Backup_<YYYYMMDD_HHmmss>.zip" "D:\Websites\FolioDesk" "-ssw" "-xr!node_modules" "-xr!.next" "-xr!.pnpm-store" "-xr!logs"`.
     - Save zip to `D:\Websites\Backups`.
  3. **Verification**:
     - Verify non-empty SQL dump header lines and test zip integrity using `7z t`.

