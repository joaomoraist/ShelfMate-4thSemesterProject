import React from "react";
import { useState, useEffect } from "react";
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/products.module.css';

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

const Products: React.FC = () => {
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
            <h2>📦 Produtos</h2>
            <p>Você não está logado. Por favor, faça login para acessar seus produtos.</p>
        </div>
    );

    const products = [
        {
            name: "Notebook Dell XPS",
            supplier: "Dell Brasil",
            stock: 45,
            minMax: "30/100",
            sales: 145,
            lastRestock: "15/03/2024",
            status: "Disponível",
            statusColor: "green",
            alerts: 2,
            hasAlert: false
        },
        {
            name: "Mouse Logitech MX",
            supplier: "Logitech",
            stock: 120,
            minMax: "50/200",
            sales: 128,
            lastRestock: "20/03/2024",
            status: "Disponível",
            statusColor: "green",
            alerts: 1,
            hasAlert: false
        },
        {
            name: "Teclado Mecânico",
            supplier: "Keychron",
            stock: 8,
            minMax: "20/80",
            sales: 112,
            lastRestock: "05/03/2024",
            status: "Baixo",
            statusColor: "orange",
            alerts: 3,
            hasAlert: true
        },
        {
            name: "Monitor LG 27\"",
            supplier: "LG Electronics",
            stock: 32,
            minMax: "25/75",
            sales: 98,
            lastRestock: "18/03/2024",
            status: "Disponível",
            statusColor: "green",
            alerts: 1,
            hasAlert: false
        },
        {
            name: "Webcam Full HD",
            supplier: "Logitech",
            stock: 0,
            minMax: "15/60",
            sales: 85,
            lastRestock: "01/03/2024",
            status: "Esgotado",
            statusColor: "red",
            alerts: 4,
            hasAlert: true
        },
        {
            name: "Fone Bluetooth",
            supplier: "Sony",
            stock: 65,
            minMax: "40/150",
            sales: 156,
            lastRestock: "22/03/2024",
            status: "Disponível",
            statusColor: "green",
            alerts: 1,
            hasAlert: false
        }
    ];

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
                    </button>
                    <button className={cssModule.navButton} data-active="true">
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
                <section className={cssModule.productsSection}>
                    <h1 className={cssModule.sectionTitle}>Seus Produtos</h1>
                    
                    <div className={cssModule.actionBar}>
                        <div className={cssModule.searchGroup}>
                            <div className={cssModule.searchInputContainer}>
                                <span className={cssModule.searchIcon}>🔍</span>
                                <input className={cssModule.searchField} placeholder="Buscar produto..." />
                            </div>
                            <div className={cssModule.categoryFilter}>
                                <span className={cssModule.filterLabel}>Todas Categorias</span>
                                <span className={cssModule.filterArrow}>▼</span>
                            </div>
                        </div>
                        <div className={cssModule.actionButtons}>
                            <button className={cssModule.addButton}>
                                <span className={cssModule.buttonIcon}>+</span>
                                Adicionar um Produto
                            </button>
                            <button className={cssModule.addMultipleButton}>
                                <span className={cssModule.buttonIcon}>📄</span>
                                Adicionar vários Produtos
                            </button>
                        </div>
                    </div>

                    <div className={cssModule.productsTable}>
                        <div className={cssModule.tableHeader}>
                            <div className={cssModule.tableColumn}>Produto</div>
                            <div className={cssModule.tableColumn}>Fornecedor</div>
                            <div className={cssModule.tableColumn}>Estoque Atual</div>
                            <div className={cssModule.tableColumn}>Min/Máx</div>
                            <div className={cssModule.tableColumn}>Vendas</div>
                            <div className={cssModule.tableColumn}>Última Reposição</div>
                            <div className={cssModule.tableColumn}>Status</div>
                            <div className={cssModule.tableColumn}>Alertas</div>
                        </div>
                        
                        {products.map((product, index) => (
                            <div key={index} className={cssModule.tableRow}>
                                <div className={cssModule.productCell}>
                                    <span className={cssModule.productName}>{product.name}</span>
                                    <span className={cssModule.expandIcon}>▼</span>
                                </div>
                                <div className={cssModule.supplierCell}>{product.supplier}</div>
                                <div className={cssModule.stockCell}>
                                    <span className={cssModule.stockValue}>{product.stock}</span>
                                </div>
                                <div className={cssModule.minMaxCell}>{product.minMax}</div>
                                <div className={cssModule.salesCell}>{product.sales}</div>
                                <div className={cssModule.restockCell}>{product.lastRestock}</div>
                                <div className={cssModule.statusCell}>
                                    <span className={`${cssModule.status} ${cssModule[product.statusColor]}`}>
                                        {product.status}
                                    </span>
                                </div>
                                <div className={cssModule.alertsCell}>
                                    <span className={cssModule.alertIcon}>🔔</span>
                                    <span className={cssModule.alertCount}>{product.alerts}</span>
                                    {product.hasAlert && <span className={cssModule.alertDot}>●</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={cssModule.bottomAction}>
                        <button className={cssModule.salesButton}>
                            <span className={cssModule.salesIcon}>💰</span>
                            <span className={cssModule.clockIcon}>🕒</span>
                            Adicionar últimas Vendas
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

export default Products;
