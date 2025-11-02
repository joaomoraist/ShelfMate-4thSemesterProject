import express from 'express';
import { GoogleGenAI } from '@google/genai';
import sql from '../db.js';

const SITE_META = {
  name: 'ShelfMate',
  repo: 'https://github.com/will-csc/ShelfMate-4thSemesterProject',
  frontend: { framework: 'React + Vite', hosting: 'Vercel' },
  backend: { runtime: 'Node.js', framework: 'Express', hosting: 'Render' },
  database: { engine: 'PostgreSQL', provider: 'Supabase Pooler (sslmode=require, porta 6543)' },
  auth: { session: 'express-session, SameSite="none" em produção com Secure' },
  routes: ['users', 'stats', 'imports', 'chat', 'health', 'home'],
  team: [
    { name: 'William Cesar', github: 'https://github.com/will-csc', linkedin: 'https://www.linkedin.com/in/william-cesar-7b7b89202/?locale=en_US' }
  ],
  structure: [
    'backend/src (routes: users, stats, imports, chat; db.js; index.js; openapi.json; public)',
    'frontend/src (pages: login, signup, forgot-password, home, statistics, products, reports, settings; components/ChatWidget; config/api.ts)',
    'ml-intelligence (scripts de estoque e simulação; integração futura)',
  ]
};

const router = express.Router();

// Chat proxy usando Gemini via @google/genai
router.post('/', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GOOGLE_API_KEY não configurado' });
    }

    const { message, conversation } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message é obrigatório' });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const ai = new GoogleGenAI({ apiKey });

    // Montar contexto com navegação e dados da empresa do usuário (se autenticado)
    const sessionUser = req.session && req.session.user ? req.session.user : null;
    const companyId = sessionUser && sessionUser.company_id ? Number(sessionUser.company_id) : null;

    let contextLines = [
      'Você é o assistente do ShelfMate e responde em português.',
      'Ajude o usuário a navegar: páginas disponíveis são Home, Statistics, Products, Reports e Settings.',
      'Explique caminhos como: Home (visão geral), Statistics (gráficos e métricas), Products (listar/editar/adicionar produtos), Reports (exportar relatórios), Settings (perfil e empresa).',
      `Projeto: ${SITE_META.name}. Repositório: ${SITE_META.repo}.`,
      `Stack: Frontend=${SITE_META.frontend.framework} (${SITE_META.frontend.hosting}); Backend=${SITE_META.backend.runtime}/${SITE_META.backend.framework} (${SITE_META.backend.hosting}); Banco=${SITE_META.database.engine} - ${SITE_META.database.provider}.`,
      `Autenticação: ${SITE_META.auth.session}. Rotas principais: ${SITE_META.routes.join(', ')}.`,
      `Estrutura: ${SITE_META.structure.join(' | ')}.`,
    ];

    if (sessionUser) {
      contextLines.push(`Usuário: ${sessionUser.name || sessionUser.email || 'desconhecido'} (empresa ${companyId ?? 'n/d'})`);
    }

    // Coletar métricas leves da empresa para dar contexto nas respostas
    if (companyId) {
      try {
        const userAgg = await sql`
          SELECT COALESCE(SUM(accesses),0) AS accesses_sum,
                 COALESCE(SUM(changes),0) AS changes_sum,
                 COALESCE(SUM(downloads),0) AS downloads_sum
          FROM users
          WHERE company_id = ${companyId}
        `;
        const productsCount = await sql`
          SELECT COUNT(*)::int AS products_count FROM products WHERE company_id = ${companyId}
        `;
        const alertsCount = await sql`
          SELECT COUNT(a.*)::int AS alerts_count
          FROM alerts a
          JOIN products p ON p.id = a.product_id
          WHERE p.company_id = ${companyId}
        `;
        const totalSold = await sql`
          SELECT COALESCE(SUM(s.qntd),0) AS total_qntd
          FROM products p
          LEFT JOIN sales s ON s.product_id = p.id
          WHERE p.company_id = ${companyId}
        `;
        const totalStockValue = await sql`
          SELECT COALESCE(SUM(p.inventory * p.unit_price),0) AS total_value
          FROM products p
          WHERE p.company_id = ${companyId}
        `;

        const metricsLine = `Métricas: acessos=${userAgg[0].accesses_sum}, alterações=${userAgg[0].changes_sum}, downloads=${userAgg[0].downloads_sum}, produtos=${productsCount[0].products_count}, alertas=${alertsCount[0].alerts_count}, vendas qntd total=${Number(totalSold[0].total_qntd)}, valor de estoque=${Number(totalStockValue[0].total_value)}.`;
        contextLines.push(metricsLine);
      } catch (mErr) {
        // Se falhar, seguimos sem métricas
      }
    }

    // Incorporar breve histórico (se fornecido pelo frontend) para manter o contexto da conversa
    if (Array.isArray(conversation) && conversation.length > 0) {
      try {
        const lastUserMsg = conversation.filter(m => m && m.role === 'user').slice(-1)[0];
        if (lastUserMsg && lastUserMsg.content) {
          contextLines.push(`Última pergunta anterior: ${String(lastUserMsg.content)}`);
        }
      } catch {}
    }

    // Integrantes conhecidos
    for (const member of SITE_META.team) {
      contextLines.push(`Integrante: ${member.name} | GitHub: ${member.github} | LinkedIn: ${member.linkedin}`);
    }

    // Prompt final combinando contexto e pergunta do usuário
    const promptText = `${contextLines.join('\n')}\nPergunta do usuário: ${message}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptText,
    });

    const text = response?.text || response?.response?.text?.() || '';
    return res.json({ reply: text });
  } catch (err) {
    console.error('Erro em POST /chat:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;