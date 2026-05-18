# Minimal Makefile for Sphinx documentation
# You can use `make html` to build HTML documentation.
SPHINXBUILD   = sphinx-build
SOURCEDIR     = source
BUILDDIR      = _build

.PHONY: help html clean

help:
	@echo "Please use 'make <target>' where <target> is one of"
	@echo "  html     to make HTML documentation"
	@echo "  clean    to remove built documentation files"

html:
	@$(SPHINXBUILD) -M html "$(SOURCEDIR)" "$(BUILDDIR)" -q
	@echo "\nBuild finished. The HTML pages are in $(BUILDDIR)/html."

clean:
	rm -rf $(BUILDDIR)
