import React, { useState } from "react";
import { useNavigation } from "../context/NavigationContext";
import { API_URLS } from "../config/api";
+import "../styles/auth.css";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const { navigateTo } = useNavigation();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

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
        alert("❌ Falha ao enviar código: " + (error.error || "Erro desconhecido"));
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

    if (!newPassword || newPassword.length < 6) {
      alert("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      const response = await fetch(API_URLS.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recoveryCode, newPassword }),
      });

      if (response.ok) {
        alert("✅ Senha redefinida com sucesso!");
        // Navegar para a página de login após redefinição bem-sucedida
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
-      <h2>🔑 Redefinir Senha</h2>
+      <div style={{ textAlign: "center" }}>
+        <img src="/forget-password.png" alt="Redefinir senha" className="auth-icon" />
+        <h2>Redefinir Senha</h2>
+      </div>
      
      {step === 1 && (
        <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
          <input
            type="email"
-            placeholder="📧 Email"
+            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
-          <button type="submit">➡️ Enviar Código de Recuperação</button>
+          <button type="submit">Enviar Código de Recuperação</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
          <input
            type="email"
-            placeholder="📧 Email"
+            placeholder="Email"
            value={email}
            disabled
          />
          <input
            type="text"
-            placeholder="🔢 Código de Recuperação"
+            placeholder="Código de Recuperação"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            required
          />
-          <button type="submit">➡️ Verificar Código</button>
+          <button type="submit">Verificar Código</button>
          <button type="button" onClick={() => setStep(1)} style={{ marginTop: "10px" }}>
-            🔄 Voltar
+            Voltar
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
          <input
            type="email"
-            placeholder="📧 Email"
+            placeholder="Email"
            value={email}
            disabled
          />
          <input
            type="text"
-            placeholder="🔢 Código de Recuperação"
+            placeholder="Código de Recuperação"
            value={recoveryCode}
            disabled
          />
          <input
            type="password"
-            placeholder="🔑 Nova Senha"
+            placeholder="Nova Senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
-          <button type="submit">➡️ Redefinir Senha</button>
+          <button type="submit">Redefinir Senha</button>
          <button type="button" onClick={() => setStep(2)} style={{ marginTop: "10px" }}>
-            🔄 Voltar
+            Voltar
          </button>
        </form>
      )}
      
      {/* Botões de navegação para teste */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={() => navigateTo("login")} style={{ padding: "5px 10px" }}>
-          🔐 Voltar ao Login
+          Voltar ao Login
        </button>
        <button onClick={() => navigateTo("forgot-password")} style={{ padding: "5px 10px" }}>
-          🔑 Esqueci a Senha
+          Esqueci a Senha
        </button>
      </div>
    </div>
  );
}
