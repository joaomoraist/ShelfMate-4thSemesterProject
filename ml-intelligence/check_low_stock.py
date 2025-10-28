"""
Script para verificar se o estoque está baixo e opcionalmente repor estoque seguro.
Uso:
  python check_low_stock.py [--company-id <id>] [--apply-restock]
"""
import argparse
from datetime import datetime
from db_utils import get_connection, fetch_all_products, update_inventory, insert_alert, commit, rollback

LOW_STOCK_THRESHOLD = 10.0
NEAR_ZERO_THRESHOLD = 2.0
SAFE_STOCK_LEVEL = 50.0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--company-id', type=int, default=None)
    parser.add_argument('--apply-restock', action='store_true')
    args = parser.parse_args()

    conn = get_connection()
    try:
        products = fetch_all_products(conn, args.company_id)
        low = []
        for p in products:
            inventory = float(p['inventory'] or 0)
            if inventory <= LOW_STOCK_THRESHOLD:
                low.append(p)
                insert_alert(conn, p['id'], 'Estoque Baixo')
        # aplicar restock se solicitado
        if args.apply_restock:
            for p in low:
                inv = float(p['inventory'] or 0)
                if inv <= NEAR_ZERO_THRESHOLD:
                    update_inventory(conn, p['id'], SAFE_STOCK_LEVEL)
                    insert_alert(conn, p['id'], 'Disponível')
        commit(conn)
        print(f"[Check] {len(low)} produtos com estoque <= {LOW_STOCK_THRESHOLD} (company_id={args.company_id})")
        for p in low:
            print(f" - id={p['id']} name={p['name']} inventory={p['inventory']}")
    except Exception as e:
        print(f"[Check] Erro: {e}")
        rollback(conn)
    finally:
        conn.close()


if __name__ == '__main__':
    main()