import React from "react";
import { useState } from "react";
import useCurrentUser from '../hooks/useCurrentUser';
import { API_URLS, API_CONFIG } from '../config/api';
import { useNavigation } from "../context/NavigationContext";
import cssModule from '../styles/settings.module.css';
import Toast from '../components/Toast';
import LoadingScreen from '../components/LoadingScreen';
import ConfirmDialog from '../components/ConfirmDialog';

const Settings: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const { user: currentUser, loading, refresh } = useCurrentUser();
    const [nameInput, setNameInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [toastMsg, setToastMsg] = useState<string>('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const { navigateTo } = useNavigation();
    // mirror currentUser into local state for compatibility with existing handlers
    React.useEffect(() => { setUser(currentUser); }, [currentUser]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // inicializa campos editáveis com os dados do usuário
    React.useEffect(() => {
        if (user) {
            setNameInput(user.name || '');
            setEmailInput(user.email || '');
        }
    }, [user]);

    React.useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewUrl(null);
    }, [imageFile]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        setToastType('success');
        setToastMsg("Logout realizado com sucesso!");
        navigateTo("login");
    };

    if (loading) return <LoadingScreen message="Carregando" subtext="Carregando suas configurações" />;
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
                    <button className={cssModule.navButton} onClick={() => navigateTo("products")}>
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
                        <input className={cssModule.searchInput} placeholder="Pesquisar" />
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
                                    <button className={cssModule.menuItem} onClick={() => setShowUserMenu(false)}>
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
                <section className={cssModule.settingsSection}>
                    <div className={cssModule.settingsContainer}>
                        <div className={cssModule.profileSection}>
                            <div className={cssModule.userAvatarLarge}>
                                <img
                                    src={
                                        previewUrl || (user?.image ? `${API_CONFIG.BASE_URL}${user.image}` : '/user_profile.png')
                                    }
                                    alt={user?.name || 'Usuário'}
                                    className={cssModule.userPhotoLarge}
                                    onClick={() => fileInputRef.current?.click()}
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/user_profile.png'; }}
                                />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                />
                            </div>
                            <div className={cssModule.profileFields}>
                                <div className={cssModule.fieldGroup}>
                                    <label className={cssModule.fieldLabel}>Nome completo</label>
                                    <input 
                                        type="text" 
                                        className={cssModule.fieldInput} 
                                        value={nameInput}
                                        onChange={(e) => setNameInput(e.target.value)}
                                    />
                                </div>
                                <div className={cssModule.fieldGroup}>
                                    <label className={cssModule.fieldLabel}>Email</label>
                                    <input 
                                        type="email" 
                                        className={cssModule.fieldInput} 
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
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
                                    <label className={cssModule.fieldLabel}>Nova senha</label>
                                    <input 
                                        type="password" 
                                        className={cssModule.fieldInput} 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <p className={cssModule.fieldHelp}>
                                        Mínimo de 6 caracteres
                                    </p>
                                </div>
                            </div>
                            <div className={cssModule.saveSection}>
                                <button className={cssModule.saveButton} onClick={async () => {
                                    try {
                                        if (newPassword && newPassword.length < 6) {
                                            setToastType('error');
                                            setToastMsg('A nova senha deve ter pelo menos 6 caracteres.');
                                            return;
                                        }

                                        const form = new FormData();
                                        form.append('name', nameInput);
                                        form.append('email', emailInput);
                                        if (newPassword) form.append('newPassword', newPassword);
                                        if (imageFile) form.append('image', imageFile);

                                        const res = await fetch(API_URLS.ME, { method: 'PUT', body: form, credentials: 'include' });
                                        if (res.ok) {
                                            const data = await res.json();
                                            try {
                                                if (data && data.user) {
                                                    localStorage.setItem('user', JSON.stringify(data.user));
                                                    setUser(data.user);
                                                }
                                            } catch {}
                                            setToastType('success');
                                            setToastMsg('Salvo com sucesso');
                                            await refresh();
                                        } else {
                                            const err = await res.json();
                                            setToastType('error');
                                            setToastMsg('Erro: ' + (err.error || 'Unknown'));
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        setToastType('error');
                                        setToastMsg('Erro ao salvar');
                                    }
                                    }}>
                                    <img src="/save.png" alt="Salvar" className={cssModule.saveIconImg} />
                                    Salvar
                                </button>
                            </div>
                            {/* Excluir Conta */}
                            <div className={cssModule.dangerSection}>
                                <h3 className={`${cssModule.sectionTitle} ${cssModule.dangerTitle}`}>Excluir Conta</h3>
                                <p className={cssModule.dangerText}>
                                    Esta ação é permanente e removerá sua conta do sistema. Você
                                    será desconectado e não poderá recuperar os dados do usuário.
                                </p>
                                <button
                                    className={cssModule.dangerButton}
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <img src="/trash.png" alt="Excluir" className={cssModule.saveIconImg} />
                                    Excluir minha conta
                                </button>
                            </div>
                        </div>
                    </div>
                 </section>




            </main>
            {toastMsg && (
                <Toast
                    message={toastMsg}
                    type={toastType}
                    onClose={() => setToastMsg('')}
                />
            )}

            {showDeleteConfirm && (
                <ConfirmDialog
                    title="Excluir conta"
                    message="Tem certeza de que deseja excluir sua conta? Esta ação é permanente e não poderá ser desfeita."
                    confirmText="Excluir"
                    cancelText="Cancelar"
                    iconSrc="/trash.png"
                    onCancel={() => setShowDeleteConfirm(false)}
                    onConfirm={async () => {
                        try {
                            const res = await fetch(API_URLS.ME, { method: 'DELETE', credentials: 'include' });
                            if (res.ok) {
                                setToastType('success');
                                setToastMsg('Conta excluída com sucesso.');
                                localStorage.removeItem('user');
                                navigateTo('login');
                            } else {
                                let errMsg = 'Erro ao excluir a conta';
                                try { const err = await res.json(); errMsg = err.error || errMsg; } catch {}
                                setToastType('error');
                                setToastMsg(errMsg);
                            }
                        } catch (err) {
                            console.error(err);
                            setToastType('error');
                            setToastMsg('Erro inesperado ao excluir a conta');
                        } finally {
                            setShowDeleteConfirm(false);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default Settings;
