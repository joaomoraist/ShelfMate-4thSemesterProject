import React, { useEffect, useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";
import "../styles/reset-password.css";

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
    <div className="card">
      <h1>Redefinir Senha</h1>
      <p className="sub">Informe o código recebido por email e a nova senha</p>

      {step === 1 && (
        <form onSubmit={handleSendCode}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="row" style={{ marginTop: 16 }}>
            <button className="primary" type="submit">Enviar Código</button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyCode}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} disabled />

          <label htmlFor="code">Código de verificação</label>
          <input id="code" type="text" placeholder="CÓDIGO RECEBIDO" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} />

          <div className="row" style={{ marginTop: 16 }}>
            <button className="primary" type="submit">Verificar</button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} disabled />

          <label htmlFor="code">Código de verificação</label>
          <input id="code" type="text" value={recoveryCode} disabled />

          <label htmlFor="newpass">Nova senha</label>
          <input id="newpass" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

          <div className="row" style={{ marginTop: 16 }}>
            <button className="primary" type="submit">Atualizar</button>
          </div>
        </form>
      )}
    </div>
  );
}
