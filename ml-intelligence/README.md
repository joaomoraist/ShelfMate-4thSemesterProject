# Sistema de Machine Learning - ShelfMate

Este módulo contém a lógica de machine learning para o sistema de alertas de estoque baixo do ShelfMate.

## Funcionalidades

- **Predição de Estoque**: Usa Random Forest para prever quando produtos ficarão sem estoque
- **Alertas Inteligentes**: Considera histórico de vendas e estoque atual
- **Classificação de Prioridade**: Alertas HIGH, MEDIUM e LOW baseados na urgência
- **Integração com API**: Busca dados diretamente do backend do ShelfMate

## Instalação

```bash
cd ml-intelligence
pip install -r requirements.txt
```

## Uso

### Executar Sistema de Alertas

```python
from stock_alert_system import StockAlertSystem

# Inicializar sistema
alert_system = StockAlertSystem(api_base_url="http://localhost:3000/api")

# Gerar alertas para um usuário
user_id = 1
alerts = alert_system.generate_alerts_for_user(user_id, alert_threshold_days=7)

print(alerts)
```

### Executar via linha de comando

```bash
python stock_alert_system.py
```

## Estrutura do Sistema

### Features Utilizadas

- **current_stock**: Estoque atual do produto
- **price**: Preço do produto
- **total_sold**: Total de unidades vendidas
- **avg_quantity_per_sale**: Média de quantidade por venda
- **sales_rate_per_day**: Taxa de vendas por dia
- **stock_to_sales_ratio**: Razão entre estoque e vendas
- **price_category**: Categoria de preço (baixo, médio, alto)

### Algoritmo

O sistema usa **Random Forest Regressor** para prever quantos dias restam até o estoque acabar, considerando:

1. Padrões históricos de venda
2. Sazonalidade implícita
3. Variabilidade nas vendas
4. Estoque atual

### Alertas

- **HIGH**: Produtos que podem acabar em ≤ 7 dias
- **MEDIUM**: Produtos que podem acabar em 8-14 dias  
- **LOW**: Produtos com estoque suficiente (> 14 dias)

## Integração com AWS

Este sistema foi projetado para ser facilmente deployado na AWS:

- **AWS Lambda**: Para execução serverless
- **Amazon S3**: Para armazenar modelos treinados
- **Amazon CloudWatch**: Para agendamento de execução
- **Amazon SES**: Para envio de alertas por email

## Arquivos

- `stock_alert_system.py`: Sistema principal de ML
- `requirements.txt`: Dependências Python
- `README.md`: Documentação