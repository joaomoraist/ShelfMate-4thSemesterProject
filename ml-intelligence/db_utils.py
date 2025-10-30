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


def update_product_status(conn, product_id, new_status):
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE products SET status = %s WHERE id = %s",
            (str(new_status), product_id),
        )


def get_product_sales_daily_avg(conn, product_id):
    """Retorna a média diária de vendas (qntd/dia) para um produto.
    Caso não haja datas, cai no total dividido por 1 (fallback).
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT CASE
              WHEN MAX(s.sale_date) IS NOT NULL AND EXTRACT(DAYS FROM (MAX(s.sale_date) - MIN(s.sale_date))) + 1 > 0
              THEN COALESCE(SUM(s.qntd),0) / (EXTRACT(DAYS FROM (MAX(s.sale_date) - MIN(s.sale_date))) + 1)
              ELSE COALESCE(SUM(s.qntd),0)
            END AS daily_avg
            FROM sales s
            WHERE s.product_id = %s
            """,
            (product_id,),
        )
        row = cur.fetchone()
        return float(row[0] or 0.0)


def insert_alert(conn, product_id, alert_type):
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO alerts (alert_type, product_id) VALUES (%s, %s)",
            (alert_type, product_id),
        )


def fetch_company_user_emails(conn, company_id):
    """Retorna lista de e-mails dos usuários da empresa especificada."""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT email FROM users WHERE company_id = %s AND email IS NOT NULL",
            (company_id,),
        )
        rows = cur.fetchall()
        return [str(r['email']).strip() for r in rows if str(r.get('email', '')).strip()]


def commit(conn):
    conn.commit()


def rollback(conn):
    conn.rollback()