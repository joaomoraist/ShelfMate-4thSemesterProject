import React from "react";
import { useState, useEffect } from "react";
import { useNavigation } from "../context/NavigationContext";

type IconProps = { src: string; emoji: string; alt?: string; style?: React.CSSProperties };
const Icon: React.FC<IconProps> = ({ src, emoji, alt = "", style }) => {
    const [error, setError] = React.useState(false);
    if (error) return <span style={{ fontSize: 28 }}>{emoji}</span>;
    return (
        <img
            src={src}
            alt={alt}
            style={{ width: 40, height: 40, objectFit: "contain", ...style }}
            onError={() => setError(true)}
        />
    );
};

const StatCard: React.FC<{ title: string; value: string; iconSrc: string; emoji: string }> = ({ title, value, iconSrc, emoji }) => (
    <div style={{
        border: "1px solid #e6e6e6",
        borderRadius: 10,
        padding: 18,
        width: 160,
        textAlign: "center",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
        background: "#fff"
    }}>
        <div style={{ marginBottom: 8 }}>
            <Icon src={iconSrc} emoji={emoji} />
        </div>
        <div style={{ color: "#666", fontSize: 13 }}>{title}</div>
        <div style={{ color: "#1537c8", fontWeight: 700, fontSize: 18, marginTop: 6 }}>{value}</div>
    </div>
);

const Home: React.FC = () => {
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
        <main style={{ fontFamily: "Inter, Arial, sans-serif", padding: 28, color: "#222" }}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src="/icons/logo.svg" alt="Shelf Mate" style={{ width: 44, height: 44 }} onError={(e)=> (e.currentTarget.style.display='none')} />
                    <h1 style={{ margin: 0, color: "#1537c8" }}>Shelf Mate</h1>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <button style={{ background: "#1537c8", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8 }}>Meus Produtos</button>
                    <img
                        src="/icons/user-circle.svg"
                        alt="user"
                        style={{ width: 36, height: 36, cursor: "pointer" }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                        onClick={handleLogout}
                        title="Sair"
                    />
                </div>
            </header>

            <section style={{ display: "flex", gap: 28, alignItems: "center", marginBottom: 36 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "inline-block", background: "#ecf4ff", color: "#0b6ed1", padding: "6px 10px", borderRadius: 20, marginBottom: 16 }}>📈 Seu estoque cresceu</div>
                    <h2 style={{ color: "#1537c8", fontSize: 40, margin: "6px 0 12px" }}>Bem-vindo de volta, William</h2>
                    <p style={{ color: "#666", maxWidth: 640 }}>
                        Gerencie seu estoque, acompanhe métricas e tome decisões baseadas em dados.
                        Tudo em um só lugar, simples e poderoso.
                    </p>
                    <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
                        <button style={{ background: "#1537c8", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8 }}>Meus Produtos ➜</button>
                        <button style={{ background: "#fff", color: "#1537c8", border: "1px solid #cfe0ff", padding: "10px 16px", borderRadius: 8 }}>Ver Relatórios</button>
                    </div>
                </div>

                <div style={{ width: 420, display: "flex", gap: 8 }}>
                    <img src="/hero1.jpg" alt="hero1" style={{ width: "50%", borderRadius: 10, objectFit: "cover" }} onError={(e)=> (e.currentTarget.style.display='none')} />
                    <img src="/hero2.jpg" alt="hero2" style={{ width: "50%", borderRadius: 10, objectFit: "cover" }} onError={(e)=> (e.currentTarget.style.display='none')} />
                </div>
            </section>

            <section style={{ marginBottom: 28 }}>
                <h3 style={{ color: "#1537c8" }}>Acesso Rápido</h3>
                <p style={{ color: "#9aa0b1", marginTop: 6 }}>Sua movimentação nos últimos 30 dias</p>

                <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                    <StatCard title="Últimos Acessos" value="30 LogIns" iconSrc="/icons/clock.svg" emoji="🕒" />
                    <StatCard title="Produtos Inseridos" value="40 SKUs" iconSrc="/icons/box.svg" emoji="📦" />
                    <StatCard title="Mudanças no Perfil" value="2 Mudanças" iconSrc="/icons/settings.svg" emoji="⚙️" />
                    <StatCard title="Relatórios Baixados" value="30 Emitidos" iconSrc="/icons/report.svg" emoji="📄" />
                    <StatCard title="Alertas Emitidos" value="50 Enviados" iconSrc="/icons/alert.svg" emoji="⚠️" />
                </div>
            </section>

            <footer style={{ marginTop: 44, background: "linear-gradient(90deg,#1537c8,#2d3dd6)", color: "#fff", padding: 18, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                        <strong>Shelf Mate</strong>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>Gerencie seu estoque, acompanhe métricas e tome decisões baseadas em dados.</div>
                    </div>
                    <div style={{ display: "flex", gap: 24 }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>Recursos</div>
                            <div style={{ fontSize: 13, opacity: 0.95 }}>Dashboard • Produtos • Configurações</div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>Suporte</div>
                            <div style={{ fontSize: 13, opacity: 0.95 }}>william.carvalho... • +55 11 98432-5997</div>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
};

export default Home;
