import express from 'express';
import sql from '../db.js';

const router = express.Router();

// Rota de teste simples (não conecta ao banco)
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Rota funcionando!', 
    timestamp: new Date().toISOString(),
    status: 'OK',
    database: 'Supabase configurado'
  });
});

// Rota principal (requer banco de dados)
router.get('/', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM users`;
    res.json(result);
  } catch (error) {
    console.error('Erro de conexão com Supabase:', error.message);
    res.status(500).json({ 
      error: 'Erro ao conectar com o banco de dados',
      details: 'Verifique se a URL do Supabase está configurada corretamente',
      hint: 'Crie um arquivo .env com DATABASE_URL=sua_url_do_supabase'
    });
  }
});

export default router;
