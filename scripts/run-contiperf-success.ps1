$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$reportDir = Join-Path $root 'target\contiperf-report'
$artifactDir = Join-Path $root 'artifacts\contiperf\success'

if (Test-Path $reportDir) {
    Remove-Item -Recurse -Force $reportDir
}

if (Test-Path $artifactDir) {
    Remove-Item -Recurse -Force $artifactDir
}

Push-Location $root
try {
    & mvn "-Dtest=RemotePerformanceSuccessIT" test
    if ($LASTEXITCODE -ne 0) {
        throw "La ejecucion satisfactoria de ContiPerf ha fallado."
    }

    if (-not (Test-Path $reportDir)) {
        throw "No se ha generado la carpeta target\\contiperf-report."
    }

    New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null
    Get-ChildItem $reportDir | Copy-Item -Destination $artifactDir -Recurse -Force
}
finally {
    Pop-Location
}

Write-Host "Reportes ContiPerf correctos copiados en $artifactDir"
