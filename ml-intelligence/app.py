from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime
import os
import threading
import time
import traceback

from .stock_alert_system import StockAlertSystem
from .db_utils import get_connection, fetch_all_products, update_inventory, insert_alert, commit, rollback
from .periodic_sales_random_restock import (
    perform_sales,
    perform_random_restock,
    check_low_stock_and_notify,
    get_low_stock_lines,
    send_email_summary,
    send_password_reset_email,
)
from .db_utils import fetch_company_user_emails, get_connection

class SalesRecord(BaseModel):
    product_id: int
    quantity: float
    sale_date: str

class ProductRecord(BaseModel):
    product_id: int
    product_name: str = Field(..., alias='name')
    price: float = Field(..., alias='unit_price')
    current_stock: float = Field(..., alias='inventory')


class AlertsFromDataRequest(BaseModel):
    sales: List[SalesRecord]
    products: List[ProductRecord]
    alert_threshold_days: int = 7


class LowStockCheckRequest(BaseModel):
    company_id: Optional[int] = None
    apply_restock: bool = False
    low_stock_threshold: float = 10.0
    near_zero_threshold: float = 2.0
    safe_stock_level: float = 50.0


class GenerateAlertsRequest(BaseModel):
    user_id: int
    alert_threshold_days: int = 7
    api_base_url: Optional[str] = None


app = FastAPI(title="ShelfMate ML Intelligence Service", version="0.1.0")

# ===========================
# Orquestrador de tarefas
# ===========================

SALES_INTERVAL_SECONDS = int(os.environ.get('SALES_INTERVAL_SECONDS', '60'))
RESTOCK_INTERVAL_SECONDS = int(os.environ.get('RESTOCK_INTERVAL_SECONDS', '120'))

_company_id_env = os.environ.get('SIM_COMPANY_ID')
try:
    COMPANY_ID = int(_company_id_env) if _company_id_env is not None else None
except ValueError:
    COMPANY_ID = None

_threads_started = False
_last_runs: Dict[str, str] = {
    "sales": "never",
    "restock": "never",
}


def _sales_loop():
    global _last_runs
    while True:
        conn = get_connection()
        try:
            cnt = perform_sales(conn, COMPANY_ID)
            low_cnt = check_low_stock_and_notify(conn, COMPANY_ID)
            _last_runs["sales"] = datetime.utcnow().isoformat() + "Z"
            print(f"[SalesLoop] vendas={cnt}, low_stock={low_cnt}")
        except Exception as e:
            print(f"[SalesLoop:ERR] {e}\n{traceback.format_exc()}")
            try:
                rollback(conn)
            except Exception:
                pass
        finally:
            try:
                conn.close()
            except Exception:
                pass
        time.sleep(SALES_INTERVAL_SECONDS)


def _restock_loop():
    global _last_runs
    while True:
        conn = get_connection()
        try:
            updates = perform_random_restock(conn, COMPANY_ID)
            low_cnt = check_low_stock_and_notify(conn, COMPANY_ID)
            _last_runs["restock"] = datetime.utcnow().isoformat() + "Z"
            print(f"[RestockLoop] atualizados={len(updates)}, low_stock={low_cnt}")
        except Exception as e:
            print(f"[RestockLoop:ERR] {e}\n{traceback.format_exc()}")
            try:
                rollback(conn)
            except Exception:
                pass
        finally:
            try:
                conn.close()
            except Exception:
                pass
        time.sleep(RESTOCK_INTERVAL_SECONDS)


@app.on_event("startup")
def _start_background_threads():
    global _threads_started
    if _threads_started:
        return
    print(f"[Orchestrator] Iniciando loops: sales={SALES_INTERVAL_SECONDS}s, restock={RESTOCK_INTERVAL_SECONDS}s, company_id={COMPANY_ID}")
    t1 = threading.Thread(target=_sales_loop, daemon=True)
    t2 = threading.Thread(target=_restock_loop, daemon=True)
    t1.start()
    t2.start()
    _threads_started = True


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ml-intelligence",
        "version": "0.1.0",
        "time": datetime.utcnow().isoformat() + "Z",
        "orchestrator": {
            "sales_interval_seconds": SALES_INTERVAL_SECONDS,
            "restock_interval_seconds": RESTOCK_INTERVAL_SECONDS,
            "last_runs": _last_runs,
            "company_id": COMPANY_ID,
        }
    }


