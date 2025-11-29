import express from 'express';
import { GoogleGenAI } from '@google/genai';
import sql from '../db.js';
import { getRequirementsText } from '../utils/requirementsLoader.js';
import { getDocsDigest } from '../utils/docsLoader.js';

const SITE_META = {
  name: 'ShelfMate',
  repo: 'https://github.com/will-csc/ShelfMate-4thSemesterProject',
  frontend: { framework: 'React + Vite', hosting: 'Vercel' },
  backend: { runtime: 'Node.js', framework: 'Express', hosting: 'Render' },
  database: { engine: 'PostgreSQL', provider: 'Supabase Pooler (sslmode=require, porta 6543)' },
  auth: { session: 'express-session, SameSite="none" em produção com Secure' },
  routes: ['users', 'stats', 'imports', 'chat', 'health', 'home'],
  team: [
    { name: 'Eduardo Oliveira', github: 'https://github.com/EduardoOLSLRT', linkedin: 'https://www.linkedin.com/in/eduardooliveira1706' },
    { name: 'João Morais', github: 'https://github.com/joaomoraist', linkedin: 'https://www.linkedin.com/in/jo%C3%A3o-morais-t?trk=blended-typeahead' },
    { name: 'William Cesar', github: 'https://github.com/will-csc', linkedin: 'https://www.linkedin.com/in/william-cesar-7b7b89202/?locale=en_US' },
  ],
  structure: [
    'backend/src (routes: users, stats, imports, chat; db.js; index.js; openapi.json; public)',
    'frontend/src (pages: login, signup, forgot-password, home, statistics, products, reports, settings; components/ChatWidget; config/api.ts)',
    'ml-intelligence (scripts de estoque e simulação; integração futura)',
  ]
};

const router = express.Router();

