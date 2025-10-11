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
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 10,
        padding: 18,
        width: 190,
        textAlign: "center",
        boxShadow: "0 6px 20px rgba(6,24,44,0.06)",
        background: "#fff"
    }}>
        <div style={{ marginBottom: 8 }}>
            <Icon src={iconSrc} emoji={emoji} />
        </div>
        <div style={{ color: "#6b7280", fontSize: 13 }}>{title}</div>
        <div style={{ color: "#1537c8", fontWeight: 700, fontSize: 16, marginTop: 6 }}>{value}</div>
    </div>
);

const styles = {
    topbar: {
        background: "#1537c8",
        color: "#fff",
        padding: "12px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 12px rgba(21,55,200,0.12)"
    } as React.CSSProperties,
    topbarCenterIcons: { display: "flex", gap: 18, alignItems: "center" } as React.CSSProperties,
    pageWrap: { maxWidth: 1200, margin: "28px auto", padding: "0 20px" } as React.CSSProperties,
    hero: {
        display: "flex",
        gap: 28,
        alignItems: "center",
        background: "#fff",
        padding: 28,
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(6,24,44,0.06)"
    } as React.CSSProperties,
    heroText: { flex: 1 } as React.CSSProperties,
    heroImages: { width: 420, display: "flex", gap: 8 } as React.CSSProperties,
};

const Home: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { navigateTo } = useNavigation();

    useEffect(() => {
        const u = localStorage.getItem("user");
        if (u) setUser(JSON.parse(u));
        setLoading(false);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        alert("👋 Logout realizado com sucesso!");
        navigateTo("login");
    };

    if (loading) return <div style={{ padding: 40 }}>⏳ Carregando...</div>;
    if (!user) return (
        <div style={{ padding: 40, textAlign: "center" }}>
            <h2>🏠 Home</h2>
            <p>Você não está logado. Por favor, faça login para acessar seu perfil.</p>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "transparent" }}>
            <div style={styles.topbar}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src="/icons/logo.svg" alt="Shelf Mate" style={{ width: 44, height: 44 }} onError={(e) => (e.currentTarget.style.display = "none")} />
                    <div style={{ fontWeight: 700, fontSize: 18 }}>Shelf Mate</div>
                </div>

                <div style={styles.topbarCenterIcons}>
                    <button style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "#fff",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: 8
                    }}>Home</button>
                    <button style={{
                        background: "transparent",
                        color: "rgba(255,255,255,0.9)",
                        border: "none"
                    }}>Relatórios</button>
                    <button style={{
                        background: "transparent",
                        color: "rgba(255,255,255,0.9)",
                        border: "none"
                    }}>Produtos</button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input placeholder="Pesquisar" style={{ padding: "8px 12px", borderRadius: 8, border: "none", width: 220 }} />
                    <button style={{ background: "#fff", color: "#1537c8", border: "none", padding: "8px 12px", borderRadius: 8 }}>Meus Produtos</button>
                    <img
                        src="/icons/user-circle.svg"
                        alt="user"
                        style={{ width: 36, height: 36, cursor: "pointer", borderRadius: 999 }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                        onClick={handleLogout}
                        title="Sair"
                    />
                </div>
            </div>

            <div style={styles.pageWrap as React.CSSProperties}>
                <section style={styles.hero}>
                    <div style={styles.heroText}>
                        <div style={{ display: "inline-block", background: "#ecf4ff", color: "#0b6ed1", padding: "6px 10px", borderRadius: 20, marginBottom: 12 }}>📈 Seu estoque cresceu</div>
                        <h1 style={{ color: "#1537c8", fontSize: 42, margin: "6px 0 12px" }}>Bem-vindo de volta, William</h1>
                        <p style={{ color: "#6b7280", fontSize: 15, maxWidth: 680 }}>
                            Gerencie seu estoque, acompanhe métricas e tome decisões baseadas em dados.
                            Tudo em um só lugar, simples e poderoso.
                        </p>

                        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                            <button style={{ background: "#1537c8", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8 }}>Meus Produtos ➜</button>
                            <button style={{ background: "#fff", color: "#1537c8", border: "1px solid #cfe0ff", padding: "10px 18px", borderRadius: 8 }}>Ver Relatórios</button>
                        </div>
                    </div>

                    <div style={styles.heroImages}>
                        <img src="/hero1.jpg" alt="hero1" style={{ width: "50%", borderRadius: 10, objectFit: "cover" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                        <img src="/hero2.jpg" alt="hero2" style={{ width: "50%", borderRadius: 10, objectFit: "cover" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                    </div>
                </section>

                <section style={{ marginTop: 28 }}>
                    <h3 style={{ color: "#1537c8", marginBottom: 4 }}>Acesso Rápido</h3>
                    <p style={{ color: "#9aa0b1", marginTop: 0 }}>Sua movimentação nos últimos 30 dias</p>

                    <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                        <StatCard title="Últimos Acessos" value="30 LogIns" iconSrc="/icons/clock.svg" emoji="🕒" />
                        <StatCard title="Produtos Inseridos" value="40 SKUs" iconSrc="/icons/box.svg" emoji="📦" />
                        <StatCard title="Mudanças no Perfil" value="2 Mudanças" iconSrc="/icons/settings.svg" emoji="⚙️" />
                        <StatCard title="Relatórios Baixados" value="30 Emitidos" iconSrc="/icons/report.svg" emoji="📄" />
                        <StatCard title="Alertas Emitidos" value="50 Enviados" iconSrc="/icons/alert.svg" emoji="⚠️" />
                    </div>
                </section>

                <footer style={{ marginTop: 40, background: "linear-gradient(90deg,#1537c8,#2d3dd6)", color: "#fff", padding: 18, borderRadius: 8 }}>
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
            </div>
        </div>
    );
};

export default Home;
