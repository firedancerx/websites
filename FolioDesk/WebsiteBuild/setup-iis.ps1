# Requires -RunAsAdministrator

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   FolioDesk IIS Setup & Configuration        " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Administrator check
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Please run this script as Administrator."
    Exit 1
}

# 2. Check IIS installation
$w3svc = Get-Service w3svc -ErrorAction SilentlyContinue
if ($null -eq $w3svc) {
    Write-Error "IIS (World Wide Web Publishing Service) is not installed. Please enable IIS features first."
    Exit 1
}

# 3. Check HttpPlatformHandler
$httpPlatformPath = "$env:SystemRoot\System32\inetsrv\httpPlatformHandler.dll"
if (-not (Test-Path $httpPlatformPath)) {
    Write-Warning "HttpPlatformHandler is not installed in IIS."
    Write-Host "Please download and install HttpPlatformHandler v1.2 from Microsoft:" -ForegroundColor Yellow
    Write-Host "https://www.iis.net/downloads/microsoft/httpplatformhandler" -ForegroundColor Yellow
    Write-Host "Once installed, rerun this script." -ForegroundColor Yellow
    Exit 1
}

# 4. Find Node.exe path
$currentDir = Get-Location
$nodePath = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if ($null -eq $nodePath -or -not (Test-Path $nodePath)) {
    $nodePath = "C:\Program Files\nodejs\node.exe"
}
# Fallback 1: check local pnpm distribution in the project node_modules
if (-not (Test-Path $nodePath)) {
    $nodePath = Join-Path $currentDir "node_modules\pnpm\dist\node.exe"
}
# Fallback 2: check Antigravity cache runtime
if (-not (Test-Path $nodePath)) {
    $nodePath = "C:\Users\omnitech\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
}
# Fallback 3: check Antigravity system-wide roaming
if (-not (Test-Path $nodePath)) {
    $nodePath = "C:\Users\omnitech\AppData\Roaming\Antigravity\bin\node.exe"
}

if (-not (Test-Path $nodePath)) {
    Write-Error "Could not find node.exe. Please install Node.js and ensure it is in the PATH."
    Exit 1
}
Write-Host "Found Node.exe at: $nodePath" -ForegroundColor Green

# 5. Create logs directory & set permissions
$currentDir = Get-Location
$logsDir = Join-Path $currentDir "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
    Write-Host "Created logs directory." -ForegroundColor Green
}

# Grant IIS AppPool permissions to logs and the directory
# Standard IIS group IIS_IUSRS needs read/write permissions
Write-Host "Setting folder permissions for IIS_IUSRS..." -ForegroundColor Cyan
$acl = Get-Acl $currentDir
$permission = "BUILTIN\IIS_IUSRS","Modify","ContainerInherit,ObjectInherit","None","Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl $currentDir $acl

# 6. Update web.config processPath
$webConfigPath = Join-Path $currentDir "web.config"
if (Test-Path $webConfigPath) {
    [xml]$config = Get-Content $webConfigPath
    $httpPlatformNode = $config.configuration."system.webServer".httpPlatform
    if ($null -ne $httpPlatformNode) {
        $httpPlatformNode.processPath = $nodePath
        $config.Save($webConfigPath)
        Write-Host "Updated web.config with absolute processPath: $nodePath" -ForegroundColor Green
    }
} else {
    Write-Error "web.config file not found in current directory."
    Exit 1
}

# 7. Configure IIS WebApp / Application Pool
Import-Module WebAdministration

$appName = "foliodesk"
$siteName = "Default Web Site"
$poolName = "foliodeskPool"

# Create Application Pool if it doesn't exist
if (-not (Test-Path "IIS:\AppPools\$poolName")) {
    New-WebAppPool -Name $poolName
    Write-Host "Created Application Pool '$poolName'." -ForegroundColor Green
}

# Set pool to No Managed Code
Set-ItemProperty "IIS:\AppPools\$poolName" -Name "managedRuntimeVersion" -Value ""

# Create Application under Default Web Site if it doesn't exist
$appPath = "IIS:\Sites\$siteName\$appName"
if (-not (Test-Path $appPath)) {
    New-WebApplication -Name $appName -Site $siteName -PhysicalPath $currentDir -ApplicationPool $poolName
    Write-Host "Created IIS Application '$appName' under '$siteName'." -ForegroundColor Green
} else {
    # Update physical path and app pool
    Set-ItemProperty $appPath -Name "physicalPath" -Value $currentDir
    Set-ItemProperty $appPath -Name "applicationPool" -Value $poolName
    Write-Host "Updated existing IIS Application '$appName'." -ForegroundColor Green
}

Write-Host "IIS Setup completed successfully!" -ForegroundColor Green
Write-Host "Please build the application: pnpm build" -ForegroundColor Yellow
Write-Host "Then visit: http://localhost/foliodesk" -ForegroundColor Yellow
