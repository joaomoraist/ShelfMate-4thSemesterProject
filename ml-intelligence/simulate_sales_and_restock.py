"""
Simulador de vendas e monitoramento de estoque
- Insere vendas de todos os produtos a cada 15 segundos
- Verifica estoque baixo e cria alerta
- Se estoque estiver quase zerado, repõe para um nível seguro
"""
import os
import time
import random
from datetime import datetime
from dotenv import load_dotenv
from db_utils import get_connection, fetch_all_products, insert_sale, update_inventory, insert_alert, commit, rollback

# Configurações
SALE_INTERVAL_SECONDS = 15
LOW_STOCK_THRESHOLD = float(os.environ.get('LOW_STOCK_THRESHOLD', 10))
NEAR_ZERO_THRESHOLD = float(os.environ.get('NEAR_ZERO_THRESHOLD', 2))
SAFE_STOCK_LEVEL = float(os.environ.get('SAFE_STOCK_LEVEL', 50))

# Tentar carregar variáveis do backend/.env se existirem
BACKEND_ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
if os.path.exists(BACKEND_ENV_PATH):
    load_dotenv(BACKEND_ENV_PATH)
else:
    load_dotenv()

COMPANY_ID = os.environ.get('SIM_COMPANY_ID')  # Opcional, restringe a uma empresa
if COMPANY_ID is not None:
    try:
        COMPANY_ID = int(COMPANY_ID)
    except ValueError:
        COMPANY_ID = None


def simulate_sales_and_monitor():
    conn = get_connection()
    print(f"[Simulator] Iniciado às {datetime.now().isoformat()} | Intervalo: {SALE_INTERVAL_SECONDS}s")
    try:
        while True:
            try:
                products = fetch_all_products(conn, COMPANY_ID)
                if not products:
                    print("[Simulator] Sem produtos para processar.")
                    time.sleep(SALE_INTERVAL_SECONDS)
                    continue

                for p in products:
                    pid = p['id']
                    name = p['name']
                    price = float(p['unit_price'] or 0)
                    inventory = float(p['inventory'] or 0)

                    # Se sem estoque, apenas checar reposição segura
                    if inventory <= 0:
                        # Reposição se estiver abaixo do limiar "quase zero"
                        if inventory <= NEAR_ZERO_THRESHOLD:
                            update_inventory(conn, pid, SAFE_STOCK_LEVEL)
                            insert_alert(conn, pid, 'RESTOCK_APPLIED')
                            print(f"[Restock] Produto {name} (id={pid}) sem estoque. Reposto para {SAFE_STOCK_LEVEL}.")
                        continue

                    # Gerar quantidade de venda realismamente limitada pelo estoque
                    max_q = max(1, min(int(inventory), 5))  # no máximo 5 ou estoque atual
                    qntd = random.randint(1, max_q)

                    # Valor da venda baseado no unit_price
                    value = round(qntd * price, 2)

                    # Inserir venda
                    insert_sale(conn, pid, qntd, value)

                    # Atualizar estoque do produto
                    new_inventory = max(0.0, inventory - qntd)
                    update_inventory(conn, pid, new_inventory)

                    # Checar e criar alerta de estoque baixo
                    if new_inventory <= LOW_STOCK_THRESHOLD:
                        insert_alert(conn, pid, 'LOW_STOCK')
                        print(f"[Alert] Produto {name} (id={pid}) com estoque baixo: {new_inventory}")

                    # Reposição segura se quase zerado
                    if new_inventory <= NEAR_ZERO_THRESHOLD:
                        update_inventory(conn, pid, SAFE_STOCK_LEVEL)
                        insert_alert(conn, pid, 'RESTOCK_APPLIED')
                        print(f"[Restock] Produto {name} (id={pid}) quase zerado ({new_inventory}). Reposto para {SAFE_STOCK_LEVEL}.")

                # Commit das operações do ciclo
                commit(conn)
                print(f"[Simulator] Ciclo concluído às {datetime.now().strftime('%H:%M:%S')} | Produtos processados: {len(products)}")
            except Exception as err:
                print(f"[Simulator] Erro no ciclo: {err}")
                rollback(conn)

            # Aguardar próximo ciclo
            time.sleep(SALE_INTERVAL_SECONDS)
    finally:
        conn.close()


if __name__ == '__main__':
    simulate_sales_and_monitor()