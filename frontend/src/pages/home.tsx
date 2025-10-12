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
    const [showUserMenu, setShowUserMenu] = useState(false);
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
                    <div className={cssModule.logoContainer}>
                        <div className={cssModule.logoIcon}>📦</div>
                        <div className={cssModule.logoText}>Shelf Mate</div>
                    </div>
                </div>

                <nav className={cssModule.topbarCenter}>
                    <button className={cssModule.navButton} data-active="true">
                        <span className={cssModule.navIcon}>🏠</span>
                        <span className={cssModule.navLabel}>Home</span>
                    </button>
                    <button className={cssModule.navButton} onClick={() => navigateTo("statistics")}>
                        <span className={cssModule.navIcon}>📊</span>
                        <span className={cssModule.navLabel}>Estatísticas</span>
                    </button>
                    <button className={cssModule.navButton} onClick={() => navigateTo("products")}>
                        <span className={cssModule.navIcon}>📦</span>
                        <span className={cssModule.navLabel}>Produtos</span>
                    </button>
                    <button className={cssModule.navButton} onClick={() => navigateTo("reports")}>
                        <span className={cssModule.navIcon}>📄</span>
                        <span className={cssModule.navLabel}>Relatórios</span>
                    </button>
                </nav>

                <div className={cssModule.topbarRight}>
                    <div className={cssModule.searchContainer}>
                        <span className={cssModule.searchIcon}>🔍</span>
                        <input className={cssModule.searchInput} placeholder="Pesquisar" />
                    </div>
                    <div className={cssModule.userContainer}>
                        <span className={cssModule.welcomeText}>Bem vindo William</span>
                        <div className={cssModule.userDropdown}>
                            <div className={cssModule.userAvatar} onClick={() => setShowUserMenu(!showUserMenu)}>
                                <span className={cssModule.userIcon}>👤</span>
                                <span className={cssModule.dropdownArrow}>▼</span>
                            </div>
                            {showUserMenu && (
                                <div className={cssModule.userMenu}>
                                    <button className={cssModule.menuItem} onClick={() => setShowUserMenu(false)}>
                                        <span className={cssModule.menuIcon}>⚙️</span>
                                        Editar suas Informações
                                    </button>
                                    <button className={cssModule.menuItem} onClick={handleLogout}>
                                        <span className={cssModule.menuIcon}>→</span>
                                        Sair
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className={cssModule.pageWrap}>
                <section className={cssModule.hero}>
                    <div className={cssModule.heroContent}>
                        <div className={cssModule.heroBadge}>
                            <span className={cssModule.badgeIcon}>✓</span>
                            <span>Seu estoque cresceu</span>
                        </div>
                        <h1 className={cssModule.heroTitle}>Bem-vindo de volta, William</h1>
                        <p className={cssModule.heroDesc}>
                            Gerencie seu estoque, acompanhe métricas e tome decisões baseadas em dados. Tudo em um só lugar, simples e poderoso.
                        </p>

                        <div className={cssModule.heroActions}>
                            <button className={cssModule.ctaPrimary}>
                                Meus Produtos ➜
                            </button>
                            <button className={cssModule.ctaSecondary}>
                                Ver Relatórios
                            </button>
                        </div>
                    </div>
                </section>

                <section className={cssModule.quickAccess}>
                    <div className={cssModule.sectionHeader}>
                        <div className={cssModule.sectionTitleContainer}>
                            <h3 className={cssModule.accessHeader}>Acesso Rápido</h3>
                            <button className={cssModule.statsButton}>
                                <span className={cssModule.statsIcon}>📊</span>
                                Veja suas Estatísticas Completas
                            </button>
                        </div>
                        <p className={cssModule.accessSub}>Sua movimentação nos últimos 30 dias</p>
                    </div>

                    <div className={cssModule.statGrid}>
                        <StatCard title="Últimos Acessos" value="30 LogIns" iconSrc="/icons/clock.svg" emoji="🕒" />
                        <StatCard title="Produtos Inseridos" value="40 SKUs" iconSrc="/icons/box.svg" emoji="📦" />
                        <StatCard title="Mudanças no Perfil" value="2 Mudanças" iconSrc="/icons/settings.svg" emoji="⚙️" />
                        <StatCard title="Relatórios Baixados" value="30 Emitidos" iconSrc="/icons/report.svg" emoji="📄" />
                        <StatCard title="Alertas Emitidos" value="50 Enviados" iconSrc="/icons/alert.svg" emoji="⚠️" />
                    </div>
                </section>

                <section className={cssModule.analyticsSection}>
                    <div className={cssModule.analyticsHeader}>
                        <h3 className={cssModule.analyticsTitle}>Análise e Relatórios</h3>
                        <p className={cssModule.analyticsSubtitle}>Acompanhe o Desempenho dos seus principais Produtos</p>
                    </div>

                    <div className={cssModule.analytics}>
                        <div className={cssModule.analyticsCard}>
                            <div className={cssModule.cardHeader}>
                                <h4 className={cssModule.cardTitle}>Tendência de Crescimento</h4>
                                <p className={cssModule.cardSubtitle}>Considerando os Próximos 3 meses</p>
                            </div>
                            <div className={cssModule.chartContainer}>
                                <div className={cssModule.lineChart}>
                                    <div className={cssModule.chartPlaceholder}>📈 Gráfico de Linha</div>
                                </div>
                            </div>
                        </div>

                        <div className={cssModule.analyticsCard}>
                            <div className={cssModule.cardHeader}>
                                <h4 className={cssModule.cardTitle}>Distribuição dos Produtos</h4>
                                <p className={cssModule.cardSubtitle}>Considerando Vendas dos últimos 3 meses</p>
                            </div>
                            <div className={cssModule.chartContainer}>
                                <div className={cssModule.pieChart}>
                                    <div className={cssModule.chartPlaceholder}>🥧 Gráfico de Pizza</div>
                                </div>
                            </div>
                        </div>

                        <div className={cssModule.analyticsCard}>
                            <div className={cssModule.cardHeader}>
                                <h4 className={cssModule.cardTitle}>Principais Produtos</h4>
                                <p className={cssModule.cardSubtitle}>Considerando Vendas dos Últimos 3 meses</p>
                            </div>
                            <div className={cssModule.productsTable}>
                                <div className={cssModule.tableHeader}>
                                    <span className={cssModule.tableColumn}>SKU</span>
                                    <span className={cssModule.tableColumn}>Descrição</span>
                                    <span className={cssModule.tableColumn}>Qntd</span>
                                </div>
                                <div className={cssModule.tableRow}>
                                    <span className={cssModule.tableCell}>10056</span>
                                    <span className={cssModule.tableCell}>Monster de Laranja</span>
                                    <span className={cssModule.tableCell}>100</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className={cssModule.siteFooter}>
                    <div className={cssModule.footerInner}>
                        <div className={cssModule.footerSection}>
                            <div className={cssModule.footerTitle}>Shelf Mate</div>
                            <div className={cssModule.footerDescription}>
                                Gerencie seu estoque, acompanhe métricas e tome decisões baseadas em dados.
                            </div>
                        </div>

                        <div className={cssModule.footerSection}>
                            <div className={cssModule.footerTitle}>Recursos</div>
                            <div className={cssModule.footerLinks}>
                                Dashboard • Produtos • Configurações
                            </div>
                        </div>

                        <div className={cssModule.footerSection}>
                            <div className={cssModule.footerTitle}>Código Fonte</div>
                            <div className={cssModule.footerDescription}>
                                Acesse nosso Github e Conheça toda nossa infraestrutura
                            </div>
                            <div className={cssModule.githubLink}>
                                https://github.com/will-csc/ShelfMate-4thSemesterProject
                            </div>
                        </div>

                        <div className={cssModule.footerSection}>
                            <div className={cssModule.footerTitle}>Suporte</div>
                            <div className={cssModule.contactInfo}>
                                william.carvalho.105637@a.fecaf.com.br
                            </div>
                            <div className={cssModule.contactInfo}>
                                joao.timotio.103916@a.fecaf.com.br
                            </div>
                            <div className={cssModule.contactInfo}>
                                +55 11 98432-5997
                            </div>
                        </div>

                        <div className={cssModule.footerSection}>
                            <div className={cssModule.footerTitle}>Desenvolvedores</div>
                            <div className={cssModule.developerList}>
                                <div>william.carvalho.105637@a.fecaf.com.br</div>
                                <div>eduardo.silva.100462@a.fecaf.com.br</div>
                                <div>joao.timotio.103916@a.fecaf.com.br</div>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Home;
