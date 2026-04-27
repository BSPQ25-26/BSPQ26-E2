$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$toolsDir = Join-Path $root 'tools'
$zipPath = Join-Path $toolsDir 'visualvm_221.zip'
$downloadUrl = 'https://github.com/oracle/visualvm/releases/download/2.2.1/visualvm_221.zip'
$userDir = Join-Path $root 'tools\visualvm-userdir'
$cacheDir = Join-Path $root 'tools\visualvm-cache'

New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
New-Item -ItemType Directory -Force -Path $userDir | Out-Null
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null

function Get-VisualVmExecutable {
    $match = Get-ChildItem -Path $toolsDir -Filter 'visualvm*' -Directory -ErrorAction SilentlyContinue `
        | ForEach-Object { Join-Path $_.FullName 'bin\visualvm.exe' } `
        | Where-Object { Test-Path $_ } `
        | Select-Object -First 1
    return $match
}

$visualVmExe = Get-VisualVmExecutable

if (-not $visualVmExe) {
    Get-ChildItem -Path $toolsDir -Filter 'visualvm*' -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force

    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
    Remove-Item -Force $zipPath

    $visualVmExe = Get-VisualVmExecutable
}

if (-not $visualVmExe) {
    throw "No se ha encontrado visualvm.exe después de descomprimir VisualVM."
}

& $visualVmExe --jdkhome "C:\Users\Alvaro\tools\jdk-21" --userdir $userDir --cachedir $cacheDir --help | Out-Null

Write-Host "VisualVM listo en $visualVmExe"
