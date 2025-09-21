import React, { useState, useEffect } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular verificação de token/usuário logado
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch("https://shelfmaterender.onrender.com/api/user/profile", {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        alert("❌ Failed to fetch user data");
      }
    } catch (error) {
      console.error(error);
      alert("⚠️ Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    alert("👋 Logged out successfully!");
  };

  if (loading) {
    return <div>⏳ Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2>🏠 Home</h2>
        <p>You are not logged in.</p>
        <p>Please login to access your profile.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2>🏠 Home</h2>
      <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", margin: "20px" }}>
        <h3>👤 User Profile</h3>
        <p><strong>Name:</strong> {user.name || "N/A"}</p>
        <p><strong>Email:</strong> {user.email || "N/A"}</p>
        <p><strong>ID:</strong> {user.id || "N/A"}</p>
        <p><strong>Created:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
      </div>
      <button onClick={handleLogout} style={{ marginTop: "20px" }}>
        🚪 Logout
      </button>
    </div>
  );
}
