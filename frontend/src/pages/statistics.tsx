import React from "react";
import { API_URLS, API_CONFIG } from '../config/api';
import { useState } from "react";
import useCurrentUser from '../hooks/useCurrentUser';
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/statistics.module.css';
import homeCssModule from '../styles/home.module.css';
import LineChart from "../components/LineChart";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import TopProductsTable from "../components/TopProductsTable";
import Toast from '../components/Toast';
import LoadingScreen from '../components/LoadingScreen';

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

const MetricCard: React.FC<{ 
    title: string; 
    value: string; 
    iconSrc: string; 
    emoji: string 
}> = ({ title, value, iconSrc, emoji }) => (
    <div className={cssModule.metricCard}>
        <div className={cssModule.metricHeader}>
            <div className={cssModule.metricIcon}>
                <Icon src={iconSrc} emoji={emoji} />
            </div>
            <div className={cssModule.metricTitle}>{title}</div>
        </div>
        <div className={cssModule.metricValue}>{value}</div>
    </div>
);

const Statistics: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const { user: currentUser, loading } = useCurrentUser();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [toastMsg, setToastMsg] = useState<string>('');
    const { navigateTo } = useNavigation();
    const [overview, setOverview] = useState<any>(null);
    const [lowStockCount, setLowStockCount] = useState<number>(0);
    
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

    // carregar métricas e contagem de produtos com estoque baixo
    React.useEffect(() => {
        const load = async () => {
            try {
                const stored = localStorage.getItem('user');
                const companyId = stored ? (JSON.parse(stored)?.company_id) : undefined;

                // Overview
                const overviewUrl = companyId ? `${API_URLS.STATS_OVERVIEW}?companyId=${companyId}` : API_URLS.STATS_OVERVIEW;
                const overviewRes = await fetch(overviewUrl, { credentials: 'include' });
                if (!overviewRes.ok) throw new Error('Falha ao buscar overview');
                const overviewData = await overviewRes.json();
                setOverview(overviewData);

                // Produtos para calcular estoque baixo (< 10)
                const productsUrl = companyId ? `${API_URLS.STATS_PRODUCTS}?companyId=${companyId}` : API_URLS.STATS_PRODUCTS;
                const productsRes = await fetch(productsUrl, { credentials: 'include' });
                if (!productsRes.ok) throw new Error('Falha ao buscar produtos');
                const productsData = await productsRes.json();
                const rows = (productsData?.rows ?? []) as Array<any>;
                // Contar produtos com status exatamente 'Estoque Baixo'
                const countLow = rows.filter(r => String(r?.status) === 'Estoque Baixo').length;
                setLowStockCount(countLow);
            } catch (e) {
                console.error(e);
                setOverview(null);
                setLowStockCount(0);
            }
        };
        load();
    }, []);

    if (loading) return <LoadingScreen message="Carregando" subtext="Preparando suas estatísticas" />;
    if (!user) return (
        <div style={{ padding: 40, textAlign: "center" }}>
            <h2>📊 Estatísticas</h2>
            <p>Você não está logado. Por favor, faça login para acessar suas estatísticas.</p>
            {toastMsg && (
                <Toast
                    message={toastMsg}
                    type="success"
                    onClose={() => setToastMsg('')}
                />
            )}
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "transparent" }}>
            <header className={homeCssModule.topbar}>
                <div className={homeCssModule.topbarLeft}>
                    <div className={homeCssModule.logoContainer}>
                        <img src="/logo-removebg.png" alt="ShelfMate" className={homeCssModule.logoImg} />
                        <div className={homeCssModule.logoText}>Shelf Mate</div>
                    </div>
                </div>

                <nav className={homeCssModule.topbarCenter}>
                    <button className={homeCssModule.navButton} onClick={() => navigateTo("home")}>
                        <img src="/home_white.png" alt="Home" className={homeCssModule.iconImg} />
                        <span className={homeCssModule.navLabel}>Home</span>
                    </button>
                    <button className={homeCssModule.navButton} data-active="true">
                        <img src="/statistcs.png" alt="Estatísticas" className={homeCssModule.iconImg} />
                        <span className={homeCssModule.navLabel}>Estatísticas</span>
                    </button>
                    <button className={homeCssModule.navButton} onClick={() => navigateTo("products")}>
                        <img src="/products.png" alt="Produtos" className={homeCssModule.iconImg} />
                        <span className={homeCssModule.navLabel}>Produtos</span>
                    </button>
                    <button className={homeCssModule.navButton} onClick={() => navigateTo("reports")}>
                        <img src="/reports.png" alt="Relatórios" className={homeCssModule.iconImg} />
                        <span className={homeCssModule.navLabel}>Relatórios</span>
                    </button>
                </nav>

                <div className={homeCssModule.topbarRight}>
                    <div className={homeCssModule.searchContainer}>
                        <img src="/search.png" alt="Buscar" className={homeCssModule.iconImg} />
                        <input
                          className={homeCssModule.searchInput}
                          placeholder="Pesquisar"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const q = (e.target as HTMLInputElement).value || '';
                              import('../services/searchNavigation').then(({ getBestPageForQuery }) => {
                                const page = getBestPageForQuery(q);
                                navigateTo(page as any);
                              });
                            }
                          }}
                        />
                    </div>
                    <div className={homeCssModule.userContainer}>
                        <span className={homeCssModule.welcomeText}>Bem vindo {user?.name || 'Usuário'}</span>
                        <div className={homeCssModule.userDropdown}>
                            <div className={homeCssModule.userAvatar} onClick={() => setShowUserMenu(!showUserMenu)}>
                                <img
                                  src={user?.image ? `${API_CONFIG.BASE_URL}${user.image}` : '/user_profile.png'}
                                  alt={user?.name || 'Usuário'}
                                  className={homeCssModule.userPhoto}
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/user_profile.png'; }}
                                />
                                <span className={homeCssModule.dropdownArrow}>▼</span>
                            </div>
                            {showUserMenu && (
                                <div className={homeCssModule.userMenu}>
                                    <button className={homeCssModule.menuItem} onClick={() => navigateTo("settings")}>
                                        <img src="/config.png" alt="Configurações" className={homeCssModule.menuIconImg} />
                                        Configurações
                                    </button>
                                    <button className={homeCssModule.menuItem} onClick={handleLogout}>
                                        <img src="/exit.png" alt="Sair" className={homeCssModule.menuIconImg} />
                                        Sair
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className={cssModule.pageWrap}>
                <section className={cssModule.pageHeader}>
                    <h1 className={cssModule.pageTitle}>Estatísticas</h1>
                    <p className={cssModule.pageSubtitle}>
                        Acompanhe suas estatísticas e tome suas decisões baseadas em dados
                    </p>
                </section>



                <section className={cssModule.metricsSection}>
                    <div className={cssModule.metricsGrid}>
                        <MetricCard
                            title="Total de Produtos"
                            value={`${overview?.products_count ?? 0}`}
                            iconSrc="/products-blue.png"
                            emoji="📦"
                        />
                        <MetricCard
                            title="Valor em Estoque"
                            value={`R$ ${(overview?.total_stock_value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            iconSrc="/money.png"
                            emoji="💰"
                        />
                        <MetricCard
                            title="Produtos com Estoque Baixo"
                            value={`${lowStockCount}`}
                            iconSrc="/alerts-blue.png"
                            emoji="⚠️"
                        />
                        <MetricCard
                            title="Vendas no Período"
                            value={`${overview?.total_sold_qntd ?? 0} Itens`}
                            iconSrc="/sales.png"
                            emoji="🛒"
                        />
                    </div>
                </section>

                <section className={cssModule.chartsSection}>
                    <div className={cssModule.chartsGrid}>
                        <div className={cssModule.chartCard}>
                            <h3 className={cssModule.chartTitle}>Evolução do Estoque</h3>
                            <div className={cssModule.chartContainer}>
                                <div className={cssModule.lineChart}>
                                    <LineChart />
                                </div>
                            </div>
                        </div>

                        <div className={cssModule.chartCard}>
                            <h3 className={cssModule.chartTitle}>Produtos Mais Vendidos</h3>
                            <div className={cssModule.chartContainer}>
                                <div className={cssModule.barChart}>
                                    <PieChart />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={cssModule.chartsGrid}>
                        <div className={cssModule.chartCard}>
                            <h3 className={cssModule.chartTitle}>Vendas por Produto</h3>
                            <div className={cssModule.chartContainer}>
                                <div className={cssModule.barChart}>
                                    <BarChart />
                                </div>
                            </div>
                        </div>

                        <div className={cssModule.chartCard}>
                            <h3 className={cssModule.chartTitle}>Principais Produtos</h3>
                            <div className={cssModule.chartContainer}>
                                <TopProductsTable className={homeCssModule.productsTable} />
                            </div>
                        </div>
                    </div>
                </section>




            </main>
        </div>
    );
};

export default Statistics;
