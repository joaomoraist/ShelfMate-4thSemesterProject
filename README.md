# ShelfMate – Projeto Semestral

Sistema completo para gestão de estoque, análise de vendas e geração de relatórios, com alertas inteligentes e integração de um serviço de ML.

## Visão Geral

- Frontend (React + Vite) para experiência do usuário, exporta relatórios em PDF.
- Backend (Node + Express) expõe APIs, autenticação por sessão e integração com banco (Supabase/Postgres).
- Módulo ML (FastAPI em Python) orquestra rotinas de vendas/reposição e emite alertas; envia e‑mail via SMTP (Gmail); fica responsável por toda parte de inteligência artificial (Machine Learning), como predição de demanda e alertas de estoque.
- Banco de dados com schema e dados fonte para provisionamento.
- Scripts e documentação auxiliares em `docs/`.

## Funcionalidades

- Autenticação e recuperação de senha com envio de código por e‑mail.
- Catálogo de produtos, estatísticas e relatórios (PDF) com contagem de exportações.
- Alertas de estoque baixo e reposição automática (serviço ML).
- Integrações de e‑mail: Resend (backend) e SMTP (módulo ML).

## Estrutura do Monorepo

- `frontend/` – Aplicação React + Vite.
- `backend/` – API Express, sessões, rotas de usuários e estatísticas.
- `ml-intelligence/` – Serviço FastAPI, orquestrador de tarefas e ML.
- `database/` – `schema.sql` e `source_data.txt` (parâmetros Supabase).
- `docs/` – Scripts `.bat` e materiais auxiliares.
- `appresentation/` – Imagens e assets de apresentação.

## Requisitos Principais

- Node.js 18+
- Python 3.10+
- TypeScript 4.9+
- Banco PostgreSQL

## Setup Rápido (Local)

1) Backend
- `cd backend`
- `npm install`
- Crie `backend/.env` com:
  - `DATABASE_URL=postgres://usuario:senha@host:5432/dbname`
  - `RESEND_API_KEY=chave_resend` (para envio de reset de senha)
- `npm start` (executa `node src/index.js`)
- Health: `http://localhost:3000/health` (ajuste porta conforme sua config)

2) Frontend
- `cd frontend`
- `npm install`
- `npm run dev`
- Por padrão, o frontend usa a API pública configurada em `src/config/api.ts` (`API_CONFIG.BASE_URL`). Para validar local, ajuste para `http://localhost:<PORTA_BACKEND>`.

3) Módulo ML
- `cd ml-intelligence`
- `pip install -r requirements.txt`
- Variáveis SMTP (Gmail) para enviar e‑mails (opcional):
  - `SMTP_HOST=smtp.gmail.com`
  - `SMTP_PORT=587`
  - `SMTP_USER=seu.email@gmail.com`
  - `SMTP_PASS=senha_de_app_do_gmail`
  - `SMTP_SENDER=seu.email@gmail.com`
- Execute o serviço: `uvicorn ml-intelligence.app:app --reload --port 8001`
- O orquestrador inicia dois loops (vendas e reposição) configuráveis por env:
  - `SALES_INTERVAL_SECONDS=60`
  - `RESTOCK_INTERVAL_SECONDS=120`
  - `SIM_COMPANY_ID=<id_da_empresa>`
- Health: `http://localhost:8001/health` (mostra últimos ciclos e intervals)

## Principais Endpoints

- Backend – `/users/*`:
  - `POST /users/login`
  - `POST /users/register`
  - `POST /users/send-reset-code`
  - `POST /users/reset-password`
  - `GET /users/me`
  - `POST /users/logout`
- Backend – `/stats/*`:
  - `GET /stats/overview`, `GET /stats/products-detailed`, etc.
  - `POST /stats/reports-exported` (incremento ao exportar PDF)
- ML – FastAPI:
  - `GET /health`
  - `POST /alerts/generate`
  - `POST /alerts/from-data`
  - `POST /low-stock/check`

## Deploy

- Backend: Render
- Frontend: Vercel
- ML: AWS (EC2/ECS/Lambda) rodando FastAPI; orquestração embutida.
- Banco: Supabase/Postgres gerenciado.

## Desenvolvimento

- Use `frontend/src/config/api.ts` para apontar o frontend ao backend (local vs produção).
- O export de PDF chama o incremento de relatório via `POST /stats/reports-exported` de forma não bloqueante.
- O módulo ML carrega variáveis também de `backend/.env` quando presente, facilitando reuso.

## Segurança

- Para Gmail SMTP, use senha de app (não use senha normal).