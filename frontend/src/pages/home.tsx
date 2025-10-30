import React from "react";
import { API_URLS, API_CONFIG } from '../config/api';
import { useState } from "react";
import useCurrentUser from '../hooks/useCurrentUser';
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/home.module.css';
import LineChart from "../components/LineChart";
import PieChart from "../components/PieChart";
import TopProductsTable from "../components/TopProductsTable";
import Toast from '../components/Toast';
import LoadingScreen from '../components/LoadingScreen';


type IconProps = { src: string; emoji: string; alt?: string; style?: React.CSSProperties };
const Icon: React.FC<IconProps> = ({ src, emoji, alt = "", style }) => {
    const [error, setError] = React.useState(false);
    if (error) return <span style={{ fontSize: 72, lineHeight: '72px', display: 'inline-block' }}>{emoji}</span>;
    return (
        <img
            src={src}
            alt={alt}
            style={{ width: 72, height: 72, objectFit: "contain", ...style }}
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
    const [toastMsg, setToastMsg] = useState<string>('');
    const { navigateTo } = useNavigation();

    // mirror currentUser into local state for compatibility with existing handlers
    React.useEffect(() => { setUser(currentUser); }, [currentUser]);

    const handleLogout = () => {
        fetch(API_URLS.LOGOUT, { method: 'POST', credentials: 'include' }).finally(() => {
            localStorage.removeItem("user");
            setUser(null);
            setToastMsg("Logout realizado com sucesso!");
            navigateTo("login");
        });
    };

    // Carregar métricas da home
    React.useEffect(() => {
        const loadOverview = async () => {
            try {
                const res = await fetch(API_URLS.STATS_OVERVIEW, { credentials: 'include' });
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
                const stored = localStorage.getItem('user');
                const companyId = stored ? (JSON.parse(stored)?.company_id) : undefined;
                const url = companyId ? `${API_URLS.ACTIVITY_LAST_30_DAYS}?companyId=${companyId}` : API_URLS.ACTIVITY_LAST_30_DAYS;
                const res = await fetch(url, { credentials: 'include' });
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

    if (loading) return <LoadingScreen message="Carregando" subtext="Preparando sua página" />;

    return (
        <div style={{ minHeight: "100vh", background: "transparent" }}>
            <header className={cssModule.topbar}>
                <div className={cssModule.topbarLeft}>
                    <div className={cssModule.logoContainer}>
                        <img src="/logo-removebg.png" alt="ShelfMate" className={cssModule.logoImg} />
                        <div className={cssModule.logoText}>Shelf Mate</div>
                    </div>
                </div>

                <nav className={cssModule.topbarCenter}>
                    <button className={cssModule.navButton} onClick={() => navigateTo("home")}>
                        <img src="/home_white.png" alt="Home" className={cssModule.iconImg} />
                        <span className={cssModule.navLabel}>Home</span>
                    </button>
                    <button className={cssModule.navButton} onClick={() => navigateTo("statistics")}>
                        <img src="/statistcs.png" alt="Estatísticas" className={cssModule.iconImg} />
                        <span className={cssModule.navLabel}>Estatísticas</span>
                    </button>
                    <button className={cssModule.navButton} onClick={() => navigateTo("products")}>
                        <img src="/products.png" alt="Produtos" className={cssModule.iconImg} />
                        <span className={cssModule.navLabel}>Produtos</span>
                    </button>
                    <button className={cssModule.navButton} onClick={() => navigateTo("reports")}>
                        <img src="/reports.png" alt="Relatórios" className={cssModule.iconImg} />
                        <span className={cssModule.navLabel}>Relatórios</span>
                    </button>
                </nav>

                <div className={cssModule.topbarRight}>
                    <div className={cssModule.searchContainer}>
                        <img src="/search.png" alt="Buscar" className={cssModule.iconImg} />
                        <input
                          className={cssModule.searchInput}
                          placeholder="Pesquisar"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const q = (e.target as HTMLInputElement).value || '';
                              // Lazy import to keep bundle lean
                              import('../services/searchNavigation').then(({ getBestPageForQuery }) => {
                                const page = getBestPageForQuery(q);
                                navigateTo(page as any);
                              });
                            }
                          }}
                        />
                    </div>
                    <div className={cssModule.userContainer}>
                            <span className={cssModule.welcomeText}>Bem vindo {user?.name || 'Usuário'}</span>
                        <div className={cssModule.userDropdown}>
                            <div className={cssModule.userAvatar} onClick={() => setShowUserMenu(!showUserMenu)}>
                                <img
                                  src={user?.image ? `${API_CONFIG.BASE_URL}${user.image}` : '/user_profile.png'}
                                  alt={user?.name || 'Usuário'}
                                  className={cssModule.userPhoto}
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/user_profile.png'; }}
                                />
                                <span className={cssModule.dropdownArrow}>▼</span>
                            </div>
                            {showUserMenu && (
                                <div className={cssModule.userMenu}>
                                    <button className={cssModule.menuItem} onClick={() => navigateTo("settings")}>
                                        <img src="/config.png" alt="Configurações" className={cssModule.menuIconImg} />
                                        Configurações
                                    </button>
                                    <button className={cssModule.menuItem} onClick={handleLogout}>
                                        <img src="/exit.png" alt="Sair" className={cssModule.menuIconImg} />
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
                            <button className={cssModule.ctaPrimary} onClick={() => navigateTo("products")}>
                                Meus Produtos ➜
                            </button>
                            <button className={cssModule.ctaSecondary} onClick={() => navigateTo("reports")}>
                                Ver Relatórios
                            </button>
                        </div>
                    </div>
                </section>

                <section className={cssModule.quickAccess}>
                    <div className={cssModule.sectionHeader}>
                        <div className={cssModule.sectionTitleContainer}>
                            <h3 className={cssModule.accessHeader}>Acesso Rápido</h3>
                            <button className={cssModule.statsButton} onClick={() => navigateTo("statistics")}>
                                <img src="/statistcs.png" alt="Estatísticas" className={cssModule.iconImg} />
                                Veja suas Estatísticas Completas
                            </button>
                        </div>
                        <p className={cssModule.accessSub}>Sua movimentação nos últimos 30 dias</p>
                    </div>

                  <div className={cssModule.statGrid}>
                    <StatCard
                        title="Últimos Acessos"
                        value={`${activityData?.last_accesses ?? 0} Logins`}
                        iconSrc="/last-access.png"
                        emoji="🕒"
                    />
                    <StatCard
                        title="Produtos Inseridos"
                        value={`${activityData?.products_inserted ?? 0} SKUs`}
                        iconSrc="/products-blue.png"
                        emoji="📦"
                    />
                    <StatCard
                        title="Mudanças no Perfil"
                        value={`${activityData?.profile_changes ?? 0} Mudanças`}
                        iconSrc="/changes.png"
                        emoji="⚙️"
                    />
                    <StatCard
                        title="Relatórios Baixados"
                        value={`${activityData?.reports_downloaded ?? 0} Relatórios emitidos`}
                        iconSrc="/report-blue.png"
                        emoji="📄"
                    />
                    <StatCard
                        title="Alertas Emitidos"
                        value={`${activityData?.alerts_issued ?? 0} Alertas enviados`}
                        iconSrc="/alerts-blue.png"
                        emoji="⚠️"
                    />
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
                                <h4 className={cssModule.cardTitle}>Top 5 Mais Vendidos</h4>
                                <p className={cssModule.cardSubtitle}>Considerando Vendas dos Últimos 3 meses</p>
                            </div>
                            <div className={cssModule.chartContainer}>
                                <div className={cssModule.pieChart}>
                                    <PieChart />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            {toastMsg && (
                <Toast
                    message={toastMsg}
                    type="success"
                    onClose={() => setToastMsg('')}
                />
            )}
        </div>
    );
};

export default Home;
