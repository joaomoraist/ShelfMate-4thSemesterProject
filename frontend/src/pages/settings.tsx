import React from "react";
import { useState, useEffect } from "react";
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/settings.module.css';

const Settings: React.FC = () => {
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
            <h2>⚙️ Configurações</h2>
            <p>Você não está logado. Por favor, faça login para acessar as configurações.</p>
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
                <section className={cssModule.settingsSection}>
                    <div className={cssModule.settingsContainer}>
                        <div className={cssModule.profileSection}>
                            <div className={cssModule.userAvatarLarge}>
                                <span className={cssModule.avatarIcon}>👤</span>
                            </div>
                            <div className={cssModule.profileFields}>
                                <div className={cssModule.fieldGroup}>
                                    <label className={cssModule.fieldLabel}>Nome completo</label>
                                    <input 
                                        type="text" 
                                        className={cssModule.fieldInput} 
                                        defaultValue="João Silva"
                                    />
                                </div>
                                <div className={cssModule.fieldGroup}>
                                    <label className={cssModule.fieldLabel}>Email</label>
                                    <input 
                                        type="email" 
                                        className={cssModule.fieldInput} 
                                        defaultValue="joao@exemplo.com"
                                    />
                                    <p className={cssModule.fieldHelp}>
                                        Este é o email usado para login e notificações
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={cssModule.formsSection}>
                            <div className={cssModule.passwordSection}>
                                <h3 className={cssModule.sectionTitle}>Alterar Senha</h3>
                                <div className={cssModule.fieldGroup}>
                                    <label className={cssModule.fieldLabel}>Senha atual</label>
                                    <input 
                                        type="password" 
                                        className={cssModule.fieldInput} 
                                        defaultValue="********"
                                    />
                                </div>
                                <div className={cssModule.fieldGroup}>
                                    <label className={cssModule.fieldLabel}>Nova senha</label>
                                    <input 
                                        type="password" 
                                        className={cssModule.fieldInput} 
                                        defaultValue="********"
                                    />
                                    <p className={cssModule.fieldHelp}>
                                        Mínimo de 6 caracteres
                                    </p>
                                </div>
                                <div className={cssModule.fieldGroup}>
                                    <label className={cssModule.fieldLabel}>Confirmar nova senha</label>
                                    <input 
                                        type="password" 
                                        className={cssModule.fieldInput} 
                                        defaultValue="********"
                                    />
                                </div>
                            </div>

                            <div className={cssModule.companySection}>
                                <h3 className={cssModule.sectionTitle}>Informações da Empresa</h3>
                                <div className={cssModule.fieldGroup}>
                                    <label className={cssModule.fieldLabel}>Nome da empresa</label>
                                    <input 
                                        type="text" 
                                        className={cssModule.fieldInput} 
                                        defaultValue="Minha Empresa LTDA"
                                    />
                                </div>
                                <div className={cssModule.fieldGroup}>
                                    <label className={cssModule.fieldLabel}>Email corporativo</label>
                                    <input 
                                        type="email" 
                                        className={cssModule.fieldInput} 
                                        defaultValue="contato@empresa.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={cssModule.saveSection}>
                        <button className={cssModule.saveButton}>
                            <span className={cssModule.saveIcon}>📄</span>
                            Salvar
                        </button>
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

export default Settings;
