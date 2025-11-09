import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { NavigationProvider } from "./context/NavigationContext";
import "./styles/global.css";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgot-password";
import Home from "./pages/home";
import Statistics from "./pages/statistics";
import Products from "./pages/products";
import AddProduct from "./pages/add-product";
import Reports from "./pages/reports";
import Settings from "./pages/settings";
import SiteFooter from "./components/SiteFooter";
import ChatWidget from "./components/ChatWidget";
import { API_CONFIG } from "./config/api";

type Page = "login" | "signup" | "forgot-password" | "home" | "statistics" | "products" | "add-product" | "reports" | "settings";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");

  // Função para navegar entre páginas (disponível globalmente)
  const navigateTo = (page: Page) => {
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      const who = user?.email || user?.name || 'desconhecido';
      const when = new Date().toLocaleString('pt-BR');
      console.log(`[LOG] Usuário ${who} mudou para a página ${page} às ${when}`);
    } catch (e) {
      // silêncio: logging não deve quebrar navegação
    }
    setCurrentPage(page);
  };

  // Forçar controle manual de restauração de scroll do browser
  React.useEffect(() => {
    try { window.history.scrollRestoration = 'manual'; } catch {}
  }, []);

  // Determinar páginas de autenticação e estado atual
  const authPages = ["login", "signup", "forgot-password"];
  const isAuthPage = authPages.includes(currentPage);
  // Sempre voltar ao topo ao trocar de página (instantâneo)
  React.useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      // Garantias adicionais para navegadores que usam scroll em documentElement/body
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {}
  }, [currentPage]);

  // Aplicar classe no body baseada na página atual
  React.useEffect(() => {
    document.body.className = isAuthPage ? "auth-page" : "logged-in";
  }, [currentPage, isAuthPage]);

  // Log de todas solicitações de dados via fetch
  React.useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo, init?: RequestInit) => {
      try {
        const url = typeof input === 'string' ? input : input.url;
        const method = (init && init.method) || (typeof input !== 'string' ? input.method : 'GET') || 'GET';
        const stored = localStorage.getItem('user');
        const user = stored ? JSON.parse(stored) : null;
        const who = user?.email || user?.name || 'desconhecido';
        const when = new Date().toLocaleString('pt-BR');
        console.log(`[LOG] Usuário ${who} solicitou dados ${method} ${url} às ${when}`);
        // Garantir envio de cookies para chamadas na nossa API
        const isApiCall = typeof url === 'string' && url.startsWith(API_CONFIG.BASE_URL);
        if (isApiCall) {
          init = { ...(init || {}), credentials: (init && init.credentials) ? init.credentials : 'include' };
        }
      } catch (e) {
        // não interromper a requisição, apenas falhar silenciosamente o log
      }
      return originalFetch(input as any, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <Login />;
      case "signup":
        return <Signup />;
      case "forgot-password":
        return <ForgotPassword />;
      case "home":
        return <Home />;
      case "statistics":
        return <Statistics />;
      case "products":
        return <Products />;
      case "add-product":
        return <AddProduct />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Login />;
    }
  };

  return (
    <div className="appRoot">
      <NavigationProvider navigateTo={navigateTo}>
        <main className="appMain">
          {renderPage()}
        </main>
        {!isAuthPage && <ChatWidget />}
        {!isAuthPage && <SiteFooter />}
      </NavigationProvider>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
