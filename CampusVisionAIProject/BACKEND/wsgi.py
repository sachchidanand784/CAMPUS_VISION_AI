import sys
import os

# Add backend directory to system path
project_home = os.path.dirname(os.path.abspath(__file__))
if project_home not in sys.path:
    sys.path.insert(0, project_home)

from main import app
from a2wsgi import ASGIMiddleware

# Wrap FastAPI ASGI app to WSGI compatibility layer
application = ASGIMiddleware(app)
