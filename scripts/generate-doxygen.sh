#!/usr/bin/env bash
set -euo pipefail

if ! command -v doxygen >/dev/null 2>&1; then
  echo "Doxygen is required to generate the documentation." >&2
  exit 1
fi

mkdir -p docs/doxygen
rm -rf target/doxygen
doxygen Doxyfile

latex_dir="target/doxygen/latex"

if command -v latexmk >/dev/null 2>&1; then
  (cd "$latex_dir" && latexmk -pdf -f -interaction=nonstopmode refman.tex) || true
elif command -v pdflatex >/dev/null 2>&1; then
  (cd "$latex_dir" && pdflatex -interaction=nonstopmode refman.tex && pdflatex -interaction=nonstopmode refman.tex) || true
else
  echo "LaTeX is required to create the Doxygen PDF. Install latexmk or pdflatex." >&2
  exit 1
fi

if [ ! -f "$latex_dir/refman.pdf" ]; then
  echo "Doxygen LaTeX generation did not create refman.pdf." >&2
  exit 1
fi

cp "$latex_dir/refman.pdf" docs/doxygen/MovieTrakk-Doxygen.pdf
