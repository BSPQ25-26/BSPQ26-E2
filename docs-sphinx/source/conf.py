import os
import sys

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute.
# sys.path.insert(0, os.path.abspath('../../src/main/java'))

project = 'MovieTrakk Documentation'
copyright = '2026, MovieTrakk'
author = 'MovieTrakk Team'

# The short X.Y version
version = '1.0'
# The full version, including alpha/beta/rc tags
release = '1.0-SNAPSHOT'

extensions = [
    'myst_parser',
    'sphinx_rtd_theme',
]

templates_path = ['_templates']
exclude_patterns = []

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_logo = None
html_favicon = None

myst_enable_extensions = [
    'colon_fence',
    'deflist',
    'html_admonition',
    'html_image',
]
