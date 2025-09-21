import React, { useState } from "react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("❌ Passwords don't match!");
      return;
    }

    try {
      const response = await fetch("https://shelfmaterender.onrender.com/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("✅ Signup successful! User ID: " + data.userId);
      } else {
        const error = await response.json();
        alert("❌ Signup failed: " + (error.message || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Error connecting to server.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2>📝 Sign Up</h2>
      <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
        <input
          type="text"
          placeholder="👤 Name"
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
          placeholder="🔑 Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="🔑 Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">➡️ Sign Up</button>
      </form>
    </div>
  );
}
