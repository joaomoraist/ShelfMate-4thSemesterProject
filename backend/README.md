# Backend – ShelfMate

API em Node.js + Express responsável por autenticação, estatísticas, importações e integração com banco de dados.

## Stack
- `express`, `postgres`/`pg`
- `express-session` com armazenamento em Postgres
- `dotenv` para variáveis de ambiente
- Envio de e‑mail de recuperação via **Resend**

## Setup
- `cd backend`
- `npm install`
- Crie `backend/.env` com:
  - `DATABASE_URL=postgres://usuario:senha@host:5432/dbname`
  - `SESSION_SECRET=algum_segredo_seguro`
  - `RESEND_API_KEY=chave_resend`
- Iniciar: `npm start` (executa `node src/index.js`)
- Health: `http://localhost:3000/health` (ajuste porta conforme sua infra)
 - Docs (Swagger UI): `http://localhost:3000/api-docs`

## Estrutura
- `src/index.js` – bootstrap do servidor, sessões, static e registro de rotas
- `src/db.js` – conexão com banco Postgres
- `src/routes/users.js` – login, cadastro e recuperação de senha
- `src/routes/stats.js` – estatísticas, produtos e incremento de relatórios exportados
- `src/services/` – regras de negócio (ex.: `productsService.js`)
- `src/repositories/` – acesso ao banco (ex.: `productsRepository.js`)
- `src/openapi.json` – especificação OpenAPI para documentação Swagger
- `src/public/` – assets estáticos (ex.: imagens de perfil)

## Endpoints Principais
- `POST /users/login`
- `POST /users/register`
- `POST /users/send-reset-code` – gera e envia código via Resend
- `POST /users/reset-password` – valida código e altera senha
- `GET /users/me` – dados da sessão
- `POST /users/logout`

- `GET /stats/overview`
- `GET /stats/products-detailed`
- `POST /stats/reports-exported` – incrementa `reports_exported` (tabela `companies`)

## Observações
- O login atual compara senha diretamente; considere usar `bcrypt` em produção.
- Erros são tratados com middleware global e respostas JSON consistentes.