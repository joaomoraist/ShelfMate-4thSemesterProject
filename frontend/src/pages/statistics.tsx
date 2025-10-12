import React from "react";
import { useState, useEffect } from "react";
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/statistics.module.css';

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
    comparison: string; 
    trend: 'up' | 'down'; 
    iconSrc: string; 
    emoji: string 
}> = ({ title, value, comparison, trend, iconSrc, emoji }) => (
    <div className={cssModule.metricCard}>
        <div className={cssModule.metricHeader}>
            <div className={cssModule.metricIcon}>
                <Icon src={iconSrc} emoji={emoji} />
            </div>
            <div className={cssModule.metricTitle}>{title}</div>
        </div>
        <div className={cssModule.metricValue}>{value}</div>
        <div className={cssModule.metricComparison}>
            <span className={cssModule.comparisonText}>{comparison}</span>
            <span className={`${cssModule.trendIcon} ${cssModule[trend]}`}>
                {trend === 'up' ? '↗' : '↘'}
            </span>
        </div>
    </div>
);

const Statistics: React.FC = () => {
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
            <h2>📊 Estatísticas</h2>
            <p>Você não está logado. Por favor, faça login para acessar suas estatísticas.</p>
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
                    <button className={cssModule.navButton} onClick={() => navigateTo("home")}>
                        <span className={cssModule.navIcon}>🏠</span>
                        <span className={cssModule.navLabel}>Home</span>
                    </button>
                    <button className={cssModule.navButton} data-active="true">
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
                <section className={cssModule.pageHeader}>
                    <h1 className={cssModule.pageTitle}>Estatísticas</h1>
                    <p className={cssModule.pageSubtitle}>
                        Acompanhe suas estatísticas e tome suas decisões baseadas em dados
                    </p>
                </section>

                <section className={cssModule.filtersSection}>
                    <div className={cssModule.filterGroup}>
                        <div className={cssModule.filterItem}>
                            <span className={cssModule.filterIcon}>🔽</span>
                            <span className={cssModule.filterIcon}>📦</span>
                            <span className={cssModule.filterLabel}>Produto</span>
                        </div>
                        <div className={cssModule.filterItem}>
                            <span className={cssModule.filterIcon}>📄</span>
                            <span className={cssModule.filterLabel}>Categoria</span>
                        </div>
                        <div className={cssModule.filterItem}>
                            <span className={cssModule.filterIcon}>📅</span>
                            <span className={cssModule.filterLabel}>Período</span>
                        </div>
                    </div>
                </section>

                <section className={cssModule.metricsSection}>
                    <div className={cssModule.metricsGrid}>
                        <MetricCard
                            title="Total de Produtos"
                            value="540"
                            comparison="vs Mês Anterior 500 8.5%"
                            trend="up"
                            iconSrc="/icons/box.svg"
                            emoji="📦"
                        />
                        <MetricCard
                            title="Valor em Estoque"
                            value="R$ 500.650,50"
                            comparison="vs Mês Anterior 500 8.5%"
                            trend="up"
                            iconSrc="/icons/money.svg"
                            emoji="💰"
                        />
                        <MetricCard
                            title="Produtos com Estoque Baixo"
                            value="250"
                            comparison="vs Mês Anterior 500 8.5%"
                            trend="down"
                            iconSrc="/icons/alert.svg"
                            emoji="⚠️"
                        />
                        <MetricCard
                            title="Vendas no Período"
                            value="250 Pedidos"
                            comparison="vs Mês Anterior 500 Pedidos 8.5%"
                            trend="up"
                            iconSrc="/icons/sales.svg"
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
                                    <div className={cssModule.chartPlaceholder}>📈 Gráfico de Linha - Evolução do Estoque</div>
                                </div>
                            </div>
                        </div>

                        <div className={cssModule.chartCard}>
                            <h3 className={cssModule.chartTitle}>Produtos Mais Vendidos</h3>
                            <div className={cssModule.chartContainer}>
                                <div className={cssModule.barChart}>
                                    <div className={cssModule.chartPlaceholder}>📊 Gráfico de Barras - Produtos Mais Vendidos</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={cssModule.fullWidthChart}>
                        <div className={cssModule.chartCard}>
                            <h3 className={cssModule.chartTitle}>Valor em Estoque</h3>
                            <div className={cssModule.chartContainer}>
                                <div className={cssModule.areaChart}>
                                    <div className={cssModule.chartPlaceholder}>📈 Gráfico de Área - Valor em Estoque</div>
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

export default Statistics;
