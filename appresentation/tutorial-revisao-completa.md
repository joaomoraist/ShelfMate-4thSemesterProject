# Tutorial & Revisão Completa — ShelfMate

> Objetivo: garantir que os 3 integrantes conheçam o projeto “de cor”, cobrindo execução local, implantação na nuvem, estrutura do repositório, variáveis de ambiente e comandos essenciais.

## Visão Geral do Projeto
- Solução de gestão de estoque e vendas com alertas inteligentes.
- Arquitetura modular: Frontend (Vercel), Backend (Render), Banco (Supabase), Inteligência/ML (AWS).
- Fluxo de dados:
  - Frontend chama API do Backend.
  - Backend persiste e consulta dados no Supabase (Postgres gerenciado).
  - Módulo de Inteligência/ML lê o banco e publica alertas (e simula cenários quando necessário).

## Estrutura de Pastas
- `appresentation/`: materiais de apresentação (roteiros, tutorial).
- `backend/`: API Node.js + Express.
  - `src/controllers/`: lógica de entrada das rotas.
  - `src/services/`: regras de negócio.
  - `src/repositories/`: acesso a dados.
  - `src/routes/`: definição de endpoints.
  - `src/utils/`: utilitários.
  - `src/db.js`: conexão com banco.
  - `src/openapi.json`: documentação da API.
- `database/`: esquema e dados de exemplo.
  - `schema.sql`: criação de tabelas/relacionamentos.
- `docs/`: scripts e documentação auxiliar (setup, atualização).
- `frontend/`: Vite + React + TypeScript.
  - `src/`: componentes, páginas, serviços e estilos.
  - `public/`: assets (ícones, imagens).
  - `vercel.json`: config de deploy.
- `ml-intelligence/`: scripts Python (alertas, simulação, automações).
  - `stock_alert_system.py`, `simulate_sales_and_restock.py`, etc.

---

## Execução Local (Windows)
rodar tudo localmente sem depender da nuvem.

### 1) Banco de Dados Local
- Instale Postgres (ou use um container local, se preferir).
- Crie um banco (ex.: `shelfmate_local`).
- Aplique o esquema:
  - `psql -U <usuario> -d shelfmate_local -f database/schema.sql`
- Obtenha a `DATABASE_URL` local (formato):
  - `postgresql://<usuario>:<senha>@localhost:5432/shelfmate_local`

### 2) Backend Local
- Acesse a pasta:
  - `cd backend`
- Instale dependências:
  - `npm install`
- Configure variáveis de ambiente (crie `.env`):
  - `PORT=3001`
  - `DATABASE_URL=postgresql://<usuario>:<senha>@localhost:5432/shelfmate_local`
- Inicie o servidor:
  - `npm start`
- Verifique: `http://localhost:3001/` e rotas em `openapi.json`.

### 3) Frontend Local
- Acesse a pasta:
  - `cd frontend`
- Instale dependências:
  - `npm install`
- Configure variáveis (crie `.env` ou `.env.local`):
  - `VITE_API_URL=http://localhost:3001`
- Inicie o dev server:
  - `npm run dev`
- Acesse a UI: `http://localhost:5173/`.

### 4) Inteligência/ML Local
- Acesse a pasta:
  - `cd ml-intelligence`
- Instale dependências:
  - `pip install -r requirements.txt`
- Configure acesso ao banco (via `.env` ou parâmetros do script):
  - `DATABASE_URL=postgresql://<usuario>:<senha>@localhost:5432/shelfmate_local`
- Execute um script de alerta (exemplos):
  - `python stock_alert_system.py`
  - `python simulate_sales_and_restock.py`

---

## Execução em Nuvem (Produção)
> Meta: publicar cada módulo e integrar tudo com variáveis seguras.

### Backend — Render
- Tipo de serviço: Web Service (Node.js).
- Build e start:
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Root: pasta `backend/`.
- Variáveis (no painel da Render):
  - `PORT=3001` (Render costuma gerenciar, ajuste conforme necessário)
  - `DATABASE_URL=<url_postgres_supabase>`
  - `JWT_SECRET=<segredo>` (se aplicável)
