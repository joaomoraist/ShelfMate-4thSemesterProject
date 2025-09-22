import React, { useState, useEffect } from "react";
import { useNavigation } from "../context/NavigationContext";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { navigateTo } = useNavigation();

  useEffect(() => {
    // Verificar se usuário está logado
    const user = localStorage.getItem("user");
    if (user) {
      setUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);


  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    alert("👋 Logout realizado com sucesso!");
    // Navegar para a página de login após logout
    navigateTo("login");
  };

  if (loading) {
    return <div>⏳ Carregando...</div>;
  }

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2>🏠 Home</h2>
        <p>Você não está logado.</p>
        <p>Por favor, faça login para acessar seu perfil.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2>🏠 Home</h2>
      <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", margin: "20px" }}>
        <h3>👤 Perfil do Usuário</h3>
        <p><strong>Nome:</strong> {user.name || "N/A"}</p>
        <p><strong>Email:</strong> {user.email || "N/A"}</p>
        <p><strong>ID:</strong> {user.id || "N/A"}</p>
        <p><strong>Criado em:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p>
      </div>
      <button onClick={handleLogout} style={{ marginTop: "20px" }}>
        🚪 Sair
      </button>
    </div>
  );
}
