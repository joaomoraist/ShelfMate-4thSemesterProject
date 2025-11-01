import React from "react";
import { API_URLS, API_CONFIG } from '../config/api';
import { useMemo, useState } from "react";
import useCurrentUser from '../hooks/useCurrentUser';
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/products.module.css';
import Toast from '../components/Toast';

const Products: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const { user: currentUser, loading } = useCurrentUser();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [toastMsg, setToastMsg] = useState<string>('');
    const { navigateTo } = useNavigation();
    const [products, setProducts] = useState<any[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [bulkSummary, setBulkSummary] = useState<{created?: number; skipped?: number; errors?: number} | null>(null);

    // Filtros e ordenação
    const [query, setQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [sortKey, setSortKey] = useState<"name"|"unit_price"|"inventory"|"status"|"total_sales"|"alerts_count">("name");
    const [sortDir, setSortDir] = useState<"asc"|"desc">("asc");

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


    // Produtos filtrados e ordenados
    const displayedProducts = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = products;

        // Filtrar por nome
        if (q.length > 0) {
            list = list.filter(p => String(p.name || "").toLowerCase().includes(q));
        }
        // Filtrar por status
        if (statusFilter !== 'todos') {
            list = list.filter(p => String(p.status || '').toLowerCase().includes(statusFilter.toLowerCase()));
        }

        // Ordenar
        const dir = sortDir === 'asc' ? 1 : -1;
        list = [...list].sort((a, b) => {
            const va = a?.[sortKey];
            const vb = b?.[sortKey];
            // Normalizar valores para comparação
            const na = typeof va === 'string' ? va.toLowerCase() : Number(va ?? 0);
            const nb = typeof vb === 'string' ? vb.toLowerCase() : Number(vb ?? 0);
            if (na < nb) return -1 * dir;
            if (na > nb) return 1 * dir;
            return 0;
        });

        return list;
    }, [products, query, statusFilter, sortKey, sortDir]);

    function toggleSort(key: typeof sortKey) {
        if (sortKey === key) {
            setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    }

    function clearFilters() {
        setQuery('');
        setStatusFilter('todos');
        setSortKey('name');
        setSortDir('asc');
    }

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
                        <div className={cssModule.searchGroup}>
                            <div className={cssModule.searchInputContainer}>
                                <img src="/search_black.png" alt="Buscar" className={cssModule.iconImg} />
                                <input
                                    className={cssModule.searchField}
                                    placeholder="Filtrar por nome do produto"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    aria-label="Filtrar por nome"
                                />
                            </div>
                            <select
                                className={cssModule.filterSelect}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                aria-label="Filtrar por status"
                            >
                                <option value="todos">Todos status</option>
                                <option value="dispon">Disponível</option>
                                <option value="baixo">Baixo estoque</option>
                                <option value="alto">Alto estoque</option>
                            </select>
                            <select
                                className={cssModule.filterSelect}
                                value={sortKey}
                                onChange={(e) => setSortKey(e.target.value as any)}
                                aria-label="Ordenar por"
                            >
                                <option value="name">Ordenar por: Nome</option>
                                <option value="unit_price">Ordenar por: Preço</option>
                                <option value="inventory">Ordenar por: Estoque</option>
                                <option value="status">Ordenar por: Status</option>
                                <option value="total_sales">Ordenar por: Vendas</option>
                                <option value="alerts_count">Ordenar por: Alertas</option>
                            </select>
                            <button className={cssModule.clearFiltersButton} onClick={clearFilters} aria-label="Limpar filtros">Limpar</button>
                        </div>
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
                                <button className={cssModule.sortHeader} onClick={() => toggleSort('name')} aria-label="Ordenar por produto">
                                    Produto {sortKey === 'name' && <span className={cssModule.sortIndicator}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                                </button>
                                <button className={cssModule.sortHeader} onClick={() => toggleSort('unit_price')} aria-label="Ordenar por preço">
                                    Preço Unitário {sortKey === 'unit_price' && <span className={cssModule.sortIndicator}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                                </button>
                                <button className={cssModule.sortHeader} onClick={() => toggleSort('inventory')} aria-label="Ordenar por estoque">
                                    Estoque Atual {sortKey === 'inventory' && <span className={cssModule.sortIndicator}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                                </button>
                                <button className={cssModule.sortHeader} onClick={() => toggleSort('status')} aria-label="Ordenar por status">
                                    Status {sortKey === 'status' && <span className={cssModule.sortIndicator}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                                </button>
                                <button className={cssModule.sortHeader} onClick={() => toggleSort('total_sales')} aria-label="Ordenar por vendas">
                                    Total Vendas {sortKey === 'total_sales' && <span className={cssModule.sortIndicator}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                                </button>
                                <button className={cssModule.sortHeader} onClick={() => toggleSort('alerts_count')} aria-label="Ordenar por alertas">
                                    Alertas {sortKey === 'alerts_count' && <span className={cssModule.sortIndicator}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                                </button>
                                <div className={cssModule.tableColumn}>Ações</div>
                            </div>
                        
                        {products.length === 0 && (
                            <div style={{ padding: '16px 0', color: '#6b7280' }}>
                                Nenhum produto encontrado para sua empresa. Adicione um produto acima.
                            </div>
                        )}
                        
                        {displayedProducts.map((product: any, index) => (
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
                                <div className={cssModule.statusCell}>
                                    {(() => {
                                        const statusText = (product.status || 'Disponível').toLowerCase();
                                        const statusClass = statusText.includes('dispon')
                                            ? cssModule.blue
                                            : statusText.includes('baixo')
                                                ? cssModule.red
                                                : statusText.includes('alto')
                                                    ? cssModule.green
                                                    : (product.inventory < 10 ? cssModule.red : cssModule.green);
                                        return (
                                            <span className={`${cssModule.status} ${statusClass}`}>
                                                {product.status || 'Disponível'}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className={cssModule.salesCell}>
                                    {(product.total_sales ?? 0) > 0 ? (
                                        <span className={cssModule.salesValue}>{product.total_sales}</span>
                                    ) : (
                                        <span className={`${cssModule.badge} ${cssModule.badgeGray}`}>Sem vendas</span>
                                    )}
                                </div>
                                <div className={cssModule.alertsCell}>
                                    <span className={cssModule.alertIcon}>
                                        <img src="/alerts-blue.png" alt="Alert" />
                                    </span>
                                    <span className={cssModule.alertCount}>{product.alerts_count ?? 0}</span>
                                    {(product.alerts_count > 0) && <span className={cssModule.alertDot}>●</span>}
                                </div>
                                <div className={cssModule.actionsCell}>
                                    <button
                                        className={cssModule.deleteButton}
                                        title="Excluir produto"
                                        onClick={async () => {
                                            try {
                                                if (!window.confirm(`Excluir '${product.name}'? Esta ação não pode ser desfeita.`)) return;
                                                const res = await fetch(`${API_URLS.STATS_PRODUCTS}/${product.id}`, {
                                                    method: 'DELETE',
                                                    credentials: 'include'
                                                });
                                                const data = await res.json().catch(() => ({}));
                                                if (!res.ok) throw new Error(data?.error || 'Falha ao excluir produto');
                                                setProducts(prev => prev.filter(p => p.id !== product.id));
                                                setToastMsg('Produto excluído com sucesso');
                                            } catch (err) {
                                                console.error(err);
                                                setToastMsg(err instanceof Error ? err.message : 'Erro ao excluir produto');
                                            }
                                        }}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
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

export default Products;
