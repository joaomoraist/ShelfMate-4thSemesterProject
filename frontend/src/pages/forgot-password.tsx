import React, { useEffect, useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";
import "../styles/auth.css";
import AuthIllustration from "../components/AuthIllustration";

export default function ForgotPassword() {
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [recoveryCode, setRecoveryCode] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [toast, setToast] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const { navigateTo } = useNavigation();

  useEffect(() => {
    const allowedEmail = localStorage.getItem("resetFlowEmail");
    if (!allowedEmail) {
      showToast("Informe seu email na página de login para enviar o código.");
      return;
    }
    setEmail(allowedEmail);

    const justSent = localStorage.getItem("resetCodeJustSent");
    if (justSent === "1") {
      showToast("Código enviado. Verifique seu email.");
      setStep(2);
      localStorage.removeItem("resetCodeJustSent");
      return;
    }

    (async () => {
      try {
        setSending(true);
        const response = await fetch(API_URLS.SEND_RESET_CODE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: allowedEmail }),
        });

        if (response.ok) {
          showToast("Código enviado. Verifique seu email e digite abaixo.");
          setStep(2);
        } else {
          const errorData = await response.json();
          const details =
            errorData?.details || errorData?.error ? errorData.details || errorData.error : null;
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
        setSending(false);
      }
    })();
  }, []);

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (sending) return;

    try {
      setSending(true);
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
        const details =
          error?.details || error?.error ? error.details || error.error : null;
        showToast(
          "Falha ao enviar código: " +
            (error.error || "Erro desconhecido") +
            (details ? " - " + details : "")
        );
      }
    } catch (error) {
      console.error(error);
      showToast("Erro ao conectar com o servidor.");
    } finally {
      setSending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      showToast("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("A confirmação não corresponde à nova senha.");
      return;
    }

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
          <div style={{ textAlign: "center" }}>
            <img
              src="/logo.png"
              alt="Logo ShelfMate"
              style={{ width: "120px", marginBottom: "16px" }}
            />

            <img src="/forget-password.png" alt="Redefinir senha" className="auth-icon" />
            <h1 className="auth-title">Redefinir a Senha</h1>
            <p className="auth-sub">Digite as suas informações</p>
          </div>

          {step === 1 && (
            <form onSubmit={handleSendCode}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="row" style={{ marginTop: 16 }}>
                <button className="primary" type="submit" disabled={sending}>
                  {sending ? "Enviando..." : "Enviar Código"}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword}>
              <label htmlFor="code">Código encaminhado</label>
              <input
                id="code"
                type="text"
                placeholder="Digite o código encaminhado"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
              />

              {/* Campo de nova senha */}
              <label htmlFor="newpass">Nova senha</label>
              <div className="password-field">
                <input
                  id="newpass"
                  type={showNewPass ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    transition: "opacity 0.3s ease",
                    opacity: showNewPass ? 0.6 : 1,
                  }}
                >
                  <img
                    src={showNewPass ? "/eye-open.svg" : "/eye-closed.svg"}
                    alt="Mostrar senha"
                    style={{
                      width: "22px",
                      height: "22px",
                      pointerEvents: "none",
                      transition: "opacity 0.3s ease",
                    }}
                  />
                </span>
              </div>

              {/* Campo de confirmação */}
              <label htmlFor="confirmpass">Confirmar nova senha</label>
              <div className="password-field">
                <input
                  id="confirmpass"
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    transition: "opacity 0.3s ease",
                    opacity: showConfirmPass ? 0.6 : 1,
                  }}
                >
                  <img
                    src={showConfirmPass ? "/eye-open.svg" : "/eye-closed.svg"}
                    alt="Mostrar senha"
                    style={{
                      width: "22px",
                      height: "22px",
                      pointerEvents: "none",
                      transition: "opacity 0.3s ease",
                    }}
                  />
                </span>
              </div>

              <div className="row" style={{ marginTop: 16 }}>
                <button className="primary" type="submit">
                  Redefinir
                </button>
              </div>
            </form>
          )}

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

        <AuthIllustration
          images={["/image1.jpg", "/image2.png", "/image3.jpg", "/image4.jpg"]}
          intervalMs={3500}
        />
      </div>
      {toast && <div className="toast show" id="toast">{toast}</div>}
    </div>
  );
}