- Obtenha a URL pública (ex.: `https://shelfmate-api.onrender.com`).

### Frontend — Vercel
- Projeto importado do repositório, Root: `frontend/`.
- Build:
  - Framework: Vite + React.
  - Automatic (Vercel detecta).
- Variáveis (no painel da Vercel):
  - `VITE_API_URL=https://shelfmate-api.onrender.com` (ajuste para sua URL)
- Obtenha a URL pública (ex.: `https://shelfmate.vercel.app`).

### Banco — Supabase
- Crie projeto Supabase (Postgres gerenciado).
- Configure tabelas com `database/schema.sql` (via SQL editor do painel).
- Use credenciais de conexão Postgres (Connection string) para o Backend/ML:
  - `DATABASE_URL=postgresql://<usuario>:<senha>@<host>:5432/<db>`
- Não exponha chaves no frontend (use somente endpoints do Backend).

### Inteligência/ML — AWS
- Opções de execução:
  - `EC2`: instância rodando scripts Python de forma contínua/cron.
  - `Lambda`: funções disparadas por eventos ou agendamentos (CloudWatch Events).
- Configurações:
  - Variáveis: `DATABASE_URL`, e chaves de acesso se usar serviços AWS (S3/CloudWatch).
  - Logs e monitoramento: CloudWatch.
- Fluxo:
  - Script lê o Supabase (Postgres), calcula estoque crítico, publica alertas no sistema (via DB/API).

---

## Variáveis de Ambiente (Guia de Consistência)
- `DATABASE_URL`: conexão Postgres (local ou Supabase) — usada por Backend e ML.
- `VITE_API_URL`: base da API — usada pelo Frontend.
- `PORT`: porta do Backend (local), Render pode definir automaticamente.
- `JWT_SECRET` (se aplicável): segredo para tokens.
- Em nuvem, definir nos painéis de cada provedor; nunca commitar segredos.

## Comandos Essenciais
- Backend:
  - `cd backend && npm install && npm start`
- Frontend:
  - `cd frontend && npm install && npm run dev`
- Banco:
  - `psql -U <usuario> -d <db> -f database/schema.sql`
- Inteligência:
  - `cd ml-intelligence && pip install -r requirements.txt && python stock_alert_system.py`

## Workflows Comuns
- Desenvolvimento:
  - Rodar Backend e Frontend localmente usando `.env`.
  - Popular banco com `schema.sql` e inserir dados de teste.
- Teste de API:
  - Usar `openapi.json` e Postman/Swagger para validar rotas.
- Deploy:
  - Backend na Render, Frontend na Vercel, ajustar `VITE_API_URL`.
  - Confirmar que o Frontend consome a API da Render e que a API acessa o Supabase.
- Observabilidade:
  - Ver logs do Backend (Render) e scripts ML (CloudWatch).

## Troubleshooting Rápido
- Frontend não conecta: verificar `VITE_API_URL` e CORS no Backend.
- Backend não inicia: conferir `DATABASE_URL`, migrações/tabelas existentes, porta.
- Supabase sem dados: aplicar `schema.sql` e checar permissões/roles.
- ML sem alertas: validar credenciais, conexão com banco e condições de estoque baixo.

## Revisão/Quiz para a Equipe
- Qual é o fluxo de dados completo (Frontend → Backend → Banco → ML)?
- Onde cada módulo está implantado (Render, Vercel, Supabase, AWS)?
- Quais variáveis de ambiente o Frontend e o Backend usam?
- Como rodar tudo localmente e quais portas/URLs usar?
- Onde está a documentação da API e como testá-la?
- Como os scripts de inteligência interagem com o banco e geram alertas?
- O que fazer se a API mudar de URL na nuvem?

## Checklists Finais
- Produção:
  - Backend (Render) online e acessível.
  - Frontend (Vercel) online com `VITE_API_URL` correta.
  - Supabase com tabelas criadas e acesso OK.
  - ML na AWS com logs visíveis e job ativo.
- Local:
  - `.env` configurados.
  - Banco local com `schema.sql` aplicado.
  - Frontend abre e consome `http://localhost:3001`.
  - Scripts Python conseguem ler/escrever no banco.

