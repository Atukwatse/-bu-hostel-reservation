import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    # Connect to the default database as superuser
    conn = psycopg2.connect(
        dbname='postgres',
        user='postgres',
        password='blessing2004',
        host='127.0.0.1',
        port='5432'
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'bu_hostels'")
    exists = cursor.fetchone()
    
    if not exists:
        cursor.execute('CREATE DATABASE bu_hostels')
        print("Database 'bu_hostels' created successfully.")
    else:
        print("Database 'bu_hostels' already exists.")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
