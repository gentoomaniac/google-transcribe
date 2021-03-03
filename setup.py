#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Note: To use the 'upload' functionality of this file, you must:
#   $ pip install twine

import os

from setuptools import find_packages, setup, Command

# Package meta-data.
NAME = 'google-transcribe'
DESCRIPTION = ''
URL = 'https://github.com/gentoomaniac/google-transcribe'
EMAIL = 'marco@siebecke.se'
AUTHOR = 'Marco Siebecke'
REQUIRES_PYTHON = '>=3.6.0'
VERSION = None
LICENSE = 'MIT'
EXCLUDE_FROM_PACKAGES = []
PACKAGE_DATA = []
REQUIRED = ['click', 'google-cloud-speech']

EXTRAS = {}

here = os.path.abspath(os.path.dirname(__file__))

setup(
    name=NAME,
    version=VERSION,
    description=DESCRIPTION,
    long_description=DESCRIPTION,
    author=AUTHOR,
    author_email=EMAIL,
    python_requires=REQUIRES_PYTHON,
    url=URL,
    packages=find_packages(exclude=EXCLUDE_FROM_PACKAGES),
    install_requires=REQUIRED,
    extras_require=EXTRAS,
    include_package_data=True,
    package_data={'': PACKAGE_DATA},
    license=LICENSE,
    entry_points={
        'console_scripts': ['google-transcribe = google_transcribe.main:cli',],
    },
)
