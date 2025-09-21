import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("https://shelfmaterender.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("✅ Login successful! Token: " + data.token);
      } else {
        alert("❌ Invalid login!");
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Error connecting to server.");
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
          placeholder="🔑 Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">➡️ Login</button>
      </form>
    </div>
  );
}
