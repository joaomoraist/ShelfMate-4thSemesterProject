"""
Script demonstrativo:
- A cada 1 minuto: insere vendas para todos os produtos.
- A cada 2 minutos: adiciona reposição aleatória no estoque de todos os produtos.
- Após cada operação, verifica estoque baixo e envia e-mail (SMTP/Gmail) com resumo.

Requer variáveis de ambiente para DB e (opcional) e-mail via SMTP (Gmail):
- DATABASE_URL (PostgreSQL)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SENDER, SMTP_RECIPIENTS (comma-separated)
  * Valores padrão: host=smtp.gmail.com, port=587; SENDER usa SMTP_USER se não definido

Execução:
  python ml-intelligence/periodic_sales_random_restock.py
"""
import os
import time
import random
from datetime import datetime
from typing import List, Dict

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

from db_utils import (
    get_connection,
    fetch_all_products,
    insert_sale,
    update_inventory,
    update_product_status,
    get_product_sales_daily_avg,
    insert_alert,
    fetch_company_user_emails,
    commit,
    rollback,
)


# Intervalos
SALES_INTERVAL_SECONDS = 60
RESTOCK_INTERVAL_SECONDS = 120

# Limiar de estoque baixo (base)
LOW_STOCK_THRESHOLD = float(os.environ.get('LOW_STOCK_THRESHOLD', 10))
# Fator multiplicador para limite dinâmico com base na média diária de vendas
DYNAMIC_LOW_STOCK_MULTIPLIER = float(os.environ.get('DYNAMIC_LOW_STOCK_MULTIPLIER', 1.33))

# Reposição aleatória
RANDOM_RESTOCK_MIN = int(os.environ.get('RANDOM_RESTOCK_MIN', 1))
RANDOM_RESTOCK_MAX = int(os.environ.get('RANDOM_RESTOCK_MAX', 8))

# Carregar env do backend/.env se existir
BACKEND_ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
if os.path.exists(BACKEND_ENV_PATH):
    load_dotenv(BACKEND_ENV_PATH)
else:
    load_dotenv()

# E-mail via SMTP (opcional)
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER')
SMTP_PASS = os.environ.get('SMTP_PASS')
SMTP_SENDER = os.environ.get('SMTP_SENDER') or SMTP_USER
SMTP_RECIPIENTS = [r.strip() for r in os.environ.get('SMTP_RECIPIENTS', '').split(',') if r.strip()]


def send_email_summary(subject: str, lines: List[str], recipients: List[str] | None = None) -> None:
    """Envia e-mail via SMTP (Gmail) se configurado; destinatários podem ser dinâmicos.
    Se 'recipients' não for informado, usa SMTP_RECIPIENTS do ambiente; caso não haja, apenas loga no console.
    """
    body = "\n".join(lines) if lines else "Sem itens."
    dests = recipients if (recipients and len(recipients) > 0) else SMTP_RECIPIENTS
    if not (SMTP_SENDER and SMTP_USER and SMTP_PASS and dests):
        print(f"[Email:SKIP] {subject}\n{body}")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_SENDER
        msg['To'] = ", ".join(dests)
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_SENDER, dests, msg.as_string())
        server.quit()
        print(f"[Email:OK] {subject} -> {', '.join(dests)}")
    except Exception as e:
        print(f"[Email:ERR] {e}")


def send_password_reset_email(recipient: str, code: str) -> None:
    """Envia e-mail de reset de senha (conteúdo simples) via SMTP."""
    subject = "[ShelfMate] Código de recuperação de senha"
    lines = [
        "Você solicitou a recuperação de senha.",
        f"Seu código é: {code}",
        "Se não foi você, ignore este e-mail.",
    ]
    send_email_summary(subject, lines, recipients=[recipient])


def perform_sales(conn, company_id=None) -> int:
    products = fetch_all_products(conn, company_id)
    count = 0
    for p in products:
        pid = p['id']
        name = p['name']
        price = float(p['unit_price'] or 0)
        inventory = float(p['inventory'] or 0)
        status = (p.get('status') or '').strip()

        # Não vender se estoque zerado ou produto indisponível
        if inventory <= 0 or status.lower() == 'indisponível':
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
        update_product_status(conn, pid, 'Disponível')
        insert_alert(conn, pid, 'Disponível')
        updated[pid] = new_inv
    commit(conn)
    return updated


def check_low_stock_and_notify(conn, company_id=None) -> int:
    products = fetch_all_products(conn, company_id)
    lows = []
    by_company: dict[int, list[dict]] = {}
    for p in products:
        inv = float(p['inventory'] or 0)
        # Calcular limiar dinâmico com base na média diária de vendas
        daily_avg = get_product_sales_daily_avg(conn, p['id'])
        dynamic_threshold = max(LOW_STOCK_THRESHOLD, daily_avg * DYNAMIC_LOW_STOCK_MULTIPLIER)
        if inv <= dynamic_threshold:
            lows.append(p)
            # Atualizar status do produto e usar tipo de alerta compatível com enum do banco
            new_status = 'Indisponível' if inv <= 0 else 'Estoque Baixo'
            alert_type = 'Estoque Zerado' if inv <= 0 else 'Estoque Baixo'
            update_product_status(conn, p['id'], new_status)
            insert_alert(conn, p['id'], alert_type)
            cid = p.get('company_id')
            if cid is not None:
                by_company.setdefault(int(cid), []).append(p)
    commit(conn)

    if lows:
        # Enviar por empresa para todos os usuários da empresa correspondente
        for cid, items in by_company.items():
            lines = [
                f"id={p['id']} | {p['name']} | estoque={p['inventory']}"
                for p in items
            ]
            recipients = []
            try:
                recipients = fetch_company_user_emails(conn, cid)
            except Exception as e:
                print(f"[Email:ERR] Falha ao buscar e-mails da empresa {cid}: {e}")
            if recipients:
                send_email_summary(
                    subject=f"[ShelfMate] {len(items)} produtos com estoque baixo (empresa {cid})",
                    lines=lines,
                    recipients=recipients,
                )
            else:
                print(f"[Email:SKIP] Empresa {cid} sem destinatários configurados")
    else:
        print("[Notify] Nenhum produto com estoque baixo.")

    return len(lows)


def get_low_stock_lines(conn, company_id=None) -> List[str]:
    """Retorna linhas de produtos com estoque baixo sem enviar e-mail."""
    products = fetch_all_products(conn, company_id)
    lows = []
    for p in products:
        inv = float(p['inventory'] or 0)
        if inv <= LOW_STOCK_THRESHOLD:
            lows.append(p)
    return [
        f"id={p['id']} | {p['name']} | estoque={p['inventory']}"
        for p in lows
    ]


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
    loop_num = 0
    try:
        while True:
            now = time.time()
            try:
                if now - last_sales >= SALES_INTERVAL_SECONDS:
                    loop_num += 1
                    print(f"\n===== Loop número {loop_num} - [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] =====")
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