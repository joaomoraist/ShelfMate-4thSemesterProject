import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import usersRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
import importsRoutes from './routes/imports.js';
import session from 'express-session';
import pg from 'pg';
import connectPgSimple from 'connect-pg-simple';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// When running behind a proxy (Render, Heroku, etc.) Express needs
// to trust the first proxy for secure cookies to work correctly.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Session store setup (Postgres)
const PgSession = connectPgSimple(session);
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(session({
  store: new PgSession({ pool: pgPool }),
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // require HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://shelfmate-4thsemesterproject.onrender.com'
    ];
    const vercelRegex = /\.vercel\.app$/i;

    if (!origin) return callback(null, true); // same-origin or curl
    if (allowed.includes(origin) || vercelRegex.test(new URL(origin).hostname)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
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
app.use('/users', usersRoutes);
app.use('/stats', statsRoutes);
app.use('/imports', importsRoutes);

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