$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$reportDir = Join-Path $root 'target\contiperf-report'
$artifactDir = Join-Path $root 'artifacts\contiperf\failure'

if (Test-Path $reportDir) {
    Remove-Item -Recurse -Force $reportDir
}

if (Test-Path $artifactDir) {
    Remove-Item -Recurse -Force $artifactDir
}

Push-Location $root
try {
    & mvn "-Dtest=RemotePerformanceFailureIT" test
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        throw "La ejecucion que debia fallar no ha fallado."
    }

    if (-not (Test-Path $reportDir)) {
        throw "La ejecución fallida no ha dejado reportes en target\\contiperf-report."
    }

    New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null
    Get-ChildItem $reportDir | Copy-Item -Destination $artifactDir -Recurse -Force
}
finally {
    Pop-Location
}

Write-Host "La ejecucion fallida ha fallado como se esperaba y sus reportes estan en $artifactDir"
