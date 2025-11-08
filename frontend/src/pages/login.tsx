import React, { useState, useEffect } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";
import { Eye, EyeOff } from "lucide-react";
import "../styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [eyeBlink, setEyeBlink] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [welcomeTitle, setWelcomeTitle] = useState<string>("Bem vindo de Volta");
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const { navigateTo } = useNavigation();

  useEffect(() => {
    try {
      const visited = localStorage.getItem("hasVisited");
      if (!visited) {
        setWelcomeTitle("Bem vindo");
        localStorage.setItem("hasVisited", "1");
      } else {
        setWelcomeTitle("Bem vindo de Volta");
      }
    } catch {
      setWelcomeTitle("Bem vindo");
    }
  }, []);

  const handleForgotFromLogin = async () => {
    if (forgotLoading) return;
    if (!email) {
      showToast("Informe seu email para enviar o código.");
      return;
    }

    try {
      setForgotLoading(true);
      const response = await fetch(API_URLS.SEND_RESET_CODE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        showToast("Código enviado. Verifique seu email.");
        localStorage.setItem("resetFlowEmail", email);
        localStorage.setItem("resetCodeJustSent", "1");
        navigateTo("forgot-password");
      } else {
        const errorData = await response.json();
        const details =
          errorData && (errorData.details || errorData.error)
            ? errorData.details || errorData.error
            : null;
        showToast(
          "Falha ao enviar código: " +
            (errorData.error || "Erro desconhecido") +
            (details ? " - " + details : "")
        );
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao conectar com o servidor.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(API_URLS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast("Login efetuado com sucesso.");
        localStorage.setItem("user", JSON.stringify(data.user));
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

  const togglePassword = () => {
    setShowPassword(!showPassword);
    setEyeBlink(true);
    setTimeout(() => setEyeBlink(false), 400); // piscar suave (400ms)
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="page-auth">
      <div className="auth-shell">
        <div className="auth-logo-container">
          <img src="/logo-removebg.png" alt="Logo" className="rotating-logo" />
        </div>

        <div className="auth-content">
          <div style={{ textAlign: "center" }}>
            <img src="/home_login.png" alt="Login" className="auth-icon" />
            <h1 className="auth-title">{welcomeTitle}</h1>
            <p className="auth-sub">Digite as suas informações</p>
          </div>

          <form onSubmit={handleLogin}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="password">Senha</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={`toggle-password ${eyeBlink ? "blink" : ""}`}
                onClick={togglePassword}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff size={20} strokeWidth={1.8} />
                ) : (
                  <Eye size={20} strokeWidth={1.8} />
                )}
              </button>
            </div>

            <div className="inline">
              <span></span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleForgotFromLogin();
                }}
                aria-disabled={forgotLoading}
                style={{
                  pointerEvents: forgotLoading ? "none" : "auto",
                  opacity: forgotLoading ? 0.6 : 1,
                }}
              >
                {forgotLoading ? "Enviando..." : "Esqueceu a Senha?"}
              </a>
            </div>

            <div className="row" style={{ marginTop: 16 }}>
              <button className="primary" type="submit">
                Login
              </button>
            </div>
          </form>

          <hr
            style={{
              margin: "18px 0",
              border: 0,
              borderTop: "1px solid #e5e7eb",
            }}
          />

          <div className="row" style={{ marginTop: 4 }}>
            <button className="secondary" onClick={() => navigateTo("signup")}>
              Cadastrar-se
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast show" id="toast" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
