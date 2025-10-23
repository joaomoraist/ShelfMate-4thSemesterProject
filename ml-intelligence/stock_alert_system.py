"""
Sistema de Machine Learning para Alertas de Estoque Baixo
Considera vendas históricas e estoque atual para prever necessidade de reposição
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib
import requests
import os
from datetime import datetime, timedelta
import json

class StockAlertSystem:
    def __init__(self, api_base_url="http://localhost:3000/api"):
        self.api_base_url = api_base_url
        self.model = None
        self.feature_columns = []
        
    def fetch_sales_data(self, user_id):
        """Busca dados de vendas da API"""
        try:
            response = requests.get(f"{self.api_base_url}/sales/user/{user_id}")
            if response.status_code == 200:
                return pd.DataFrame(response.json())
            else:
                print(f"Erro ao buscar dados de vendas: {response.status_code}")
                return pd.DataFrame()
        except Exception as e:
            print(f"Erro na requisição: {e}")
            return pd.DataFrame()
    
    def fetch_products_data(self, user_id):
        """Busca dados de produtos da API"""
        try:
            response = requests.get(f"{self.api_base_url}/products/user/{user_id}")
            if response.status_code == 200:
                return pd.DataFrame(response.json())
            else:
                print(f"Erro ao buscar dados de produtos: {response.status_code}")
                return pd.DataFrame()
        except Exception as e:
            print(f"Erro na requisição: {e}")
            return pd.DataFrame()
    
    def prepare_features(self, sales_df, products_df):
        """Prepara features para o modelo de ML"""
        if sales_df.empty or products_df.empty:
            return pd.DataFrame()
        
        # Converter datas
        sales_df['sale_date'] = pd.to_datetime(sales_df['sale_date'])
        
        # Agrupar vendas por produto
        sales_summary = sales_df.groupby('product_id').agg({
            'quantity': ['sum', 'mean', 'std'],
            'sale_date': ['count', 'min', 'max']
        }).reset_index()
        
        # Flatten column names
        sales_summary.columns = ['product_id', 'total_sold', 'avg_quantity_per_sale', 
                               'std_quantity', 'total_sales', 'first_sale', 'last_sale']
        
        # Calcular dias desde primeira venda
        sales_summary['days_selling'] = (
            pd.to_datetime(sales_summary['last_sale']) - 
            pd.to_datetime(sales_summary['first_sale'])
        ).dt.days + 1
        
        # Taxa de vendas por dia
        sales_summary['sales_rate_per_day'] = sales_summary['total_sold'] / sales_summary['days_selling']
        
        # Merge com dados de produtos
        features_df = products_df.merge(sales_summary, on='product_id', how='left')
        
        # Preencher valores nulos para produtos sem vendas
        features_df = features_df.fillna({
            'total_sold': 0,
            'avg_quantity_per_sale': 0,
            'std_quantity': 0,
            'total_sales': 0,
            'days_selling': 1,
            'sales_rate_per_day': 0
        })
        
        # Features adicionais
        features_df['stock_to_sales_ratio'] = features_df['current_stock'] / (features_df['sales_rate_per_day'] + 1)
        features_df['price_category'] = pd.cut(features_df['price'], bins=3, labels=['low', 'medium', 'high'])
        features_df['price_category_encoded'] = features_df['price_category'].cat.codes
        
        # Calcular dias até estoque zero (target)
        features_df['days_until_stockout'] = np.where(
            features_df['sales_rate_per_day'] > 0,
            features_df['current_stock'] / features_df['sales_rate_per_day'],
            999  # Valor alto para produtos sem vendas
        )
        
        return features_df
    
    def train_model(self, features_df):
        """Treina o modelo de ML"""
        if features_df.empty:
            print("Não há dados suficientes para treinar o modelo")
            return False
        
        # Selecionar features para o modelo
        feature_cols = [
            'current_stock', 'price', 'total_sold', 'avg_quantity_per_sale',
            'std_quantity', 'total_sales', 'days_selling', 'sales_rate_per_day',
            'stock_to_sales_ratio', 'price_category_encoded'
        ]
        
        # Filtrar apenas produtos com vendas para treinar
        training_data = features_df[features_df['total_sold'] > 0].copy()
        
        if len(training_data) < 5:
            print("Dados insuficientes para treinar o modelo (mínimo 5 produtos com vendas)")
            return False
        
        X = training_data[feature_cols]
        y = training_data['days_until_stockout']
        
        # Dividir dados
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Treinar modelo
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model.fit(X_train, y_train)
        self.feature_columns = feature_cols
        
        # Avaliar modelo
        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        
        print(f"Modelo treinado com sucesso!")
        print(f"MAE: {mae:.2f} dias")
        print(f"RMSE: {rmse:.2f} dias")
        
        return True
    
    def predict_stockout_risk(self, features_df, alert_threshold_days=7):
        """Prediz risco de estoque baixo"""
        if self.model is None:
            print("Modelo não foi treinado ainda")
            return pd.DataFrame()
        
        if features_df.empty:
            return pd.DataFrame()
        
        # Fazer predições
        X = features_df[self.feature_columns]
        predictions = self.model.predict(X)
        
        # Adicionar predições ao DataFrame
        results = features_df.copy()
        results['predicted_days_until_stockout'] = predictions
        results['alert_priority'] = np.where(
            predictions <= alert_threshold_days, 'HIGH',
            np.where(predictions <= alert_threshold_days * 2, 'MEDIUM', 'LOW')
        )
        
        # Filtrar apenas alertas de alta e média prioridade
        alerts = results[results['alert_priority'].isin(['HIGH', 'MEDIUM'])].copy()
        alerts = alerts.sort_values('predicted_days_until_stockout')
        
        return alerts[['product_id', 'product_name', 'current_stock', 'sales_rate_per_day',
                      'predicted_days_until_stockout', 'alert_priority']]
    
    def generate_alerts_for_user(self, user_id, alert_threshold_days=7):
        """Gera alertas para um usuário específico"""
        print(f"Gerando alertas para usuário {user_id}...")
        
        # Buscar dados
        sales_df = self.fetch_sales_data(user_id)
        products_df = self.fetch_products_data(user_id)
        
        if sales_df.empty or products_df.empty:
            print("Dados insuficientes para gerar alertas")
            return pd.DataFrame()
        
        # Preparar features
        features_df = self.prepare_features(sales_df, products_df)
        
        # Treinar modelo se necessário
        if self.model is None:
            success = self.train_model(features_df)
            if not success:
                return pd.DataFrame()
        
        # Gerar alertas
        alerts = self.predict_stockout_risk(features_df, alert_threshold_days)
        
        return alerts
    
    def save_model(self, filepath):
        """Salva o modelo treinado"""
        if self.model is not None:
            model_data = {
                'model': self.model,
                'feature_columns': self.feature_columns
            }
            joblib.dump(model_data, filepath)
            print(f"Modelo salvo em {filepath}")
    
    def load_model(self, filepath):
        """Carrega modelo salvo"""
        try:
            model_data = joblib.load(filepath)
            self.model = model_data['model']
            self.feature_columns = model_data['feature_columns']
            print(f"Modelo carregado de {filepath}")
            return True
        except Exception as e:
            print(f"Erro ao carregar modelo: {e}")
            return False

def main():
    """Função principal para testar o sistema"""
    # Inicializar sistema
    alert_system = StockAlertSystem()
    
    # Exemplo de uso
    user_id = 1  # ID do usuário para teste
    alerts = alert_system.generate_alerts_for_user(user_id)
    
    if not alerts.empty:
        print("\n=== ALERTAS DE ESTOQUE BAIXO ===")
        print(alerts.to_string(index=False))
        
        # Salvar alertas em JSON
        alerts_json = alerts.to_json(orient='records', indent=2)
        with open('stock_alerts.json', 'w') as f:
            f.write(alerts_json)
        print("\nAlertas salvos em stock_alerts.json")
    else:
        print("Nenhum alerta gerado")

if __name__ == "__main__":
    main()