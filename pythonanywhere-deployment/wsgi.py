"""PythonAnywhere WSGI entry point.

In the PythonAnywhere dashboard set:
  Source code directory : /home/<username>/cyclegan
  WSGI configuration file : this file (or paste its content into the auto-generated one)
  Working directory : /home/<username>/cyclegan
"""

import sys
import os

# Make sure the project directory is on the path so all local imports work
project_home = os.path.dirname(os.path.abspath(__file__))
if project_home not in sys.path:
    sys.path.insert(0, project_home)

from app import app as application  # noqa: F401 — uWSGI looks for `application`
