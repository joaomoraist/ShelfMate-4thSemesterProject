import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Simple chat proxy using OpenAI Chat Completions
router.post('/', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }

    const { message, conversation } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message é obrigatório' });
    }

    const messages = Array.isArray(conversation) ? conversation : [];
    messages.push({ role: 'user', content: message });

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('OpenAI error:', errText);
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