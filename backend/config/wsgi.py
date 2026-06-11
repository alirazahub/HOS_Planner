import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
application = get_wsgi_application()

# Vercel's Python runtime looks for a variable named `app`.
app = application

if os.environ.get("VERCEL"):
    # Serverless instances start with an empty /tmp, so create the
    # SQLite schema on cold start.
    from django.core.management import call_command

    call_command("migrate", interactive=False, verbosity=0)
