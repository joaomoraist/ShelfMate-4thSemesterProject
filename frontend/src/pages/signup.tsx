import React, { useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";
import "../styles/auth.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [toast, setToast] = useState<string>("");
  const { navigateTo } = useNavigation();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // Limpa CNPJ de quaisquer caracteres não numéricos (usuário pode colar com máscara)
    const cleanCnpj = cnpj.replace(/\D/g, "");
    if (cleanCnpj.length !== 14) {
      alert("❌ CNPJ inválido. Informe 14 dígitos numéricos.");
      return;
    }

    try {
      const response = await fetch(API_URLS.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, company_cnpj: cleanCnpj }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast("Cadastro realizado.");
        // Navegar para a página de login após cadastro bem-sucedido
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

  return (
    <div className="card">
      <h1>Cadastre-se</h1>
      <p className="sub">Crie sua conta</p>

      <form onSubmit={handleSignup}>
        <label htmlFor="name">Nome</label>
        <input id="name" type="text" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />

        <label htmlFor="email">Email</label>
        <input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="cnpj">CNPJ da Empresa</label>
        <input id="cnpj" type="text" placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(e.target.value)} maxLength={18} />

        <label htmlFor="password">Senha</label>
        <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />

        <div className="row" style={{ marginTop: 16 }}>
          <button className="primary" type="submit">Cadastrar</button>
        </div>
      </form>

      <div className="row" style={{ marginTop: 10 }}>
        <button className="secondary" onClick={() => navigateTo("login")}>Voltar ao Login</button>
      </div>

      {toast && <div className="toast" id="toast">{toast}</div>}
    </div>
  );
}
