$ErrorActionPreference = 'Stop'

# Dynamically find Java from the redhat.java extension
# $JavaExe = Get-ChildItem -Path "$env:USERPROFILE\.antigravity\extensions" -Filter "java.exe" -Recurse | Select-Object -First 1
# Since we know the relative structure, we'll try to find it
$ExtensionsPath = Join-Path $env:USERPROFILE ".antigravity\extensions"
$JavaPaths = Get-ChildItem -Path $ExtensionsPath -Filter "java.exe" -Recurse | Select-Object -ExpandProperty FullName

if ($JavaPaths -eq $null -or $JavaPaths.Count -eq 0) {
    Write-Error "Could not find java.exe in $ExtensionsPath"
    exit 1
}

$JavaExe = $JavaPaths[0]
$JavaHome = Split-Path (Split-Path $JavaExe -Parent) -Parent
Write-Host "Found JAVA_HOME: $JavaHome" -ForegroundColor Green

# Find Maven bin directory
$M2Path = Join-Path $env:USERPROFILE ".m2\wrapper\dists"
$MavenCmds = Get-ChildItem -Path $M2Path -Filter "mvn.cmd" -Recurse | Select-Object -ExpandProperty FullName

if ($MavenCmds -eq $null -or $MavenCmds.Count -eq 0) {
    Write-Error "Could not find mvn.cmd in $M2Path"
    exit 1
}

$MavenCmd = $MavenCmds[0]
$MavenBin = Split-Path $MavenCmd -Parent
Write-Host "Found Maven bin: $MavenBin" -ForegroundColor Green

# Set session-scoped environment variables
$env:JAVA_HOME = $JavaHome
$env:PATH = "$MavenBin;$env:PATH"

# Run Backend
Write-Host "Starting Backend..." -ForegroundColor Cyan
# Using Start-Process to keep it in background during the script
Start-Process -NoNewWindow powershell -ArgumentList "-Command", "cd e:\Campus-Management\backend; & '$MavenCmd' spring-boot:run"

# Run Frontend
Write-Host "Starting Frontend..." -ForegroundColor Cyan
cd e:\Campus-Management\frontend
npm run dev -- --port 5173
