# 🚀 Instruções para Testar o ShelfMate

## 📋 Pré-requisitos
- Node.js instalado
- Backend já deployado no Render

## 🔧 Configuração do Frontend

### 1. Instalar dependências
```bash
cd frontend
npm install
```

### 2. Executar o frontend localmente
```bash
npm run dev
```

O frontend será executado em: `http://localhost:5173`

## 🌐 URLs da API

O frontend está configurado para conectar com:
- **Backend no Render**: `https://shelfmate-4thsemesterproject.onrender.com`

## 🧪 Como Testar

### 1. Health Check
Acesse: `https://shelfmate-4thsemesterproject.onrender.com/health`

### 2. Testar no Frontend
1. Abra `http://localhost:5173`
2. Use os botões de navegação para testar todas as funcionalidades:
   - 🔐 **Login**: Teste com usuário existente
   - 📝 **Cadastro**: Crie um novo usuário
   - 🔑 **Esqueci a Senha**: Teste recuperação de senha
   - 🔄 **Redefinir Senha**: Teste o fluxo completo
   - 🏠 **Home**: Visualize dados do usuário logado

## 📊 Rotas Disponíveis no Backend

### Autenticação
- `POST /users/login` - Login
- `POST /users/register` - Cadastro
- `POST /users/send-reset-code` - Enviar código de recuperação
- `POST /users/verify-reset-code` - Verificar código
- `POST /users/reset-password` - Redefinir senha

### Sistema
- `GET /health` - Health check

## 🔧 Configurações

### Frontend (Vite)
- Porta: `5173`
- Host: `true` (aceita conexões externas)

### Backend (Render)
- CORS configurado para aceitar:
  - `http://localhost:5173`
  - `http://localhost:3000`
  - `https://shelfmate-4thsemesterproject.onrender.com`

## 🐛 Troubleshooting

### Se o frontend não conectar com o backend:
1. Verifique se o backend está online: `https://shelfmate-4thsemesterproject.onrender.com/health`
2. Verifique o console do navegador para erros de CORS
3. Confirme se a URL da API está correta em `frontend/src/config/api.ts`

### Se houver problemas de CORS:
- O backend já está configurado para aceitar requisições do frontend local
- Verifique se não há firewall bloqueando as requisições

## 📝 Dados de Teste

Para testar o cadastro, use um CNPJ válido ou deixe o padrão: `12345678000100`

## ✅ Status das Funcionalidades

- ✅ Login
- ✅ Cadastro
- ✅ Recuperação de senha
- ✅ Redefinição de senha
- ✅ Navegação entre páginas
- ✅ Persistência de dados no localStorage
- ✅ Interface responsiva
