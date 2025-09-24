import React, { useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cnpj, setCnpj] = useState("");
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
        alert("✅ Cadastro realizado com sucesso! Usuário: " + data.user.name);
        // Navegar para a página de login após cadastro bem-sucedido
        navigateTo("login");
      } else {
        const error = await response.json();
        alert("❌ Falha no cadastro: " + (error.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Erro ao conectar com o servidor.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2>📝 Cadastro</h2>
      <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
        <input
          type="text"
          placeholder="👤 Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="📧 Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="🔑 Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="🏢 CNPJ da Empresa (somente números)"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          required
          maxLength={14}
          pattern="[0-9]{14}"
          title="Informe 14 dígitos numéricos do CNPJ"
        />
        <button type="submit">➡️ Cadastrar</button>
      </form>
      
      {/* Botões de navegação para teste */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={() => navigateTo("login")} style={{ padding: "5px 10px" }}>
          🔐 Ir para Login
        </button>
        <button onClick={() => navigateTo("forgot-password")} style={{ padding: "5px 10px" }}>
          🔑 Esqueci a Senha
        </button>
      </div>
    </div>
  );
}
