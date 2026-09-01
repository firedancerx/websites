# watch-and-build.ps1
#
# Watches the FolioDesk source folders for changes and, after a short quiet period,
# automatically runs a production build (npm run build) and recycles the IIS app pool
# so the live site picks up the change. Run this script and leave it open while you work.
#
# HOW TO USE:
#   1. Set $AppPoolName below to match your IIS Application Pool name exactly
#      (IIS Manager -> Application Pools -> the name listed there).
#   2. Right-click this file -> Run with PowerShell (or run it from an elevated PowerShell
#      window: elevation is required so it can recycle the app pool via appcmd).
#   3. Leave the window open. Edit your source files as normal; saves will trigger a
#      rebuild automatically a few seconds after you stop typing/saving.
#   4. Press Ctrl+C in the window to stop watching.

# ---- Configuration ----
$AppPoolName = "foliodeskPool"       # IIS app pool for the FolioDesk site
$ProjectRoot = $PSScriptRoot         # this script lives in WebsiteBuild, so this is correct
$DebounceSeconds = 5                 # wait this long after the last change before building
$WatchFolders = @("app", "lib", "db", "public", "components")  # add/remove as needed

# ---- Setup ----
$AppCmd = "$env:windir\System32\inetsrv\appcmd.exe"
if (-not (Test-Path $AppCmd)) {
    Write-Host "WARNING: appcmd.exe not found at $AppCmd. App pool recycle step will be skipped." -ForegroundColor Yellow
    Write-Host "You may need to run this from a machine with IIS Management Tools installed." -ForegroundColor Yellow
}

$lastChange = Get-Date
$buildPending = $false
$building = $false

function Start-BuildAndRecycle {
    Write-Host ""
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Change detected. Building..." -ForegroundColor Cyan

    Push-Location $ProjectRoot
    try {
        & npm run build
        $buildExitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }

    if ($buildExitCode -ne 0) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Build FAILED (exit code $buildExitCode). Site was not restarted." -ForegroundColor Red
        return
    }

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Build succeeded." -ForegroundColor Green

    if ($AppPoolName -eq "CHANGE_ME") {
        Write-Host "NOTE: `$AppPoolName is still set to CHANGE_ME in this script -- skipping app pool recycle." -ForegroundColor Yellow
        Write-Host "Edit watch-and-build.ps1 and set it to your real IIS app pool name to enable auto-restart." -ForegroundColor Yellow
        return
    }

    if (Test-Path $AppCmd) {
        & $AppCmd recycle apppool /apppool.name:$AppPoolName
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] App pool '$AppPoolName' recycled. Site is live." -ForegroundColor Green
        } else {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Failed to recycle app pool '$AppPoolName'. Check the name and that this window has admin rights." -ForegroundColor Red
        }
    }
}

# ---- File watcher ----
$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path = $ProjectRoot
$fsw.IncludeSubdirectories = $true
$fsw.EnableRaisingEvents = $true
$fsw.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::DirectoryName

$excludePatterns = @("\\.next\\", "\\node_modules\\", "\\logs\\", "\\.git\\")

$onChange = {
    $path = $Event.SourceEventArgs.FullPath
    foreach ($pattern in $using:excludePatterns) {
        if ($path -match $pattern) { return }
    }
    $global:lastChange = Get-Date
    $global:buildPending = $true
}

Register-ObjectEvent $fsw "Changed" -Action $onChange | Out-Null
Register-ObjectEvent $fsw "Created" -Action $onChange | Out-Null
Register-ObjectEvent $fsw "Deleted" -Action $onChange | Out-Null
Register-ObjectEvent $fsw "Renamed" -Action $onChange | Out-Null

Write-Host "Watching $ProjectRoot for changes (debounce: ${DebounceSeconds}s). Press Ctrl+C to stop." -ForegroundColor Cyan
if ($AppPoolName -eq "CHANGE_ME") {
    Write-Host "NOTE: Set `$AppPoolName at the top of this script to enable automatic app pool recycling." -ForegroundColor Yellow
}

# ---- Main loop ----
try {
    while ($true) {
        Start-Sleep -Seconds 1
        if ($buildPending -and -not $building) {
            $secondsSinceChange = (Get-Date) - $lastChange
            if ($secondsSinceChange.TotalSeconds -ge $DebounceSeconds) {
                $building = $true
                $buildPending = $false
                Start-BuildAndRecycle
                $building = $false
            }
        }
    }
} finally {
    Get-EventSubscriber | Unregister-Event
    $fsw.Dispose()
    Write-Host "Stopped watching." -ForegroundColor Cyan
}
