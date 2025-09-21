import React, { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("https://shelfmaterender.onrender.com/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsEmailSent(true);
        alert("✅ Password reset email sent!");
      } else {
        const error = await response.json();
        alert("❌ Failed to send reset email: " + (error.message || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Error connecting to server.");
    }
  };

  if (isEmailSent) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2>📧 Email Sent!</h2>
        <p>Check your email for password reset instructions.</p>
        <button onClick={() => setIsEmailSent(false)}>🔄 Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2>🔑 Forgot Password</h2>
      <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
        <input
          type="email"
          placeholder="📧 Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">➡️ Send Reset Email</button>
      </form>
    </div>
  );
}
