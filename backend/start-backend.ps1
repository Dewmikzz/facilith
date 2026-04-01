$ErrorActionPreference = 'Stop'

# Define safe paths free of special characters
$SafeMavenPath = "E:\maven"
$MavenZipPath = "E:\maven.zip"
$MavenUrl = "https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip"

Write-Host "Checking Java..." -ForegroundColor Cyan

# Find the installed Java from the Red Hat VSCode Extension dynamically
$JavaExe = "$env:USERPROFILE\.antigravity\extensions\redhat.java-1.53.0-win32-x64\jre\21.0.10-win32-x86_64\bin\java.exe"

if (-Not (Test-Path $JavaExe)) {
    Write-Error "Could not find Java. Ensure the redhat.java extension is installed properly."
    exit 1
}

$env:JAVA_HOME = Split-Path (Split-Path $JavaExe -Parent) -Parent
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Java is set up!" -ForegroundColor Green

# Check and Install Maven locally
if (-Not (Test-Path "$SafeMavenPath\bin\mvn.cmd")) {
    Write-Host "Maven not found in $SafeMavenPath. Downloading..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $MavenUrl -OutFile $MavenZipPath -UseBasicParsing
    
    Write-Host "Extracting Maven..." -ForegroundColor Yellow
    Expand-Archive -Path $MavenZipPath -DestinationPath "E:\" -Force
    Rename-Item -Path "E:\apache-maven-3.9.9" -NewName "maven"
    Remove-Item -Path $MavenZipPath -Force
}

$env:MAVEN_HOME = $SafeMavenPath
$env:PATH = "$env:MAVEN_HOME\bin;$env:PATH"

# Run the app and store local maven cache in E:\ to avoid the ™ symbol in path
$env:MAVEN_OPTS = "-Dmaven.repo.local=E:\.m2\repository"

Write-Host "Starting Spring Boot..." -ForegroundColor Cyan
& "$SafeMavenPath\bin\mvn.cmd" spring-boot:run
