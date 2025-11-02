import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Simple chat proxy using Groq Chat Completions (OpenAI-compatible API)
router.post('/', async (req, res) => {
  try {
    // Support both GROQ_API_KEY and fallback to OPENAI_API_KEY if present
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY não configurado' });
    }

    const { message, conversation } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message é obrigatório' });
    }

    const messages = Array.isArray(conversation) ? conversation : [];
    messages.push({ role: 'user', content: message });

    // Groq usa endpoint OpenAI-compatible
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Permite configurar o modelo via env, padrão para exemplo do usuário
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
        messages,
        temperature: 0.3
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Groq error:', errText);
      return res.status(500).json({ error: 'Falha ao obter resposta do modelo' });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return res.json({ reply: content });
  } catch (err) {
    console.error('Erro em POST /chat:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;