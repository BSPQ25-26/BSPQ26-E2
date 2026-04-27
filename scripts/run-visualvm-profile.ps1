param(
    [int]$LoadSeconds = 8
)

$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$visualVmUserDir = Join-Path $root 'tools\visualvm-userdir'
$visualVmCacheDir = Join-Path $root 'tools\visualvm-cache'
$visualVmTmpDir = Join-Path $root 'artifacts\visualvm\tmp'
$snapshotDir = Join-Path $root 'artifacts\visualvm'
$stdoutLog = Join-Path $snapshotDir 'profiling-server.out.log'
$stderrLog = Join-Path $snapshotDir 'profiling-server.err.log'
$jdkHome = 'C:\Users\Alvaro\tools\jdk-21'

if (-not (Test-Path $jdkHome) -and $env:JAVA_HOME) {
    $jdkHome = $env:JAVA_HOME
}

function Get-VisualVmExecutable {
    $toolsDir = Join-Path $root 'tools'
    return Get-ChildItem -Path $toolsDir -Filter 'visualvm*' -Directory -ErrorAction SilentlyContinue `
        | ForEach-Object { Join-Path $_.FullName 'bin\visualvm.exe' } `
        | Where-Object { Test-Path $_ } `
        | Select-Object -First 1
}

function Get-JcmdExecutable {
    $localJcmd = Join-Path $jdkHome 'bin\jcmd.exe'
    if (Test-Path $localJcmd) {
        return $localJcmd
    }

    $pathJcmd = Get-Command 'jcmd.exe' -ErrorAction SilentlyContinue
    if ($pathJcmd) {
        return $pathJcmd.Source
    }

    throw 'No se ha encontrado jcmd.exe. Configura JAVA_HOME o instala un JDK 21 local.'
}

$visualVmExe = Get-VisualVmExecutable
$jcmd = Get-JcmdExecutable

if (-not (Test-Path $visualVmExe)) {
    & (Join-Path $PSScriptRoot 'setup-visualvm.ps1')
    $visualVmExe = Get-VisualVmExecutable
}

function Invoke-VisualVmCommand {
    param(
        [string[]]$CommandArgs,
        [switch]$Background
    )

    $visualVmArgs = @(
        '--jdkhome', $jdkHome,
        '--userdir', $visualVmUserDir,
        '--cachedir', $visualVmCacheDir,
        "-J-Dvisualvm.tmpdir=$visualVmTmpDir"
    ) + $CommandArgs

    if ($Background) {
        Start-Process -FilePath $visualVmExe `
            -ArgumentList $visualVmArgs `
            -WindowStyle Hidden | Out-Null
        return
    }

    & $visualVmExe @visualVmArgs | Out-Null
}

function Stop-VisualVmProcesses {
    $escapedUserDir = [regex]::Escape($visualVmUserDir)

    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue `
        | Where-Object {
            ($_.Name -eq 'visualvm.exe' -or $_.Name -eq 'java.exe') `
                -and $_.CommandLine `
                -and ($_.CommandLine -match $escapedUserDir)
        } `
        | ForEach-Object {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }
}

New-Item -ItemType Directory -Force -Path $snapshotDir | Out-Null

if (Test-Path $visualVmTmpDir) {
    Remove-Item -Recurse -Force $visualVmTmpDir
}

New-Item -ItemType Directory -Force -Path $visualVmTmpDir | Out-Null

if (Test-Path $stdoutLog) {
    Remove-Item -Force $stdoutLog
}

if (Test-Path $stderrLog) {
    Remove-Item -Force $stderrLog
}

$startTime = Get-Date
$mavenProcess = Start-Process -FilePath 'mvn' `
    -ArgumentList 'spring-boot:run', '-Dspring-boot.run.profiles=profiling' `
    -WorkingDirectory $root `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -WindowStyle Hidden `
    -PassThru

$javaPid = $null

try {
    for ($i = 0; $i -lt 60; $i++) {
        try {
            Invoke-WebRequest -Uri 'http://localhost:8080/api/movies' -UseBasicParsing | Out-Null
            break
        }
        catch {
            Start-Sleep -Seconds 2
        }
    }

    for ($i = 0; $i -lt 30 -and -not $javaPid; $i++) {
        $match = & $jcmd -l | Select-String 'com.bspq.e2.App'
        if ($match) {
            $javaPid = ($match.ToString().Trim() -split '\s+')[0]
            break
        }
        Start-Sleep -Seconds 1
    }

    if (-not $javaPid) {
        throw "No se ha encontrado el proceso Java de MovieTrakk para perfilar."
    }

    Invoke-VisualVmCommand -CommandArgs @('--start-cpu-sampler', $javaPid) -Background
    Start-Sleep -Seconds 12

    $deadline = (Get-Date).AddSeconds($LoadSeconds)
    $requestCount = 0
    while ((Get-Date) -lt $deadline) {
        Invoke-WebRequest -Uri 'http://localhost:8080/api/movies' -UseBasicParsing | Out-Null
        Invoke-WebRequest -Uri 'http://localhost:8080/api/movies/1' -UseBasicParsing | Out-Null
        Invoke-WebRequest -Uri 'http://localhost:8080/api/users/1/movies/1/status' -UseBasicParsing | Out-Null
        $requestCount += 3
    }

    Invoke-VisualVmCommand -CommandArgs @('--snapshot-sampler', $javaPid)

    Start-Sleep -Seconds 2

    Invoke-VisualVmCommand -CommandArgs @('--stop-sampler', $javaPid)

    $snapshot = Get-ChildItem -Path $visualVmTmpDir, $visualVmUserDir -Recurse -File `
        -Include *.nps, *.npss, *.apps `
        | Where-Object { $_.LastWriteTime -ge $startTime } `
        | Sort-Object LastWriteTime -Descending `
        | Select-Object -First 1

    if (-not $snapshot) {
        throw "VisualVM no ha generado ningun snapshot reutilizable."
    }

    $targetSnapshot = Join-Path $snapshotDir ("visualvm-snapshot" + $snapshot.Extension)
    Copy-Item -Force $snapshot.FullName $targetSnapshot

    Write-Host "Snapshot VisualVM generado en $targetSnapshot"
    Write-Host "Peticiones HTTP generadas durante el perfilado: $requestCount"
}
finally {
    if ($javaPid) {
        Stop-Process -Id $javaPid -Force -ErrorAction SilentlyContinue
    }

    if ($mavenProcess -and -not $mavenProcess.HasExited) {
        Stop-Process -Id $mavenProcess.Id -Force -ErrorAction SilentlyContinue
    }

    Stop-VisualVmProcesses
}