function sanitizeReply(text) {
  if (!text) return '';
  let t = String(text);
  // Remover markdown básico: **negrito**, *itálico*, listas e cabeçalhos
  t = t.replace(/\*\*+/g, '');
  t = t.replace(/(^|\n)[\s]*[\-*]\s+/g, '$1');
  t = t.replace(/(^|\n)#{1,6}\s+/g, '$1');
  // Remover persona e frases padrão (mas manter cumprimentos curtos)
  t = t.replace(/Sou seu assistente ShelfMate\.?/gi, '');
  t = t.replace(/Como posso ajudar você a navegar[^\n]*\n*/gi, '');
  // Espaços extras
  t = t.replace(/[\t\r]+/g, ' ');
  t = t.replace(/\n{3,}/g, '\n\n');

  // Traduzir slugs de páginas para nomes em português, exceto em linhas NAVIGATE:
  const SLUG_TO_PT = {
    'login': 'Login',
    'signup': 'Cadastro',
    'forgot-password': 'Esqueci a Senha',
    'home': 'Início',
    'statistics': 'Estatísticas',
    'products': 'Produtos',
    'add-product': 'Adicionar Produto',
    'reports': 'Relatórios',
    'settings': 'Configurações',
  };
  const lines = t.split('\n');
  const processed = lines.map((line) => {
    if (/^\s*NAVIGATE:/i.test(line)) return line; // preservar marcador
    let l = line;
    for (const [slug, name] of Object.entries(SLUG_TO_PT)) {
      const re = new RegExp(`\\b${slug}\\b`, 'gi');
      l = l.replace(re, name);
    }
    return l;
  });
  t = processed.join('\n');
  return t.trim();
}

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

    // Fallback rápido para cumprimentos simples (evita respostas vazias)
    const isGreetingOnly = /^\s*(oi|ol[áa]|ola|bom dia|boa tarde|boa noite)\s*[!.]?\s*$/i.test(message);
    if (isGreetingOnly) {
      return res.json({
        reply: 'Olá! Posso ajudar com dúvidas sobre o ShelfMate: login, cadastro de produtos, relatórios, estatísticas ou configurações. Pergunte algo como "Como cadastrar produto?" ou "Como gerar relatório?".'
      });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const ai = new GoogleGenAI({ apiKey });

    // Montar contexto com navegação e dados da empresa do usuário (se autenticado)
    const sessionUser = req.session && req.session.user ? req.session.user : null;
    const companyId = sessionUser && sessionUser.company_id ? Number(sessionUser.company_id) : null;

    let contextLines = [
      'Você é o assistente do ShelfMate e responde em português.',
      'Responda somente ao que foi perguntado; seja direto e claro.',
      'Não use formatação Markdown/HTML (negrito, bullets, cabeçalhos); responda em texto simples.',
      'Só descreva navegação quando o usuário pedir explicitamente; não inclua rodapé padrão de páginas.',
      'Nas respostas, use nomes de páginas em português (Produtos, Relatórios, Configurações, etc.) e evite usar slugs como "products" ou "settings".',
      `Projeto: ${SITE_META.name}. Repositório: ${SITE_META.repo}.`,
      `Stack: Frontend=${SITE_META.frontend.framework} (${SITE_META.frontend.hosting}); Backend=${SITE_META.backend.runtime}/${SITE_META.backend.framework} (${SITE_META.backend.hosting}); Banco=${SITE_META.database.engine} - ${SITE_META.database.provider}.`,
      `Autenticação: ${SITE_META.auth.session}. Rotas principais: ${SITE_META.routes.join(', ')}.`,
      `Estrutura: ${SITE_META.structure.join(' | ')}.`,
    ];

    // Incorporar extrato dos requisitos funcionais (PDF) se disponível
    try {
      const reqSummary = await getRequirementsText();
      if (reqSummary) {
        contextLines.push('--- Extrato de Requisitos Funcionais (PDF) ---');
        contextLines.push(reqSummary);
        contextLines.push('--- Fim do Extrato ---');
      } else {
        contextLines.push('Observação: extrato de requisitos funcionais não disponível no momento.');
      }
    } catch {}

    // Incorporar digest de documentação (README, OpenAPI e schema.sql)
    try {
      const docsDigest = await getDocsDigest();
      if (docsDigest) {
        contextLines.push('--- Documentação do Projeto (Digest) ---');
        contextLines.push(docsDigest);
        contextLines.push('--- Fim da Documentação ---');
      }
    } catch {}

    // Guia rápido de uso e páginas (texto simples, sem formatação)
    contextLines.push('Guia rápido:');
    contextLines.push('Criar produto: vá à página "Adicionar Produto"; preencha Nome, Preço Unitário, Estoque e Status; clique em Salvar.');
    contextLines.push('Gerar/retirar relatório: na página "Relatórios", selecione filtros desejados e clique em "Exportar PDF".');
    contextLines.push('Páginas: Login (entrar), Cadastro (criar conta), Esqueci a Senha (código e nova senha), Início (visão geral), Estatísticas (gráficos e métricas), Produtos (lista, busca e edição), Adicionar Produto (formulário), Relatórios (exportar PDF), Configurações (perfil e conta).');
    contextLines.push('Se o usuário pedir para abrir uma página específica, inclua no final uma linha isolada: NAVIGATE:<slug> onde <slug> ∈ login|signup|forgot-password|home|statistics|products|add-product|reports|settings. Use apenas quando a intenção de navegação for clara (ex.: "quero adicionar um produto" → NAVIGATE:add-product).');

    // Guia detalhado de funcionalidades por página (texto simples, sem formatação)
    contextLines.push('Detalhes: Login — Informe email e senha e clique em Login; há botão para mostrar/ocultar senha; o link "Esqueceu a Senha?" envia um código por email e leva para Esqueci a Senha. Em caso de sucesso, navegar para Início.');
    contextLines.push('Detalhes: Cadastro — Preencha Nome, Email, Senha (mínimo 6) e CPF/CNPJ (formatação aplicada); ao cadastrar com sucesso, voltar para Login.');
    contextLines.push('Detalhes: Esqueci a Senha — Etapa 1: enviar código para o email. Etapa 2: digitar código recebido e nova senha (mínimo 6) com confirmação; ao redefinir, voltar para Login.');
    contextLines.push('Detalhes: Início — Exibe atividade recente (logins, produtos inseridos, mudanças de perfil, relatórios baixados, alertas emitidos) e Análises com gráficos: Tendência de Crescimento, Distribuição de Produtos e Top 5 Mais Vendidos.');
    contextLines.push('Detalhes: Estatísticas — Métricas: Total de Produtos, Valor em Estoque, Produtos com Estoque Baixo, Vendas no Período; Gráficos: Evolução do Estoque (linha), Produtos Mais Vendidos (pizza), Vendas por Produto (barra).');
    contextLines.push('Detalhes: Produtos — Lista com filtros por nome e status; ordenação por Nome, Preço Unitário, Estoque, Status, Vendas e Alertas; ações: Adicionar Produto, Importar vários via CSV (headers: name, unit_price, inventory, status), Excluir produto com confirmação. Mostra preço, estoque, status (Disponível/Estoque Baixo/Estoque Alto), vendas e contagem de alertas.');
    contextLines.push('Detalhes: Adicionar Produto — Campos obrigatórios: Nome, Preço Unitário (formato brasileiro, até 2 casas), Estoque (não negativo) e Status (Disponível/Estoque Baixo/Estoque Alto). Em sucesso, limpar formulário e retornar para Produtos.');
    contextLines.push('Detalhes: Relatórios — Exportar PDF de Produtos (colunas: ID, Produto, Preço, Estoque, Status, Alertas) e de Alertas (itens com alerts_count>0 ou estoque baixo); se a sessão estiver expirada, solicitar Login.');
    contextLines.push('Detalhes: Configurações — Editar Nome e Email; Alterar Senha (mínimo 6); Alterar Foto de Perfil: clicar no avatar para escolher a imagem e visualizar prévia; salvar para aplicar. Excluir Conta: requer confirmação; ao excluir, desconectar e retornar para Login.');

    // Regras de explicação
    contextLines.push('Explique em passos objetivos e curtos quando o usuário pedir "como fazer". Se houver intenção clara de uma tarefa numa página específica (ex.: adicionar produto, exportar relatório, alterar foto), inclua no final NAVIGATE:<slug> (ex.: NAVIGATE:add-product, NAVIGATE:reports, NAVIGATE:settings). Nos textos para o usuário, use nomes das páginas em português e não exiba o marcador.');

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

    let response;
    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents: promptText,
        // Limita tokens para reduzir custo/uso e evitar exceder quotas rapidamente
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
      });
    } catch (apiErr) {
      const msg = String(apiErr?.message || '');
      const status = Number(apiErr?.status || 0);
      const isQuota = status === 429 || /RESOURCE_EXHAUSTED|quota|rate[- ]?limit/i.test(msg);
      if (isQuota) {
        // Retorna erro 429 explícito com mensagem amigável para o frontend poder tratar (ex.: retry/backoff)
        return res.status(429).json({
          error: 'Limite de uso do provedor de IA atingido. Tente novamente em alguns minutos ou reduza a frequência.',
        });
      }
      // Propaga outros erros para o handler abaixo
      throw apiErr;
    }

    const text = response?.text || response?.response?.text?.() || '';
    const clean = sanitizeReply(text);
    // Se a sanitização deixar vazio, retornar fallback informativo
    const finalReply = clean && clean.trim().length > 0
      ? clean
      : 'Posso ajudar com funcionalidades do ShelfMate (produtos, relatórios, estatísticas, alertas). Faça uma pergunta específica, por exemplo: "Como exportar relatório de produtos?"';
    return res.json({ reply: finalReply });
  } catch (err) {
    console.error('Erro em POST /chat:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

export default router;
