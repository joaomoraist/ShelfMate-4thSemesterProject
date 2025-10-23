import React from "react";
import { useState } from "react";
import useCurrentUser from '../hooks/useCurrentUser';
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/reports.module.css';

const Reports: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const { user: currentUser, loading } = useCurrentUser();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { navigateTo } = useNavigation();
    
    // mirror currentUser into local state for compatibility with existing handlers
    React.useEffect(() => { setUser(currentUser); }, [currentUser]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        alert("👋 Logout realizado com sucesso!");
        navigateTo("login");
    };

    if (loading) return <div style={{ padding: 40 }}>⏳ Carregando...</div>;
    if (!user) return (
        <div style={{ padding: 40, textAlign: "center" }}>
            <h2>📄 Relatórios</h2>
            <p>Você não está logado. Por favor, faça login para acessar os relatórios.</p>
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
                    <button className={cssModule.navButton} onClick={() => navigateTo("statistics")}>
                        <span className={cssModule.navIcon}>📊</span>
                        <span className={cssModule.navLabel}>Estatísticas</span>
                    </button>
                    <button className={cssModule.navButton} onClick={() => navigateTo("products")}>
                        <span className={cssModule.navIcon}>📦</span>
                        <span className={cssModule.navLabel}>Produtos</span>
                    </button>
                    <button className={cssModule.navButton} data-active="true">
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
                                    <button className={cssModule.menuItem} onClick={() => navigateTo("settings")}>
                                        <span className={cssModule.menuIcon}>⚙️</span>
                                        Configurações
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
                    <h1 className={cssModule.pageTitle}>Relatório dos seus Produtos</h1>
                </section>

                <section className={cssModule.reportsSection}>
                    <div className={cssModule.reportsGrid}>
                        <div className={cssModule.reportCard}>
                            <div className={cssModule.reportIcon}>
                                <span className={cssModule.iconBox}>📦</span>
                            </div>
                            <h3 className={cssModule.reportTitle}>Relatório de Produtos</h3>
                            <p className={cssModule.reportDescription}>
                                Visualize todos os produtos disponíveis em estoque com suas quantidades e valores
                            </p>
                            <button className={cssModule.exportButton}>
                                Exportar Relatório
                            </button>
                        </div>

                        <div className={cssModule.reportCard}>
                            <div className={cssModule.reportIcon}>
                                <span className={cssModule.iconAlert}>⚠️</span>
                            </div>
                            <h3 className={cssModule.reportTitle}>Relatório de Alertas</h3>
                            <p className={cssModule.reportDescription}>
                                Produtos com estoque baixo ou crítico que necessitam de reposição urgente
                            </p>
                            <button className={cssModule.exportButtonAlert}>
                                Exportar Relatório
                            </button>
                        </div>
                    </div>
                </section>




            </main>
        </div>
    );
};

export default Reports;
