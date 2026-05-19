$ErrorActionPreference = "Stop"

$doxygen = Get-Command doxygen -ErrorAction SilentlyContinue
if (-not $doxygen) {
    throw "Doxygen is required to generate the documentation. Install Doxygen and rerun this script."
}

New-Item -ItemType Directory -Force -Path "docs/doxygen" | Out-Null
Remove-Item -Recurse -Force "target/doxygen" -ErrorAction SilentlyContinue

& $doxygen.Source Doxyfile

$latexDir = Join-Path "target/doxygen" "latex"
$pdf = Join-Path $latexDir "refman.pdf"

if (Get-Command latexmk -ErrorAction SilentlyContinue) {
    Push-Location $latexDir
    latexmk -pdf -f -interaction=nonstopmode refman.tex
    Pop-Location
} elseif (Get-Command pdflatex -ErrorAction SilentlyContinue) {
    Push-Location $latexDir
    pdflatex -interaction=nonstopmode refman.tex
    pdflatex -interaction=nonstopmode refman.tex
    Pop-Location
} else {
    throw "LaTeX is required to create the Doxygen PDF. Install latexmk or pdflatex."
}

if (-not (Test-Path $pdf)) {
    throw "Doxygen LaTeX generation did not create refman.pdf."
}

Copy-Item -Force $pdf "docs/doxygen/MovieTrakk-Doxygen.pdf"
