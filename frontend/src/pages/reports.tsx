import React from "react";
import { useState } from "react";
import useCurrentUser from '../hooks/useCurrentUser';
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/reports.module.css';
import { API_URLS } from '../config/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
                        <img src="/logo-removebg.png" alt="ShelfMate" className={cssModule.logoImg} />
                        <div className={cssModule.logoText}>Shelf Mate</div>
                    </div>
                </div>

                <nav className={cssModule.topbarCenter}>
                    <button className={cssModule.navButton} onClick={() => navigateTo("home")}>
-                        <img src="/home-white.png" alt="Home" className={cssModule.iconImg} />
+                        <img src="/home_white.png" alt="Home" className={cssModule.iconImg} />
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
                    <button className={cssModule.navButton} data-active="true">
                        <img src="/reports.png" alt="Relatórios" className={cssModule.iconImg} />
                        <span className={cssModule.navLabel}>Relatórios</span>
                    </button>
                </nav>

                <div className={cssModule.topbarRight}>
                    <div className={cssModule.searchContainer}>
                        <img src="/search.png" alt="Buscar" className={cssModule.iconImg} />
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
                            <button className={cssModule.exportButton} onClick={exportProductsPdf}>
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
                            <button className={cssModule.exportButtonAlert} onClick={exportAlertsPdf}>
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


// Exportar PDF: Produtos (usa /stats/products-detailed)
const exportProductsPdf = async () => {
    try {
        const res = await fetch(API_URLS.PRODUCTS_DETAILED);
        if (!res.ok) throw new Error(`Falha ao buscar dados (${res.status})`);
        const data = await res.json();
        const rows = (data?.rows ?? []) as Array<any>;

        const doc = new jsPDF();
        const title = 'Relatório de Produtos';
        doc.setFontSize(16);
        doc.text(title, 14, 18);
        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 26);

        autoTable(doc, {
            startY: 32,
            head: [[
                'ID', 'Produto', 'Preço Unitário (R$)', 'Estoque', 'Status', 'Alertas'
            ]],
            body: rows.map(r => [
                r.id, r.name, (r.unit_price ?? 0).toFixed(2), r.inventory ?? 0, r.status ?? '-', r.alerts_count ?? 0
            ]),
            styles: { fontSize: 10 },
            headStyles: { fillColor: [27, 49, 186] }
        });

        doc.save('relatorio_produtos.pdf');
    } catch (err: any) {
        alert(`Erro ao exportar PDF de produtos: ${err.message || err}`);
    }
};

// Exportar PDF: Alertas (filtra produtos com alerts_count>0 ou estoque baixo)
const exportAlertsPdf = async () => {
    try {
        const res = await fetch(API_URLS.PRODUCTS_DETAILED);
        if (!res.ok) throw new Error(`Falha ao buscar dados (${res.status})`);
        const data = await res.json();
        const rows = (data?.rows ?? []) as Array<any>;

        const LOW_STOCK_THRESHOLD = 10;
        const alertRows = rows.filter(r => (r.alerts_count ?? 0) > 0 || (r.inventory ?? 0) <= LOW_STOCK_THRESHOLD);

        const doc = new jsPDF();
        const title = 'Relatório de Alertas de Estoque';
        doc.setFontSize(16);
        doc.text(title, 14, 18);
        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 26);
        doc.text(`Critério: alerts_count>0 ou estoque <= ${LOW_STOCK_THRESHOLD}`, 14, 32);

        autoTable(doc, {
            startY: 38,
            head: [[
                'ID', 'Produto', 'Estoque', 'Preço (R$)', 'Status', 'Qtd. Alertas'
            ]],
            body: alertRows.map(r => [
                r.id, r.name, r.inventory ?? 0, (r.unit_price ?? 0).toFixed(2), r.status ?? '-', r.alerts_count ?? 0
            ]),
            styles: { fontSize: 10 },
            headStyles: { fillColor: [220, 53, 69] }
        });

        doc.save('relatorio_alertas.pdf');
    } catch (err: any) {
        alert(`Erro ao exportar PDF de alertas: ${err.message || err}`);
    }
};
