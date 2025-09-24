import React, { useEffect, useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";

export default function ForgotPassword() {
  // Steps: 1 = send code, 2 = verify code, 3 = reset password
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [recoveryCode, setRecoveryCode] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const { navigateTo } = useNavigation();

  // Prefill email if the login page stored it
  useEffect(() => {
    const prefill = localStorage.getItem("forgotEmail");
    if (prefill) {
      setEmail(prefill);
      // Remove it so future navigations don't keep it unintentionally
      localStorage.removeItem("forgotEmail");
    }
  }, []);

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      const response = await fetch(API_URLS.SEND_RESET_CODE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStep(2);
        alert("✅ Código de recuperação enviado para seu email!");
      } else {
        const error = await response.json();
        // Show details if backend provides them
        const details = (error && (error.details || error.error)) ? (error.details || error.error) : null;
        alert("❌ Falha ao enviar código: " + (error.error || "Erro desconhecido") + (details ? " - " + details : ""));
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Erro ao conectar com o servidor.");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(API_URLS.VERIFY_RESET_CODE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recoveryCode }),
      });

      if (response.ok) {
        setStep(3);
        alert("✅ Código verificado! Agora defina sua nova senha.");
      } else {
        const error = await response.json();
        alert("❌ Código inválido: " + (error.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Erro ao conectar com o servidor.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(API_URLS.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recoveryCode, newPassword }),
      });

      if (response.ok) {
        alert("✅ Senha redefinida com sucesso!");
        navigateTo("login");
      } else {
        const error = await response.json();
        alert("❌ Falha ao redefinir senha: " + (error.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Erro ao conectar com o servidor.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2>🔑 Redefinir Senha</h2>

      {step === 1 && (
        <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
          <input
            type="email"
            placeholder="📧 Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">➡️ Enviar Código de Recuperação</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
          <input type="email" placeholder="📧 Email" value={email} disabled />
          <input
            type="text"
            placeholder="🔢 Código de Recuperação"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            required
          />
          <button type="submit">➡️ Verificar Código</button>
          <button type="button" onClick={() => setStep(1)} style={{ marginTop: "10px" }}>
            🔄 Voltar
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
          <input type="email" placeholder="📧 Email" value={email} disabled />
          <input type="text" placeholder="🔢 Código de Recuperação" value={recoveryCode} disabled />
          <input
            type="password"
            placeholder="🔑 Nova Senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit">➡️ Redefinir Senha</button>
          <button type="button" onClick={() => setStep(2)} style={{ marginTop: "10px" }}>
            � Voltar
          </button>
        </form>
      )}

      {/* Botões de navegação para teste */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={() => navigateTo("login")} style={{ padding: "5px 10px" }}>
          � Voltar ao Login
        </button>
      </div>
    </div>
  );
}
