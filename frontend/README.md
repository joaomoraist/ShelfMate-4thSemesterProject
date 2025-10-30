# Frontend – ShelfMate

Aplicação React + Vite focada em usabilidade, relatórios e visualização de estatísticas.

## Stack
- `React`, `Vite`
- `TypeScript`
- `jspdf` e `jspdf-autotable` para exportar PDFs
- `chart.js` e `react-chartjs-2` para gráficos

## Setup
- `cd frontend`
- `npm install`
- Desenvolvimento: `npm run dev` (Vite)
- Build: `npm run build`
- Preview: `npm run preview`

## Configuração da API
- Arquivo: `src/config/api.ts`
- `API_CONFIG.BASE_URL` define a URL do backend.
  - Produção: `https://shelfmate-4thsemesterproject.onrender.com`
  - Local: ajuste para `http://localhost:<PORTA_BACKEND>` durante desenvolvimento
- Principais endpoints mapeados em `API_CONFIG.ENDPOINTS/*`.

## Páginas
- `pages/reports.tsx` – exporta relatórios (PDF) e chama incremento em `/stats/reports-exported` (não bloqueante).
- `pages/forgot-password.tsx` – fluxo unificado: código de verificação, nova senha, confirmar nova senha.
- `home.tsx` e demais páginas em `src/pages/`.

## Imagens e Assets
- Em `public/` (ex.: `reports.png`, `forget-password.png`).
- Fotos de usuário: `backend/src/public/user_photos/`.

## Dicas
- Ajuste o BASE_URL da API conforme ambiente.
- Erros e feedbacks são exibidos na UI com toasts/diálogos.