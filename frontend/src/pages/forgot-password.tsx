import React, { useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { navigateTo } = useNavigation();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(API_URLS.SEND_RESET_CODE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsEmailSent(true);
        alert("✅ Código de recuperação enviado para seu email!");
        // Navegar para a página de reset de senha após envio bem-sucedido
        setTimeout(() => {
          navigateTo("reset-password");
        }, 2000);
      } else {
        const error = await response.json();
        alert("❌ Falha ao enviar email de recuperação: " + (error.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Erro ao conectar com o servidor.");
    }
  };

  if (isEmailSent) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2>📧 Email Sent!</h2>
        <p>Verifique seu email para as instruções de recuperação de senha.</p>
        <button onClick={() => setIsEmailSent(false)}>🔄 Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2>🔑 Esqueci a Senha</h2>
      <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
        <input
          type="email"
          placeholder="📧 Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">➡️ Enviar Email de Recuperação</button>
      </form>
      
      {/* Botões de navegação para teste */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={() => navigateTo("login")} style={{ padding: "5px 10px" }}>
          🔐 Voltar ao Login
        </button>
        <button onClick={() => navigateTo("reset-password")} style={{ padding: "5px 10px" }}>
          🔄 Ir para Reset de Senha
        </button>
      </div>
    </div>
  );
}
