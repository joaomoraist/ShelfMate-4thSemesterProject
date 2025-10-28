"""
Script demonstrativo:
- A cada 1 minuto: insere vendas para todos os produtos.
- A cada 2 minutos: adiciona reposição aleatória no estoque de todos os produtos.
- Após cada operação, verifica estoque baixo e envia e-mail (SES) com resumo.

Requer variáveis de ambiente para DB e (opcional) e-mail via AWS SES:
- DATABASE_URL (PostgreSQL)
- AWS_REGION, AWS_SES_SENDER, AWS_SES_RECIPIENTS (comma-separated), opcionais

Execução:
  python ml-intelligence/periodic_sales_random_restock.py
"""
import os
import time
import random
from datetime import datetime
from typing import List, Dict

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv

from db_utils import (
    get_connection,
    fetch_all_products,
    insert_sale,
    update_inventory,
    insert_alert,
    commit,
    rollback,
)


# Intervalos
SALES_INTERVAL_SECONDS = 60
RESTOCK_INTERVAL_SECONDS = 120

# Limiar de estoque baixo
LOW_STOCK_THRESHOLD = float(os.environ.get('LOW_STOCK_THRESHOLD', 10))

# Reposição aleatória
RANDOM_RESTOCK_MIN = int(os.environ.get('RANDOM_RESTOCK_MIN', 1))
RANDOM_RESTOCK_MAX = int(os.environ.get('RANDOM_RESTOCK_MAX', 8))

# Carregar env do backend/.env se existir
BACKEND_ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
if os.path.exists(BACKEND_ENV_PATH):
    load_dotenv(BACKEND_ENV_PATH)
else:
    load_dotenv()

# E-mail via SES (opcional)
AWS_REGION = os.environ.get('AWS_REGION')
SES_SENDER = os.environ.get('AWS_SES_SENDER')
SES_RECIPIENTS = [r.strip() for r in os.environ.get('AWS_SES_RECIPIENTS', '').split(',') if r.strip()]


def send_email_summary(subject: str, lines: List[str]) -> None:
    """Envia e-mail via SES se configurado; caso contrário, apenas loga no console."""
    body = "\n".join(lines) if lines else "Sem itens."
    if not (AWS_REGION and SES_SENDER and SES_RECIPIENTS):
        print(f"[Email:SKIP] {subject}\n{body}")
        return

    try:
        ses = boto3.client('ses', region_name=AWS_REGION)
        ses.send_email(
            Source=SES_SENDER,
            Destination={'ToAddresses': SES_RECIPIENTS},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {'Text': {'Data': body, 'Charset': 'UTF-8'}},
            },
        )
        print(f"[Email:OK] {subject} -> {', '.join(SES_RECIPIENTS)}")
    except (BotoCoreError, ClientError) as e:
        print(f"[Email:ERR] {e}")


def perform_sales(conn, company_id=None) -> int:
    products = fetch_all_products(conn, company_id)
    count = 0
    for p in products:
        pid = p['id']
        name = p['name']
        price = float(p['unit_price'] or 0)
        inventory = float(p['inventory'] or 0)

        if inventory <= 0:
            continue

        max_q = max(1, min(int(inventory), 5))
        qntd = random.randint(1, max_q)
        value = round(qntd * price, 2)

        insert_sale(conn, pid, qntd, value)
        update_inventory(conn, pid, max(0.0, inventory - qntd))
        count += 1
    commit(conn)
    return count


def perform_random_restock(conn, company_id=None) -> Dict[int, float]:
    products = fetch_all_products(conn, company_id)
    updated: Dict[int, float] = {}
    for p in products:
        pid = p['id']
        name = p['name']
        inventory = float(p['inventory'] or 0)
        inc = random.randint(RANDOM_RESTOCK_MIN, RANDOM_RESTOCK_MAX)
        new_inv = inventory + inc
        update_inventory(conn, pid, new_inv)
        # Marcar como disponível após reposição aleatória
        insert_alert(conn, pid, 'Disponível')
        updated[pid] = new_inv
    commit(conn)
    return updated


def check_low_stock_and_notify(conn, company_id=None) -> int:
    products = fetch_all_products(conn, company_id)
    lows = []
    for p in products:
        inv = float(p['inventory'] or 0)
        if inv <= LOW_STOCK_THRESHOLD:
            lows.append(p)
            insert_alert(conn, p['id'], 'Estoque Baixo')
    commit(conn)

    if lows:
        lines = [
            f"id={p['id']} | {p['name']} | estoque={p['inventory']}"
            for p in lows
        ]
        send_email_summary(
            subject=f"[ShelfMate] {len(lows)} produtos com estoque baixo (<= {LOW_STOCK_THRESHOLD})",
            lines=lines,
        )
    else:
        print("[Notify] Nenhum produto com estoque baixo.")

    return len(lows)


def main():
    company_id = os.environ.get('SIM_COMPANY_ID')
    if company_id is not None:
        try:
            company_id = int(company_id)
        except ValueError:
            company_id = None

    conn = get_connection()
    print(f"[Periodic] Iniciado às {datetime.now().isoformat()} | vendas={SALES_INTERVAL_SECONDS}s | reposição={RESTOCK_INTERVAL_SECONDS}s")

    last_sales = 0.0
    last_restock = 0.0
    try:
        while True:
            now = time.time()
            try:
                if now - last_sales >= SALES_INTERVAL_SECONDS:
                    cnt = perform_sales(conn, company_id)
                    print(f"[Sales] {cnt} vendas inseridas às {datetime.now().strftime('%H:%M:%S')}")
                    low_cnt = check_low_stock_and_notify(conn, company_id)
                    print(f"[Check] {low_cnt} produtos com estoque baixo após vendas")
                    last_sales = now

                if now - last_restock >= RESTOCK_INTERVAL_SECONDS:
                    updates = perform_random_restock(conn, company_id)
                    print(f"[Restock] Reposição aleatória aplicada a {len(updates)} produtos às {datetime.now().strftime('%H:%M:%S')}")
                    low_cnt = check_low_stock_and_notify(conn, company_id)
                    print(f"[Check] {low_cnt} produtos com estoque baixo após reposição")
                    last_restock = now
            except Exception as err:
                print(f"[Periodic] Erro: {err}")
                rollback(conn)

            time.sleep(5)
    finally:
        conn.close()


if __name__ == '__main__':
    main()