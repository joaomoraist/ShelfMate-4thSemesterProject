import React from "react";
import { API_URLS } from '../config/api';
import { useState } from "react";
import useCurrentUser from '../hooks/useCurrentUser';
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/products.module.css';

const Products: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const { user: currentUser, loading } = useCurrentUser();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { navigateTo } = useNavigation();
    const [products, setProducts] = useState<any[]>([]);
    
    // mirror currentUser into local state for compatibility with existing handlers
    React.useEffect(() => { setUser(currentUser); }, [currentUser]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        alert("👋 Logout realizado com sucesso!");
        navigateTo("login");
    };

    // Carregar produtos reais com dados detalhados
    React.useEffect(() => {
        const load = async () => {
            try {
                const stored = localStorage.getItem('user');
                const parsed = stored ? JSON.parse(stored) : null;
                const companyId = parsed?.company_id;
                const url = companyId ? `${API_URLS.PRODUCTS_DETAILED}?companyId=${companyId}` : API_URLS.PRODUCTS_DETAILED;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Falha ao buscar produtos');
                const data = await res.json();
                setProducts(data.rows || []);
            } catch (e) {
                console.error(e);
                setProducts([]);
            }
        };
        load();
    }, []);



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
                        <span className={cssModule.welcomeText}>Bem vindo {user?.name || 'Usuário'}</span>
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
                    {loading && (
                        <div style={{ padding: '8px 0', color: '#6b7280' }}>Carregando dados de usuário...</div>
                    )}
                    
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
                            <button className={cssModule.addButton} onClick={() => navigateTo("add-product")}>
                                <span className={cssModule.buttonIcon}>+</span>
                                Adicionar Produto
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
                            <div className={cssModule.tableColumn}>Preço Unitário</div>
                            <div className={cssModule.tableColumn}>Estoque Atual</div>
                            <div className={cssModule.tableColumn}>Nível Estoque</div>
                            <div className={cssModule.tableColumn}>Total Vendas</div>
                            <div className={cssModule.tableColumn}>Última Venda</div>
                            <div className={cssModule.tableColumn}>Status</div>
                            <div className={cssModule.tableColumn}>Alertas</div>
                        </div>
                        
                        {products.length === 0 && (
                            <div style={{ padding: '16px 0', color: '#6b7280' }}>
                                Nenhum produto encontrado para sua empresa. Adicione um produto acima.
                            </div>
                        )}
                        
                        {products.map((product: any, index) => (
                            <div key={product.id ?? index} className={cssModule.tableRow}>
                                <div className={cssModule.productCell}>
                                    <span className={cssModule.productName}>{product.name}</span>
                                    <span className={cssModule.expandIcon}>▼</span>
                                </div>
                                <div className={cssModule.supplierCell}>
                                    {product.unit_price ? `R$ ${Number(product.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                </div>
                                <div className={cssModule.stockCell}>
                                    <span className={cssModule.stockValue}>{product.inventory ?? 0}</span>
                                </div>
                                <div className={cssModule.minMaxCell}>
                                    {product.inventory < 10 ? 'Baixo' : product.inventory > 100 ? 'Alto' : 'Normal'}
                                </div>
                                <div className={cssModule.salesCell}>{product.total_sales ?? 0}</div>
                                <div className={cssModule.restockCell}>
                                    {product.last_sale_date ? new Date(product.last_sale_date).toLocaleDateString('pt-BR') : '-'}
                                </div>
                                <div className={cssModule.statusCell}>
                                    <span className={`${cssModule.status} ${cssModule[product.inventory < 10 ? 'red' : 'green']}`}>
                                        {product.status || 'Disponível'}
                                    </span>
                                </div>
                                <div className={cssModule.alertsCell}>
                                    <span className={cssModule.alertIcon}>🔔</span>
                                    <span className={cssModule.alertCount}>{product.alerts_count ?? 0}</span>
                                    {(product.alerts_count > 0) && <span className={cssModule.alertDot}>●</span>}
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


            </main>
        </div>
    );
};

export default Products;
