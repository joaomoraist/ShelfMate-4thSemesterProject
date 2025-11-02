import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// Chat proxy usando Gemini via @google/genai
router.post('/', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GOOGLE_API_KEY não configurado' });
    }

    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message é obrigatório' });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const ai = new GoogleGenAI({ apiKey });

    // API simples: envia o texto do usuário e retorna texto
    const response = await ai.models.generateContent({
      model: modelName,
      contents: message,
    });

    const text = response?.text || response?.response?.text?.() || '';
    return res.json({ reply: text });
  } catch (err) {
    console.error('Erro em POST /chat:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;