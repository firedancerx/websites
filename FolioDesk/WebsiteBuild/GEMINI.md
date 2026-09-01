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
* **Rule**: Always use the native Node.js executable for running CLI commands and serving the app via IIS. The `processPath` in `web.config` must remain configured to `C:\Program Files\nodejs\node.exe`.
