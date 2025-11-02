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

## Integração SMTP (Gmail)

O módulo `periodic_sales_random_restock.py` envia e-mails via **SMTP (Gmail)** quando as variáveis de ambiente abaixo estão configuradas. Caso não estejam, o envio é pulado e o conteúdo é logado no console.

### Variáveis de Ambiente

- `SMTP_HOST` (default: `smtp.gmail.com`)
- `SMTP_PORT` (default: `587`)
- `SMTP_USER` (e-mail do remetente/Gmail)
- `SMTP_PASS` (senha de app do Gmail)
- `SMTP_SENDER` (opcional; por padrão usa `SMTP_USER`)
- `SMTP_RECIPIENTS` (lista de destinatários separada por vírgula)

### Exemplo `.env`

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu.email@gmail.com
SMTP_PASS=senha_de_app_do_gmail
SMTP_SENDER=seu.email@gmail.com
SMTP_RECIPIENTS=dest1@exemplo.com,dest2@exemplo.com
```

> Dica: para Gmail, crie uma **senha de app** em Conta Google → Segurança → Senhas de app. O login com senha comum não funciona para SMTP.

## Endpoints de Notify (backend → ML)

O backend pode solicitar ao serviço de ML que envie e-mails para destinatários específicos. Os endpoints usam a configuração SMTP acima.

- `POST /notify/email/low-stock`
  - Body:
    ```json
    { "recipient": "dest@exemplo.com", "company_id": 1 }
    ```
  - Comportamento: calcula produtos com estoque baixo para `company_id` (ou geral se ausente) e envia um resumo para o `recipient`.
  - Respostas:
    - `{ "sent": true, "count": 3 }`
    - `{ "sent": false, "reason": "no_low_stock" }`

- `POST /notify/email/password-reset`
  - Body:
    ```json
    { "recipient": "dest@exemplo.com", "code": "123456" }
    ```
  - Comportamento: envia e-mail simples com o código de recuperação.
  - Resposta: `{ "sent": true }`

- `POST /notify/email/password-reset-by-code`
  - Body:
    ```json
    { "code": "ABCDEF1234..." }
    ```
  - Comportamento: o ML busca o e-mail em `users.recovery_code` (banco Postgres) pelo `code` e envia o e-mail de recuperação usando SMTP.
  - Respostas:
    - `{ "sent": true, "recipient": "user@dominio.com" }`
    - Erros:
      - `404 code_not_found` se o código não existir.

Observações:
- É necessário configurar `SMTP_USER` e `SMTP_PASS` (senha de app do Gmail) e opcionalmente `SMTP_SENDER`.
- `SMTP_RECIPIENTS` pode ficar vazio quando o backend fornece o `recipient` por requisição.

## Fluxo automático de baixo estoque

- O serviço `ml-intelligence/app.py` orquestra vendas e reposição em background.
- Após cada operação, o ML verifica estoque e:
  - Envia e-mail automático (via SMTP) se houver produtos com estoque ≤ `LOW_STOCK_THRESHOLD`.
  - Atualiza o status do produto:
    - `Esgotado` quando o estoque chega a 0.
    - `Estoque Baixo` quando o estoque está abaixo do limiar mas > 0.
    - `Disponível` quando ocorre reposição aleatória.
- Variáveis úteis:
  - `LOW_STOCK_THRESHOLD` (default `10`)
  - `SALES_INTERVAL_SECONDS`, `RESTOCK_INTERVAL_SECONDS`, `SIM_COMPANY_ID`

### Limite dinâmico de estoque baixo

- O limiar de baixo estoque é calculado por produto com base na **média diária de vendas**.
- Fórmula: `threshold = max(LOW_STOCK_THRESHOLD, daily_avg * DYNAMIC_LOW_STOCK_MULTIPLIER)`
- Configuração:
  - `DYNAMIC_LOW_STOCK_MULTIPLIER` (default `1.33`) — ex.: média de 300 ⇒ limiar ~ 400
- Comportamentos ajustados:
  - Status quando estoque = 0: `Estoque Zerado` (em vez de `Esgotado`)
  - Produtos com `Estoque Zerado` não recebem novas vendas no simulador/loop automático.

## Arquivos

- `stock_alert_system.py`: Sistema principal de ML
- `requirements.txt`: Dependências Python
- `README.md`: Documentação