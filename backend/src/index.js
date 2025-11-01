import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import usersRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
import importsRoutes from './routes/imports.js';
import chatRoutes from './routes/chat.js';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// When running behind a proxy (Render, Heroku, etc.) Express needs
// to trust the first proxy for secure cookies to work correctly.
if (IS_PROD) {
  app.set('trust proxy', 1);
}

// Sessão simplificada: usa MemoryStore (apenas para manter dados do usuário entre páginas)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Para permitir cookies em requisições cross-site (frontend em localhost/Vercel -> backend Render),
    // usar SameSite: 'none' em ambos ambientes. Em produção, Secure: true; em dev, Secure: false.
    sameSite: 'none',
    secure: IS_PROD ? true : false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'https://shelfmate-4thsemesterproject.onrender.com',
      'https://shelfmate-4th-semester-project.vercel.app'
    ];
    const vercelRegex = /\.vercel\.app$/i;
    const renderRegex = /\.onrender\.com$/i;

    if (!origin) return callback(null, true); // same-origin or curl
    const hostname = (() => { try { return new URL(origin).hostname; } catch { return ''; } })();
    if (allowed.includes(origin) || vercelRegex.test(hostname) || renderRegex.test(hostname)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','x-company-id']
}));

// Logging middleware for all routes
app.use((req, res, next) => {
  const sessionUser = req.session && req.session.user ? req.session.user : null;
  const storedCompanyId = req.headers['x-company-id'] || (req.body && req.body.company_id) || (req.query && req.query.company_id);
  const who = sessionUser?.email || sessionUser?.name || (storedCompanyId ? `empresa ${storedCompanyId}` : 'desconhecido');
  const when = new Date().toLocaleString('pt-BR');
  console.log(`[LOG] Usuário ${who} passou na rota ${req.method} ${req.originalUrl} às ${when}`);
  next();
});
app.use(express.json());

// Static files (simple test pages for routes)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Rota de teste para verificar se o servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ============== ROTAS =================
// Swagger UI
const openapiPath = path.join(__dirname, 'openapi.json');
let openapiDoc = null;
try { openapiDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf-8')); } catch {}
if (openapiDoc) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
} else {
  console.warn('Swagger OpenAPI file not found or invalid');
}

app.use('/users', usersRoutes);
app.use('/stats', statsRoutes);
app.use('/imports', importsRoutes);
app.use('/chat', chatRoutes);

// Página inicial -> login.html (para facilitar testes)
app.get('/', (req, res) => {
  res.sendFile(path.join(staticDir, 'login.html'));
});

// Simple home endpoint to check session-based access
app.get('/home', (req, res) => {
  try {
    if (req.session && req.session.user) {
      return res.json({ message: 'Home OK', user: req.session.user });
    }
    return res.status(401).json({ error: 'Not authenticated' });
  } catch (err) {
    console.error('Erro em /home:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});