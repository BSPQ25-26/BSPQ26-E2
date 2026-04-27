$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

Push-Location $root
try {
    & mvn test
    if ($LASTEXITCODE -ne 0) {
        throw "mvn test ha fallado."
    }

    & (Join-Path $PSScriptRoot 'run-contiperf-success.ps1')
    & (Join-Path $PSScriptRoot 'run-contiperf-failure.ps1')
}
finally {
    Pop-Location
}

Write-Host "Verificacion local completada."