@app.post("/alerts/from-data")
def alerts_from_data(payload: AlertsFromDataRequest):
    # Converter payload para DataFrames como esperado pelo StockAlertSystem
    import pandas as pd

    sales_df = pd.DataFrame([r.dict() for r in payload.sales])
    products_df = pd.DataFrame([{
        'product_id': p.product_id,
        'product_name': p.product_name,
        'price': p.price,
        'current_stock': p.current_stock,
    } for p in payload.products])

    ml = StockAlertSystem()
    features_df = ml.prepare_features(sales_df, products_df)
    if features_df.empty:
        return {"alerts": [], "message": "Dados insuficientes para gerar features"}

    # Treinar se necessário
    if ml.model is None:
        trained = ml.train_model(features_df)
        if not trained:
            return {"alerts": [], "message": "Dados insuficientes para treinar o modelo"}

    alerts_df = ml.predict_stockout_risk(features_df, alert_threshold_days=payload.alert_threshold_days)
    alerts = alerts_df.to_dict(orient='records') if not alerts_df.empty else []
    return {"alerts": alerts}


@app.post("/low-stock/check")
def low_stock_check(payload: LowStockCheckRequest):
    conn = get_connection()
    result: Dict[str, Any] = {"low_stock": [], "restocks": []}
    try:
        products = fetch_all_products(conn, payload.company_id)
        for p in products:
            inventory = float(p.get('inventory') or 0)
            if inventory <= payload.low_stock_threshold:
                result["low_stock"].append({
                    "id": p['id'],
                    "name": p['name'],
                    "inventory": inventory,
                })
                insert_alert(conn, p['id'], 'Estoque Baixo')

                if payload.apply_restock and inventory <= payload.near_zero_threshold:
                    update_inventory(conn, p['id'], payload.safe_stock_level)
                    insert_alert(conn, p['id'], 'Disponível')
                    result["restocks"].append({
                        "id": p['id'],
                        "name": p['name'],
                        "new_inventory": payload.safe_stock_level,
                    })
        commit(conn)
        return result
    except Exception as e:
        rollback(conn)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/alerts/generate")
def generate_alerts(req: GenerateAlertsRequest):
    api_url = req.api_base_url or os.environ.get('API_BASE_URL')
    if not api_url:
        raise HTTPException(status_code=400, detail="api_base_url não fornecida e API_BASE_URL ausente no ambiente")

    ml = StockAlertSystem(api_base_url=api_url)
    alerts_df = ml.generate_alerts_for_user(req.user_id, alert_threshold_days=req.alert_threshold_days)
    alerts = alerts_df.to_dict(orient='records') if not alerts_df.empty else []
    return {"alerts": alerts}


# ===========================
# Endpoints de disparo de e-mail pelo backend
# ===========================

class LowStockEmailRequest(BaseModel):
    recipient: Optional[EmailStr] = None
    company_id: Optional[int] = None


class PasswordResetEmailRequest(BaseModel):
    recipient: EmailStr
    code: str


@app.post("/notify/email/low-stock")
def notify_low_stock_email(req: LowStockEmailRequest):
    conn = get_connection()
    try:
        lines = get_low_stock_lines(conn, req.company_id)
        if not lines:
            return {"sent": False, "reason": "no_low_stock"}
        subject = f"[ShelfMate] {len(lines)} produtos com estoque baixo"
        recipients = []
        if req.company_id is not None:
            try:
                recipients = fetch_company_user_emails(conn, req.company_id)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Falha ao buscar e-mails da empresa: {e}")
        # Se um recipient específico foi informado, adiciona junto à lista da empresa
        if req.recipient:
            recipients = list({*(recipients or []), req.recipient})
        sent = send_email_summary(subject=subject, lines=lines, recipients=recipients if recipients else None)
        if not sent:
            raise HTTPException(status_code=502, detail="email_not_sent")
        return {"sent": True, "count": len(lines), "recipients": recipients}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/notify/email/password-reset")
def notify_password_reset(req: PasswordResetEmailRequest):
    try:
        sent = False
        # send_password_reset_email usa send_email_summary internamente
        send_password_reset_email(req.recipient, req.code)
        # Como send_password_reset_email não retorna, checar via envio direto também
        subject = "[ShelfMate] Código de recuperação de senha"
        lines = [
            "Você solicitou a recuperação de senha.",
            f"Seu código é: {req.code}",
            "Se não foi você, ignore este e-mail.",
        ]
        sent = send_email_summary(subject, lines, recipients=[req.recipient])
        if not sent:
            raise HTTPException(status_code=502, detail="email_not_sent")
        return {"sent": True}
    except HTTPException:
        # Propaga HTTPException como 502 quando e-mail não foi enviado
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PasswordResetByCodeRequest(BaseModel):
    code: str


@app.post("/notify/email/password-reset-by-code")
def notify_password_reset_by_code(req: PasswordResetByCodeRequest):
    conn = get_connection()
    try:
        # Buscar e-mail pelo código (uppercase para consistência com backend)
        with conn.cursor() as cur:
            cur.execute("SELECT email FROM users WHERE recovery_code = %s", (req.code.upper(),))
            row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="code_not_found")
        recipient = row[0]
        send_password_reset_email(recipient, req.code)
        return {"sent": True, "recipient": recipient}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# Execução local: uvicorn ml-intelligence.app:app --reload --port 8001