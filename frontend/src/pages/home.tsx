import React from "react";
import { API_URLS } from '../config/api';
import { useState } from "react";
import useCurrentUser from '../hooks/useCurrentUser';
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/home.module.css';
import LineChart from "../components/LineChart";
import PieChart from "../components/PieChart";
import TopProductsTable from "../components/TopProductsTable";

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
    const [overview, setOverview] = useState<any>(null);
    const [activityData, setActivityData] = useState<any>(null);
    const { user: currentUser, loading } = useCurrentUser();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { navigateTo } = useNavigation();

    // mirror currentUser into local state for compatibility with existing handlers
    React.useEffect(() => { setUser(currentUser); }, [currentUser]);

    const handleLogout = () => {
        fetch(API_URLS.LOGOUT, { method: 'POST', credentials: 'include' }).finally(() => {
            localStorage.removeItem("user");
            setUser(null);
            alert("👋 Logout realizado com sucesso!");
            navigateTo("login");
        });
    };

    // Carregar métricas da home
    React.useEffect(() => {
        const loadOverview = async () => {
            try {
                const res = await fetch(API_URLS.STATS_OVERVIEW);
                if (!res.ok) throw new Error('Falha ao buscar overview');
                const data = await res.json();
                setOverview(data);
            } catch (e) {
                console.error(e);
                setOverview(null);
            }
        };
        loadOverview();
    }, []);

    // Carregar dados de atividade dos últimos 30 dias
    React.useEffect(() => {
        const loadActivityData = async () => {
            try {
                const res = await fetch(API_URLS.ACTIVITY_LAST_30_DAYS);
                if (!res.ok) throw new Error('Falha ao buscar dados de atividade');
                const data = await res.json();
                setActivityData(data);
            } catch (e) {
                console.error(e);
                setActivityData(null);
            }
        };
        loadActivityData();
    }, []);

    if (loading) return <div style={{ padding: 40 }}>⏳ Carregando...</div>;

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
                            <span className={cssModule.welcomeText}>Bem vindo {user?.name || 'Usuário'}</span>
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
                            <h1 className={cssModule.heroTitle}>Bem-vindo de volta, {user?.name || 'Usuário'}</h1>
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
                        <StatCard title="Últimos Acessos" value={`${activityData?.last_accesses ?? 0} LogIns`} iconSrc="/icons/clock.svg" emoji="🕒" />
                        <StatCard title="Produtos Inseridos" value={`${activityData?.products_inserted ?? 0} SKUs`} iconSrc="/icons/box.svg" emoji="📦" />
                        <StatCard title="Mudanças no Perfil" value={`${activityData?.profile_changes ?? 0} Mudanças`} iconSrc="/icons/settings.svg" emoji="⚙️" />
                        <StatCard title="Relatórios Baixados" value={`${activityData?.reports_downloaded ?? 0} Emitidos`} iconSrc="/icons/report.svg" emoji="📄" />
                        <StatCard title="Alertas Emitidos" value={`${activityData?.alerts_issued ?? 0} Enviados`} iconSrc="/icons/alert.svg" emoji="⚠️" />
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
                                    <LineChart />
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
                                    <PieChart />
                                </div>
                            </div>
                        </div>

                        <div className={cssModule.analyticsCard}>
                            <div className={cssModule.cardHeader}>
                                <h4 className={cssModule.cardTitle}>Principais Produtos</h4>
                                <p className={cssModule.cardSubtitle}>Considerando Vendas dos Últimos 3 meses</p>
                            </div>
                            <TopProductsTable className={cssModule.productsTable} />
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
                                +55 11 98432-5997
                            </div>
                            <div className={cssModule.contactInfo}>
                                joao.timotio.103916@a.fecaf.com.br
                            </div>
                            <div className={cssModule.contactInfo}>
                                +55 11 96954-1207
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
