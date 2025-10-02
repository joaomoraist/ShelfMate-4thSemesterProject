import React, { useEffect, useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";
import "../styles/auth.css";
import AuthIllustration from "../components/AuthIllustration";

export default function ForgotPassword() {
  // Steps: 1 = send code, 2 = verify code, 3 = reset password
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [recoveryCode, setRecoveryCode] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [toast, setToast] = useState<string>("");
  const { navigateTo } = useNavigation();

  // Prefill email if the login page stored it
  useEffect(() => {
    const allowedEmail = localStorage.getItem("resetFlowEmail");
    if (!allowedEmail) {
      showToast("Solicite o código na página de login.");
      setTimeout(() => navigateTo("login"), 1200);
      return;
    }
    setEmail(allowedEmail);
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
        showToast("Código de recuperação enviado para seu email.");
      } else {
        const error = await response.json();
        const details = (error && (error.details || error.error)) ? (error.details || error.error) : null;
        showToast("Falha ao enviar código: " + (error.error || "Erro desconhecido") + (details ? " - " + details : ""));
      }
    } catch (error) {
      console.error(error);
      showToast("Erro ao conectar com o servidor.");
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
        showToast("Código verificado. Agora defina sua nova senha.");
      } else {
        const error = await response.json();
        showToast("Código inválido: " + (error.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error(error);
      showToast("Erro ao conectar com o servidor.");
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
        showToast("Senha redefinida com sucesso.");
        localStorage.removeItem("resetFlowEmail");
        setTimeout(() => navigateTo("login"), 900);
      } else {
        const error = await response.json();
        showToast("Falha ao redefinir senha: " + (error.error || "Erro desconhecido"));
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
        <div className="auth-content">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>🔑</div>
            <h1 className="auth-title">Redefinir a Senha</h1>
            <p className="auth-sub">Digite as suas informações</p>
          </div>

          {step === 1 && (
            <form onSubmit={handleSendCode}>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="Digite seu email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="row" style={{ marginTop: 16 }}>
                <button className="primary" type="submit">Enviar Código</button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode}>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} disabled />

              <label htmlFor="code">Código encaminhado</label>
              <input id="code" type="text" placeholder="Digite o código encaminhado" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} />

              <div className="row" style={{ marginTop: 16 }}>
                <button className="primary" type="submit">Verificar</button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} disabled />

              <label htmlFor="newpass">Nova senha</label>
              <input id="newpass" type="password" placeholder="Digite sua nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

              <div className="row" style={{ marginTop: 16 }}>
                <button className="primary" type="submit">Atualizar</button>
              </div>
            </form>
          )}

          <hr style={{ margin: '18px 0', border: 0, borderTop: '1px solid #e5e7eb' }} />

          <div className="row" style={{ marginTop: 4 }}>
            <button className="secondary" onClick={() => navigateTo("login")}>Login</button>
          </div>

          <p className="muted">Apoie nossos desenvolvedores visitando-nos, no linkedin e github</p>
        </div>

        <AuthIllustration images={["/image1.jpg", "/image2.png", "/image3.jpg", "/image4.jpg"]} intervalMs={3500} />
      </div>
      {toast && <div className="toast show" id="toast">{toast}</div>}
    </div>
  );
}
