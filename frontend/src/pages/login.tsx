import React, { useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";
import "../styles/auth.css";
import AuthIllustration from "../components/AuthIllustration";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<string>("");
  const { navigateTo } = useNavigation();

  const handleForgotFromLogin = async () => {
    if (!email) {
      // If no email filled, just navigate to forgot-password page where user can type email
      navigateTo("forgot-password");
      return;
    }

    try {
      const response = await fetch(API_URLS.SEND_RESET_CODE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        showToast("Código enviado. Verifique seu email.");
        // Mark reset flow allowed and store email
        localStorage.setItem("resetFlowEmail", email);
        // Navegar para a página de forgot-password somente após o envio
        navigateTo("forgot-password");
      } else {
        const errorData = await response.json();
        const details = (errorData && (errorData.details || errorData.error)) ? (errorData.details || errorData.error) : null;
        showToast("Falha ao enviar código: " + (errorData.error || "Erro desconhecido") + (details ? " - " + details : ""));
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao conectar com o servidor.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(API_URLS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast("Login efetuado.");
        localStorage.setItem("user", JSON.stringify(data.user));
        // Navegar para a página home após login bem-sucedido
        navigateTo("home");
      } else {
        const errorData = await response.json();
        showToast("Erro no login: " + (errorData.error || "Credenciais inválidas"));
      }
    } catch (error) {
      console.error(error);
      showToast("Erro ao conectar com o servidor.");
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="page-auth">
      <div className="auth-shell">
        <AuthIllustration images={["/wallpaper.jpg", "/public/wallpaper.jpg", "/logo.png"]} intervalMs={1000} />
        <div className="auth-content">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>🏠</div>
            <h1 className="auth-title">Bem vindo de Volta</h1>
            <p className="auth-sub">Digite as suas informações</p>
          </div>

          <form onSubmit={handleLogin}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="Digite seu email" value={email} onChange={(e) => setEmail(e.target.value)} />

            <label htmlFor="password">Senha</label>
            <input id="password" type="password" placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} />

            <div className="inline">
              <span></span>
              <a href="#" onClick={(e) => { e.preventDefault(); handleForgotFromLogin(); }}>Esqueceu a Senha?</a>
            </div>

            <div className="row" style={{ marginTop: 16 }}>
              <button className="primary" type="submit">Login</button>
            </div>
          </form>

          <hr style={{ margin: '18px 0', border: 0, borderTop: '1px solid #e5e7eb' }} />

          <div className="row" style={{ marginTop: 4 }}>
            <button className="secondary" onClick={() => navigateTo("signup")}>Cadastrar-se</button>
          </div>

          <p className="muted">Apoie nossos desenvolvedores visitando-nos, no linkedin e github</p>
        </div>
      </div>
      {toast && <div className="toast show" id="toast">{toast}</div>}
    </div>
  );
}
