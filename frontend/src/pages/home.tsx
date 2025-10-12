import React from "react";
import { useState, useEffect } from "react";
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/home.module.css';

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
    <div className={cssModule.statCard}>
        <div style={{ marginBottom: 8 }}>
            <Icon src={iconSrc} emoji={emoji} />
        </div>
        <div className={cssModule.title}>{title}</div>
        <div className={cssModule.value}>{value}</div>
    </div>
);

// layout handled by CSS module `home.module.css`

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
            <header className={cssModule.topbar}>
                <div className={cssModule.topbarLeft}>
                    <img src="/icons/logo.svg" alt="Shelf Mate" className={cssModule.logo} onError={(e) => (e.currentTarget.style.display = "none")} />
                    <div style={{ fontWeight: 700, fontSize: 18 }}>Shelf Mate</div>
                </div>

                <nav className={cssModule.topbarCenter}>
                    <button className={cssModule.topbarButton}>Home</button>
                    <button className={cssModule.topbarButton} style={{ background: 'transparent', color: 'rgba(255,255,255,0.9)' }}>Relatórios</button>
                    <button className={cssModule.topbarButton} style={{ background: 'transparent', color: 'rgba(255,255,255,0.9)' }}>Produtos</button>
                </nav>

                <div className={cssModule.topbarRight}>
                    <input className={cssModule.searchInput} placeholder="Pesquisar" />
                    <button className={cssModule.topbarButton} style={{ background: '#fff', color: '#1537c8' }}>Meus Produtos</button>
                    <img
                        src="/icons/user-circle.svg"
                        alt="user"
                        className={cssModule.userIcon}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                        onClick={handleLogout}
                        title="Sair"
                    />
                </div>
            </header>

            <main className={cssModule.pageWrap}>
                <section className={cssModule.hero}>
                    <div className={cssModule.heroText}>
                        <div className={cssModule.heroBadge}>📈 Seu estoque cresceu</div>
                        <h1 className={cssModule.heroTitle}>Bem-vindo de volta, William</h1>
                        <p className={cssModule.heroDesc}>
                            Gerencie seu estoque, acompanhe métricas e tome decisões baseadas em dados.
                            Tudo em um só lugar, simples e poderoso.
                        </p>

                        <div className={cssModule.heroActions}>
                            <button className={cssModule.ctaPrimary}>Meus Produtos ➜</button>
                            <button className={cssModule.ctaSecondary}>Ver Relatórios</button>
                        </div>
                    </div>

                    <div className={cssModule.heroImages}>
                        <img src="/hero1.jpg" alt="hero1" className={cssModule.heroImg} onError={(e) => (e.currentTarget.style.display = "none")} />
                        <img src="/hero2.jpg" alt="hero2" className={cssModule.heroImg} onError={(e) => (e.currentTarget.style.display = "none")} />
                    </div>
                </section>

                <section style={{ marginTop: 28 }}>
                    <h3 className={cssModule.accessHeader}>Acesso Rápido</h3>
                    <p className={cssModule.accessSub}>Sua movimentação nos últimos 30 dias</p>

                    <div className={cssModule.statGrid}>
                        <StatCard title="Últimos Acessos" value="30 LogIns" iconSrc="/icons/clock.svg" emoji="🕒" />
                        <StatCard title="Produtos Inseridos" value="40 SKUs" iconSrc="/icons/box.svg" emoji="📦" />
                        <StatCard title="Mudanças no Perfil" value="2 Mudanças" iconSrc="/icons/settings.svg" emoji="⚙️" />
                        <StatCard title="Relatórios Baixados" value="30 Emitidos" iconSrc="/icons/report.svg" emoji="📄" />
                        <StatCard title="Alertas Emitidos" value="50 Enviados" iconSrc="/icons/alert.svg" emoji="⚠️" />
                    </div>
                </section>

                <div className={cssModule.analytics}>
                    <div className={cssModule.analyticsCard}>
                        <h4>Tendência de Crescimento</h4>
                        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aa0b1' }}>[Gráfico de Linha Placeholder]</div>
                    </div>

                    <div className={cssModule.analyticsCard}>
                        <h4>Distribuição dos Produtos</h4>
                        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aa0b1' }}>[Gráfico de Pizza Placeholder]</div>
                    </div>

                    <div className={cssModule.analyticsCard}>
                        <h4>Principais Produtos</h4>
                        <div style={{ color: '#6b7280', marginTop: 8 }}>
                            <div><strong>SKU</strong> - <strong>Descrição</strong> • <strong>Qtd</strong></div>
                            <div style={{ marginTop: 12 }}><div>10056 • Monster de Laranja • 100</div></div>
                        </div>
                    </div>
                </div>

                <footer className={cssModule.siteFooter}>
                    <div className={cssModule.footerInner}>
                        <div className={cssModule.footerCol}>
                            <strong>Shelf Mate</strong>
                            <div style={{ fontSize: 13, opacity: 0.9 }}>Gerencie seu estoque, acompanhe métricas e tome decisões baseadas em dados.</div>
                        </div>

                        <div style={{ display: 'flex', gap: 24 }}>
                            <div className={cssModule.footerCol}>
                                <div style={{ fontWeight: 700 }}>Recursos</div>
                                <div style={{ fontSize: 13, opacity: 0.95 }}>Dashboard • Produtos • Configurações</div>
                            </div>
                            <div className={cssModule.footerCol}>
                                <div style={{ fontWeight: 700 }}>Suporte</div>
                                <div style={{ fontSize: 13, opacity: 0.95 }}>william.carvalho... • +55 11 98432-5997</div>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Home;
