# Roteiro de Vídeo — ShelfMate (3 integrantes, até 6 minutos)

> Objetivo: apresentar contexto, arquitetura, implantação em nuvem e uma demo rápida do ShelfMate em até 6 minutos.

## Estrutura e tempo
- 0:00–0:30 Abertura e equipe (William)
- 0:30–1:15 Problema e objetivo (João)
- 1:15–2:15 Arquitetura e implantação (WIlliam)
- 2:15–3:30 Funcionalidades principais (João)
- 3:30–5:30 Demo guiada (Eduardo)
- 5:30–6:00 Resultados e próximos passos (João)

---

## 0:00–0:30 Abertura e equipe
- Fala: “Olá! Meu nome é William, estou com João e Eduardo, e este é o nosso projeto do 4° semestre, ShelfMate, solução de gestão de estoque e vendas com alertas inteligentes.”
- Mostrar: logo/identidade do projeto (`frontend/public/logo.png`).
- Divisão: brevemente diga quem cobre arquitetura/implantações, funcionalidades e a demo.

## 0:30–1:15 Problema e objetivo
- Fala: “Pequenos comércios sofrem com ruptura de estoque e baixa visibilidade. O ShelfMate centraliza produtos e vendas, gera relatórios e alerta estoque baixo de forma proativa.”
- Pontos rápidos:
  - Reduz ruptura e melhora previsibilidade.
  - Decisões guiadas por dados (relatórios e estatísticas).
  - Alertas automáticos com módulo de inteligência.

## 1:15–2:15 Arquitetura e implantação
- Visão modular do repo:
  - Frontend (`frontend/`): Vite + React + TypeScript; páginas e componentes em `src/`.
  - Backend (`backend/src/`): Node.js + Express; camadas `controllers`, `services`, `repositories`, `routes`; API documentada em `openapi.json`.
  - Banco (`database/`): esquema SQL em `schema.sql`.
  - Inteligência (`ml-intelligence/`): scripts Python para alertas, simulações e rotinas periódicas.
- Implantação e nuvem (destaques principais):
  - Backend na Render: serviço Node/Express, build automático; usar variável `RENDER_API_URL` (não expor segredos). [Inserir URL do serviço]
  - Frontend na Vercel: deploy contínuo; integra com API via `VITE_API_URL` apontando para a Render. [Inserir URL do site]
  - Banco no Supabase: Postgres gerenciado, autenticação/controle; conexão via `DATABASE_URL`/credenciais seguras.
  - Inteligência/ML na AWS: execução de scripts (EC2/Lambda) consumindo o banco e gerando alertas; logs/monitoramento (CloudWatch) e armazenamento (S3) quando necessário.
- Segurança e configurações:
  - Variáveis de ambiente em cada provedor (Render, Vercel, Supabase, AWS).
  - Não commitar segredos; usar `.env` local e painéis de secrets.

## 2:15–3:45 Funcionalidades principais
- Autenticação e sessão: login, controle de acesso, último acesso.
- Gestão de produtos: cadastro, edição, filtro e busca.
- Vendas e relatórios: registro de vendas, estatísticas e relatórios.
- Alertas de estoque baixo: identificação de itens críticos e sugestão de reposição.
- Configurações: preferências do usuário e parâmetros de operação.

## 3:45–5:30 Demo guiada (foco em produção)
- Dica: ritmo ágil; 20–30s por tela; usar ambientes em nuvem.

1) Acesso ao site na Vercel (20s)
- Fala: “Entramos no site publicado na Vercel.”
- Mostrar: URL pública do frontend. Login com usuário de teste.

2) Home e navegação (25s)
- Fala: “Home com atalhos para Produtos, Vendas, Relatórios e Alertas.”
- Mostrar: ícones e menu (ex.: `public/home_white.png`, `products.png`, `reports.png`).

3) Produtos: cadastro e filtro (30s)
- Fala: “Cadastro/edição de produto, filtros e busca.”
- Ação: cadastrar/editar item; usar busca (`public/product-filter.png`, `search.png`).
- Bastidores: operação bate na API da Render que persiste no Supabase.

4) Vendas e estatísticas (30s)
- Fala: “Registro de venda e impacto em estatísticas.”
- Ação: registrar venda; conferir atualização em relatórios (`public/sales.png`, `statistcs.png`).

5) Alertas de estoque (30s)
- Fala: “Alertas indicam itens próximos da ruptura para reposição.”
- Mostrar: visual de alertas (`public/alerts-red.png`, `alerts-blue.png`).
- Bastidores: módulo na AWS consulta estoque no Supabase e publica alertas.

6) Backend e API (25s)
- Fala: “API documentada em `openapi.json`.”
- Ação: mostrar rota chave (ex.: GET produtos) usando Swagger/Postman apontando para a Render. [Inserir base URL]

7) Supabase e monitoramento (20s)
- Fala: “Banco gerenciado no Supabase, com painéis e segurança.”
- Mostrar: visão rápida do dashboard/tabelas atualizadas.

8) Inteligência/ML na AWS (30s)
- Fala: “Scripts de alerta e simulação em execução na nuvem.”
- Mostrar: logs CloudWatch ou evidência de execução; se necessário, rodar local: `cd ml-intelligence && python stock_alert_system.py`.

## 5:30–6:00 Resultados e próximos passos
- Benefícios:
  - Menos rupturas, operação mais previsível, visão centralizada.
- Técnicos:
  - Arquitetura modular, API documentada, deploy multi-cloud (Render, Vercel, Supabase, AWS).
- Próximos passos:
  - Dashboards avançados, notificações push, previsão com modelos ML, melhoria de CI/CD.
- Encerramento:
  - Fala: “Obrigado! O ShelfMate está pronto para apoiar a gestão de estoque e vendas.”

---

## Checklist antes de gravar
- Produção online:
  - Backend (Render): serviço ativo e base URL acessível.
  - Frontend (Vercel): site publicado e variáveis configuradas (`VITE_API_URL`).
  - Banco (Supabase): tabelas criadas conforme `database/schema.sql`, credenciais válidas.
  - Inteligência (AWS): job/script agendado ou acesso para demonstrar logs e execução.
- Variáveis de ambiente (exemplos):
  - `RENDER_API_URL`, `VITE_API_URL`, `DATABASE_URL`/`SUPABASE_URL` e `SUPABASE_KEY`, `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (nunca mostrar em vídeo).
- Fallback local (se algum serviço cair):
  - Backend: `cd backend && npm install && npm start`
  - Frontend: `cd frontend && npm install && npm run dev`
  - Inteligência: `cd ml-intelligence && pip install -r requirements.txt && python stock_alert_system.py`

## Dicas rápidas de gravação
- Use OBS/Screen Recorder, áudio limpo e fonte legível.
- Insira dados fictícios realistas para produtos e vendas.
- Cronometre cada parte e ensaie trocas entre integrantes.
- Foque nas telas e nos pontos de implantação; evite detalhes supérfluos.