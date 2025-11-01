import { useState, useEffect, useCallback } from 'react';
import { API_URLS } from '../config/api';

export default function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URLS.ME, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        try {
          if (data && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } catch (e) {
          console.warn('Falha ao salvar user no localStorage:', e && (e as any).message);
        }
      } else {
        // Sessão inválida: evitar dados de outro usuário no localStorage
        try { localStorage.removeItem('user'); } catch {}
        setUser(null);
      }
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      // Em erro de rede, evitar exibir dados possivelmente desatualizados
      try { localStorage.removeItem('user'); } catch {}
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  return { user, loading, refresh: fetchUser };
}
