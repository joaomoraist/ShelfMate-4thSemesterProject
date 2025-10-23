import os
import time
from urllib.parse import urlparse
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Attempt to load backend/.env to reuse DATABASE_URL
BACKEND_ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
if os.path.exists(BACKEND_ENV_PATH):
    load_dotenv(BACKEND_ENV_PATH)
else:
    load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise RuntimeError('DATABASE_URL not found. Set env var or ensure backend/.env is present.')


def get_connection():
    """Create a new psycopg2 connection using DATABASE_URL."""
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    return conn


def fetch_all_products(conn, company_id=None):
    """Fetch products with id, name, unit_price, inventory, status, company_id."""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if company_id is not None:
            cur.execute(
                "SELECT id, name, unit_price, inventory, status, company_id FROM products WHERE company_id = %s ORDER BY id",
                (company_id,),
            )
        else:
            cur.execute(
                "SELECT id, name, unit_price, inventory, status, company_id FROM products ORDER BY id"
            )
        rows = cur.fetchall()
        return rows


def insert_sale(conn, product_id, qntd, value):
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO sales (product_id, qntd, value) VALUES (%s, %s, %s)",
            (product_id, float(qntd), float(value)),
        )


def update_inventory(conn, product_id, new_inventory):
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE products SET inventory = %s WHERE id = %s",
            (float(new_inventory), product_id),
        )


def insert_alert(conn, product_id, alert_type):
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO alerts (alert_type, product_id) VALUES (%s, %s)",
            (alert_type, product_id),
        )


def commit(conn):
    conn.commit()


def rollback(conn):
    conn.rollback()