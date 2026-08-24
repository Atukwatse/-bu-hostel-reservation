import os
import django
from django.core.management.color import no_style
from django.db import connection
from django.apps import apps

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bu_hostel_backend.settings')
django.setup()

with connection.cursor() as cursor:
    for app in ['users', 'hostels', 'reservations', 'admin', 'auth', 'contenttypes', 'sessions', 'authtoken']:
        try:
            app_config = apps.get_app_config(app)
            statements = connection.ops.sequence_reset_sql(no_style(), app_config.get_models())
            for statement in statements:
                cursor.execute(statement)
        except Exception as e:
            print(f"Skipping {app}: {e}")

print("Sequences reset successfully!")
