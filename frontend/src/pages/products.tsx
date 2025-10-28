import React from "react";
import { API_URLS, API_CONFIG } from '../config/api';
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
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [bulkSummary, setBulkSummary] = useState<{created?: number; skipped?: number; errors?: number} | null>(null);

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
                const res = await fetch(API_URLS.PRODUCTS_DETAILED, { credentials: 'include' });
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



    // Handlers CSV declarados antes do JSX para evitar TDZ
    function handleBulkButtonClick() {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    }

    async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
        try {
            const file = e.target.files?.[0];
            if (!file) return;
            const text = await file.text();

            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length < 2) { alert("CSV vazio ou sem dados."); return; }
            const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
            const idxName = headers.indexOf("name");
            const idxPrice = headers.indexOf("unit_price");
            const idxInventory = headers.indexOf("inventory");
            const idxStatus = headers.indexOf("status");
            if (idxName === -1 || idxPrice === -1 || idxInventory === -1 || idxStatus === -1) {
                alert("CSV deve conter cabeçalhos: name, unit_price, inventory, status.");
                return;
            }

            const records = lines.slice(1).map(line => {
                const cols = line.split(",").map(c => c.trim());
                return {
                    name: cols[idxName],
                    unit_price: Number(cols[idxPrice]),
                    inventory: Number(cols[idxInventory]),
                    status: cols[idxStatus]
                };
            }).filter(r => r.name && !Number.isNaN(r.unit_price) && !Number.isNaN(r.inventory) && r.status);

            if (records.length === 0) {
                alert("Nenhuma linha válida encontrada no CSV.");
                return;
            }

            const res = await fetch(API_URLS.STATS_PRODUCTS_BULK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ rows: records })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Falha no upload CSV');

            const summary = data?.summary || {};
            setBulkSummary({ created: summary.createdCount ?? 0, skipped: summary.skippedCount ?? 0, errors: summary.errorCount ?? 0 });
            alert(`Importação concluída. Criados: ${summary.createdCount ?? 0}, Ignorados: ${summary.skippedCount ?? 0}, Erros: ${summary.errorCount ?? 0}`);

            // Recarregar produtos após importação
            try {
                const r = await fetch(API_URLS.PRODUCTS_DETAILED, { credentials: 'include' });
                const j = await r.json();
                setProducts(j.rows || []);
            } catch (err) {
                console.error(err);
            }
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Erro ao processar CSV');
        }
    }

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
                    <button className={cssModule.navButton} data-active="true">
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
                <section className={cssModule.productsSection}>
                    <h1 className={cssModule.sectionTitle}>Seus Produtos</h1>
                    {loading && (
                        <div style={{ padding: '8px 0', color: '#6b7280' }}>Carregando dados de usuário...</div>
                    )}
                    
                    <div className={cssModule.actionBar}>
                        <div className={cssModule.actionButtons}>
                            <button className={cssModule.addButton} onClick={() => navigateTo("add-product")}>
                                <span className={cssModule.buttonIcon}>+</span>
                                Adicionar Produto
                            </button>
                            <button className={cssModule.addMultipleButton} onClick={handleBulkButtonClick}>
                                <img src="/products.png" alt="CSV" className={cssModule.iconImg} />
                                Adicionar vários Produtos (CSV)
                            </button>
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileSelected}
                            />
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
                                <div className={cssModule.salesCell}>
                                    {(product.total_sales ?? 0) > 0 ? (
                                        <span className={cssModule.salesValue}>{product.total_sales}</span>
                                    ) : (
                                        <span className={`${cssModule.badge} ${cssModule.badgeGray}`}>Sem vendas</span>
                                    )}
                                </div>
                                <div className={cssModule.restockCell}>
                                    {product.last_sale_date ? (
                                        new Date(product.last_sale_date).toLocaleDateString('pt-BR')
                                    ) : (
                                        <span className={cssModule.muted}>Sem registro</span>
                                    )}
                                </div>
                                <div className={cssModule.statusCell}>
                                    <span className={`${cssModule.status} ${cssModule[product.inventory < 10 ? 'red' : 'green']}`}>
                                        {product.status || 'Disponível'}
                                    </span>
                                </div>
                                <div className={cssModule.alertsCell}>
                                    <span className={cssModule.alertIcon}>
                                        <img src="/alerts-blue.png" alt="Alert" />
                                    </span>
                                    <span className={cssModule.alertCount}>{product.alerts_count ?? 0}</span>
                                    {(product.alerts_count > 0) && <span className={cssModule.alertDot}>●</span>}
                                </div>
                            </div>
                        ))}
                    </div>


                </section>


            </main>
        </div>
    );


};

export default Products;
