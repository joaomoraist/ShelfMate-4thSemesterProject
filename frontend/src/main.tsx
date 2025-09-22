import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { NavigationProvider } from "./context/NavigationContext";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import Home from "./pages/home";

type Page = "login" | "signup" | "forgot-password" | "reset-password" | "home";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");

  // Função para navegar entre páginas (disponível globalmente)
  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <Login />;
      case "signup":
        return <Signup />;
      case "forgot-password":
        return <ForgotPassword />;
      case "reset-password":
        return <ResetPassword />;
      case "home":
        return <Home />;
      default:
        return <Login />;
    }
  };

  return (
    <NavigationProvider navigateTo={navigateTo}>
      <div style={{ padding: "20px" }}>
        {/* Navigation */}
        <nav style={{ marginBottom: "30px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
          <button 
            onClick={() => setCurrentPage("login")}
            style={{ margin: "5px", padding: "8px 16px" }}
          >
            🔐 Login
          </button>
          <button 
            onClick={() => setCurrentPage("signup")}
            style={{ margin: "5px", padding: "8px 16px" }}
          >
            📝 Cadastro
          </button>
          <button 
            onClick={() => setCurrentPage("forgot-password")}
            style={{ margin: "5px", padding: "8px 16px" }}
          >
            🔑 Esqueci a Senha
          </button>
          <button 
            onClick={() => setCurrentPage("reset-password")}
            style={{ margin: "5px", padding: "8px 16px" }}
          >
            🔄 Redefinir Senha
          </button>
          <button 
            onClick={() => setCurrentPage("home")}
            style={{ margin: "5px", padding: "8px 16px" }}
          >
            🏠 Início
          </button>
        </nav>

        {/* Current Page */}
        {renderPage()}
      </div>
    </NavigationProvider>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
