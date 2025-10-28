from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
import os

from .stock_alert_system import StockAlertSystem
from .db_utils import get_connection, fetch_all_products, update_inventory, insert_alert, commit, rollback


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


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ml-intelligence",
        "version": "0.1.0",
        "time": datetime.utcnow().isoformat() + "Z",
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


# Execução local: uvicorn ml-intelligence.app:app --reload --port 8001