import React, { useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { navigateTo } = useNavigation();

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
        alert("✅ Login realizado com sucesso! Usuário: " + data.user.name);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Navegar para a página home após login bem-sucedido
        navigateTo("home");
      } else {
        const errorData = await response.json();
        alert("❌ Erro no login: " + (errorData.error || "Credenciais inválidas"));
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Erro ao conectar com o servidor.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2>🔐 Login</h2>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
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
        <button type="submit">➡️ Entrar</button>
      </form>
      
      {/* Botões de navegação para teste */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={() => navigateTo("signup")} style={{ padding: "5px 10px" }}>
          📝 Ir para Cadastro
        </button>
        <button onClick={() => navigateTo("forgot-password")} style={{ padding: "5px 10px" }}>
          🔑 Esqueci a Senha
        </button>
      </div>
    </div>
  );
}
