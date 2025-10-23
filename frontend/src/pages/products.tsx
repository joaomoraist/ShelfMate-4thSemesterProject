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
    const [adding, setAdding] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', unit_price: 0, inventory: 0, status: 'Disponível' });
    
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

    const submitNewProduct = async () => {
        try {
            setAdding(true);
            const stored = localStorage.getItem('user');
            const parsed = stored ? JSON.parse(stored) : null;
            const companyId = parsed?.company_id;
            const res = await fetch(API_URLS.STATS_PRODUCTS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // no credentials to avoid third-party cookie issues in prod
                body: JSON.stringify({ ...newProduct, companyId })
            });
            if (!res.ok) throw new Error('Falha ao criar produto');
            await res.json();
            
            // Recarregar produtos com dados detalhados
            const detailedUrl = companyId ? `${API_URLS.PRODUCTS_DETAILED}?companyId=${companyId}` : API_URLS.PRODUCTS_DETAILED;
            const detailedRes = await fetch(detailedUrl);
            if (detailedRes.ok) {
                const detailedData = await detailedRes.json();
                setProducts(detailedData.rows || []);
            }
            
            setNewProduct({ name: '', unit_price: 0, inventory: 0, status: 'Disponível' });
            setAdding(false);
        } catch (e) {
            console.error(e);
            setAdding(false);
            alert('Erro ao criar produto');
        }
    };

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
                            <button className={cssModule.addButton} onClick={submitNewProduct} disabled={adding}>
                                <span className={cssModule.buttonIcon}>+</span>
                                {adding ? 'Salvando...' : 'Adicionar um Produto'}
                            </button>
                            <button className={cssModule.addMultipleButton}>
                                <span className={cssModule.buttonIcon}>📄</span>
                                Adicionar vários Produtos
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
                        <input className={cssModule.searchField} placeholder="Nome do produto" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                        <input className={cssModule.searchField} placeholder="Preço unitário" type="number" value={newProduct.unit_price} onChange={(e) => setNewProduct({ ...newProduct, unit_price: Number(e.target.value) })} />
                        <input className={cssModule.searchField} placeholder="Estoque" type="number" value={newProduct.inventory} onChange={(e) => setNewProduct({ ...newProduct, inventory: Number(e.target.value) })} />
                        <input className={cssModule.searchField} placeholder="Status" value={newProduct.status} onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })} />
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
