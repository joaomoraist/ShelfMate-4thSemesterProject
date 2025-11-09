import React, { useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";
import "../styles/auth.css";
import AuthIllustration from "../components/AuthIllustration";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [eyeBlink, setEyeBlink] = useState(false);
  const [toast, setToast] = useState<string>("");
  const { navigateTo } = useNavigation();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDoc = cnpj.replace(/\D/g, "");
    if (!(cleanDoc.length === 11 || cleanDoc.length === 14)) {
      showToast("Documento inválido. Informe 11 (CPF) ou 14 (CNPJ) dígitos.");
      return;
    }

    if (!password || password.length < 6) {
      showToast("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      const response = await fetch(API_URLS.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, company_cnpj: cleanDoc }),
      });

      if (response.ok) {
        await response.json();
        showToast("Cadastro realizado.");
        setTimeout(() => navigateTo("login"), 800);
      } else {
        const error = await response.json();
        showToast("Falha no cadastro: " + (error.error || "Erro desconhecido"));
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

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
    setEyeBlink(true);
    setTimeout(() => setEyeBlink(false), 400);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.length > 14) digits = digits.slice(0, 14);
    let formatted = digits;
    if (digits.length <= 11) {
      // CPF mask: 000.000.000-00
      formatted = digits
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d{2})$/, ".$1-$2");
    } else {
      // CNPJ mask: 00.000.000/0000-00
      formatted = digits
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d{4})(\d)/, ".$1/$2-$3");
    }
    setCnpj(formatted);
  };

  return (
    <div className="page-auth">
      <div className="auth-shell">
        <div className="auth-content">
          <div style={{ textAlign: "center" }}>
            <img src="/singup.png" alt="Cadastro" className="auth-icon" />
            <h1 className="auth-title">Cadastre-se</h1>
            <p className="auth-sub">Digite as suas informações</p>
          </div>

          <form onSubmit={handleSignup}>
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              type="text"
              placeholder="Digite seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="cnpj">CNPJ ou CPF</label>
            <input
              id="cnpj"
              type="text"
              placeholder={cnpj.replace(/\D/g, "").length <= 11 ? "000.000.000-00" : "00.000.000/0000-00"}
              value={cnpj}
              onChange={handleCnpjChange}
              maxLength={18}
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

            <div className="row" style={{ marginTop: 16 }}>
              <button className="primary" type="submit">
                Cadastrar-se
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
            <button className="secondary" onClick={() => navigateTo("login")}>
              Login
            </button>
          </div>
        </div>

        <div className="auth-logo-container">
          <img src="/logo-removebg.png" alt="Logo" className="rotating-logo" />
        </div>
      </div>
      {toast && <div className="toast show" id="toast">{toast}</div>}
    </div>
  );
}
