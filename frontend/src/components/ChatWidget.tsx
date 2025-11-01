import React from 'react';
import { API_URLS } from '../config/api';
import styles from '../styles/chat-widget.module.css';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const ChatWidget: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(false);

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
        const reply = (data && data.reply) ? String(data.reply) : 'Sem resposta.';
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } else {
        const err = await res.json().catch(() => ({} as any));
        setMessages((prev) => [...prev, { role: 'assistant', content: `Erro: ${err.error || 'Falha ao enviar'}` }]);
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
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>×</button>
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
      <button className={styles.fab} onClick={() => setOpen(!open)} title="Abrir chat">
        {open ? 'Fechar' : 'Chat'}
      </button>
    </div>
  );
};

export default ChatWidget;