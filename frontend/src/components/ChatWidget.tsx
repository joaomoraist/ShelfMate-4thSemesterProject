import React from 'react';
import { API_URLS } from '../config/api';
import styles from '../styles/chat-widget.module.css';
import { useNavigation } from '../context/NavigationContext';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const ChatWidget: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(false);
  const GROQ_API_KEY: string | undefined = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GROQ_API_KEY) as any;
  const GROQ_MODEL: string = ((typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_GROQ_MODEL) as any) || 'openai/gpt-oss-20b';
  const { navigateTo } = useNavigation();

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch(API_URLS.CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, conversation: messages })
      });
      if (res.ok) {
        const data = await res.json();
        let reply = (data && data.reply) ? String(data.reply) : 'Sem resposta.';

        // Processa todos os marcadores NAVIGATE:<slug> em qualquer posição; navega no primeiro e oculta todos
        const navRegex = /\bNAVIGATE:\s*(login|signup|forgot-password|home|statistics|products|add-product|reports|settings)\b/ig;
        let firstSlug: string | null = null;
        reply = reply.replace(navRegex, (_m, s: string) => {
          if (!firstSlug) firstSlug = (s || '').toLowerCase();
          return '';
        });
        if (firstSlug) {
          try { navigateTo(firstSlug as any); } catch {}
        }
        reply = reply.trim();
        if (reply.length > 0) {
          setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        }

        // Detecção local de intenção de navegação baseada na pergunta do usuário
        try {
          const mod = await import('../services/searchNavigation');
          const page = mod.getBestPageForQuery(text);
          if (page === 'add-product') {
            navigateTo('add-product');
          }
        } catch {}
      } else {
        const err = await res.json().catch(() => ({} as any));
        const errMsg = String(err?.error || 'Falha ao enviar');
        // Fallback: se backend não estiver com chave, tenta direto na Groq pelo frontend
        const needsGroq = /OPENAI_API_KEY not configured|GROQ_API_KEY/i.test(errMsg);
        if (needsGroq && GROQ_API_KEY) {
          try {
            const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [...messages, { role: 'user', content: text }],
                temperature: 0.3
              })
            });
            const groqData = await groqResp.json().catch(() => ({} as any));
            let groqReply = groqData?.choices?.[0]?.message?.content || 'Sem resposta.';
            // Também suporta NAVIGATE no fallback: oculta marcadores e navega
            const navRegex2 = /\bNAVIGATE:\s*(login|signup|forgot-password|home|statistics|products|add-product|reports|settings)\b/ig;
            let firstSlug2: string | null = null;
            groqReply = groqReply.replace(navRegex2, (_m, s: string) => {
              if (!firstSlug2) firstSlug2 = (s || '').toLowerCase();
              return '';
            });
            if (firstSlug2) {
              try { navigateTo(firstSlug2 as any); } catch {}
            }
            groqReply = groqReply.trim();
            if (groqReply.length > 0) {
              setMessages((prev) => [...prev, { role: 'assistant', content: groqReply }]);
            }
          } catch (ge) {
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Erro ao contatar a Groq diretamente.' }]);
          }
        } else {
          setMessages((prev) => [...prev, { role: 'assistant', content: `Erro: ${errMsg}` }]);
        }
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Erro de rede ao contatar o chatbot.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.widgetRoot}>
      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Assistente</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={styles.clearBtn} onClick={() => setMessages([])} title="Limpar conversa">Limpar</button>
              <button className={styles.closeBtn} onClick={() => setOpen(false)} title="Fechar">×</button>
            </div>
          </div>
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.placeholder}>Faça uma pergunta sobre o sistema ou dados.</div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? styles.msgUser : styles.msgAssistant}>
                {m.content}
              </div>
            ))}
            {loading && <div className={styles.loading}>Respondendo…</div>}
          </div>
          <div className={styles.inputBar}>
            <input
              className={styles.input}
              placeholder="Pergunte algo…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            />
            <button className={styles.sendBtn} onClick={send} disabled={loading}>Enviar</button>
          </div>
        </div>
      )}
      <button className={styles.fab} onClick={() => setOpen(!open)} title={open ? 'Fechar chat' : 'Abrir chat'}>
        <img src="/robot.png" alt="Robô assistente" className={styles.robotIcon} />
        {open ? 'Fechar' : 'Chat'}
      </button>
    </div>
  );
};

export default ChatWidget;