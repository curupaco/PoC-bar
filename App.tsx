
import React, { useState, useEffect, useRef } from 'react';
import { Product, Sale, View, Theme, Tab } from './types';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import POS from './components/POS';
import SalesHistory from './components/SalesHistory';
import Sidebar, { menuItems } from './components/Sidebar';
import Reports from './components/Reports';
import Settings from './components/Settings';
import { saveToFirebase, loadFromFirebase, AppFullData } from './services/firebaseService';

const DEFAULT_FB_URL = 'https://poc-botequista-default-rtdb.firebaseio.com';
const FIXED_FB_URL = process.env.FIREBASE_URL || DEFAULT_FB_URL;
const MASTER_KEY = "REMOVED_FIREBASE_PASSWORD";
// Placeholder para o repositório, pode ser ajustado nos Ajustes futuramente
const GITHUB_REPO_URL = "https://github.com/usuario/botequista/issues/new";

const App: React.FC = () => {
  const [isLoggedIn] = useState(true);
  const [encryptionKey] = useState<string>(MASTER_KEY);

  const [activeView, setActiveView] = useState<View>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [shortcutCheckout, setShortcutCheckout] = useState<{ name: string; amount: number } | null>(null);
  
  const isInitialMount = useRef(true);
  const isSyncingFromCloud = useRef(false);

  const [fbUrl, setFbUrl] = useState(() => localStorage.getItem('bar_fb_url') || FIXED_FB_URL);
  
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('bar_theme');
    return (saved as Theme) || 'dark';
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);

  const [supportForm, setSupportForm] = useState({ title: '', description: '' });

  useEffect(() => {
    const p = localStorage.getItem('bar_products');
    const s = localStorage.getItem('bar_sales');
    const t = localStorage.getItem('bar_open_tabs');
    
    try {
      if (p) setProducts(JSON.parse(p));
      else setProducts([
        { id: '1', name: 'Cerveja Lata 350ml', price: 6.00, category: 'Bebidas', sellType: 'unit' },
        { id: '2', name: 'Batata Frita', price: 45.00, category: 'Porções', sellType: 'weight' },
      ]);
      if (s) setSales(JSON.parse(s));
      if (t) setOpenTabs(JSON.parse(t));
    } catch (e) { console.error("Erro ao carregar cache local", e); }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'retro';
      return 'dark';
    });
  };

  const viewTitle = menuItems.find(item => item.id === activeView)?.label || activeView;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('bar_products', JSON.stringify(products));
    localStorage.setItem('bar_sales', JSON.stringify(sales));
    localStorage.setItem('bar_open_tabs', JSON.stringify(openTabs));
    localStorage.setItem('bar_theme', theme);
    localStorage.setItem('bar_fb_url', fbUrl);
    
    const root = window.document.documentElement;
    root.classList.remove('dark', 'retro');
    if (theme !== 'light') root.classList.add(theme);

    if (fbUrl && !isInitialMount.current && !isSyncingFromCloud.current && encryptionKey) {
      const timer = setTimeout(() => {
        const fullData = { products, sales, openTabs, config: { fbUrl, ghToken: '', gistId: '' } };
        saveToFirebase(fbUrl, fullData, encryptionKey)
          .then(() => setDbStatus('success'))
          .catch(() => setDbStatus('error'));
      }, 1500); 
      return () => clearTimeout(timer);
    }
    
    if (isInitialMount.current) {
        isInitialMount.current = false;
    }
  }, [products, sales, openTabs, fbUrl, theme, encryptionKey]);

  useEffect(() => {
    const urlToLoad = fbUrl || FIXED_FB_URL;
    if (urlToLoad) {
      setDbStatus('loading');
      loadFromFirebase(urlToLoad, encryptionKey)
        .then((data) => {
          if (data) handleImportAll(data);
          else setDbStatus('idle');
        })
        .catch((err) => {
            console.error("Initial load failed:", err);
            setDbStatus('error');
        });
    }
  }, []);

  const handleImportAll = (data: AppFullData) => {
    if (!data) return;
    isSyncingFromCloud.current = true;
    setProducts(data.products || []);
    setSales(data.sales || []);
    setOpenTabs(data.openTabs || []);
    setDbStatus('success');
    setTimeout(() => { isSyncingFromCloud.current = false; }, 500);
  };

  const deleteSale = (id: string) => {
    if (window.confirm("Deseja realmente excluir esta venda do histórico?")) {
      setSales(prev => prev.filter(s => String(s.id).trim() !== String(id).trim()));
    }
  };

  const handleQuitarPendura = (customerName: string, amount: number) => {
    setShortcutCheckout({ name: customerName, amount });
    setActiveView('pos');
  };

  const handleOpenGitHubIssue = () => {
    const body = `
### Relato do Usuário
${supportForm.description}

### Diagnóstico do Sistema
- **Versão:** Botequista v2.5
- **Data:** ${new Date().toLocaleString('pt-BR')}
- **Navegador:** ${navigator.userAgent}
- **Produtos Cadastrados:** ${products.length}
- **Vendas no Histórico:** ${sales.length}
- **Mesas Abertas:** ${openTabs.length}
- **Status Online:** ${isOnline ? 'Sim' : 'Não'}
- **Tema Ativo:** ${theme}
    `.trim();

    const url = `${GITHUB_REPO_URL}?title=${encodeURIComponent(supportForm.title)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
    setIsSupportModalOpen(false);
    setSupportForm({ title: '', description: '' });
  };

  const renderContent = () => {
    const commonProps = { products, sales, openTabs };
    switch (activeView) {
      case 'dashboard': return <Dashboard {...commonProps} theme={theme} />;
      case 'products': return <ProductList products={products} onAdd={p => setProducts(prev => [...prev, p])} onDelete={id => setProducts(prev => prev.filter(p => p.id !== id))} onUpdate={u => setProducts(prev => prev.map(p => p.id === u.id ? u : p))} />;
      case 'pos': return (
        <POS 
          products={products} 
          openTabs={openTabs} 
          onUpdateTabs={setOpenTabs} 
          onCompleteSale={s => setSales(prev => [s, ...prev])} 
          shortcutCheckout={shortcutCheckout}
          onClearShortcut={() => setShortcutCheckout(null)}
        />
      );
      case 'history': return <SalesHistory sales={sales} onDeleteSale={deleteSale} />;
      case 'reports': return <Reports sales={sales} products={products} onQuitarPendura={handleQuitarPendura} />;
      case 'settings': return (
        <Settings 
          {...commonProps} 
          fbUrl={fbUrl} setFbUrl={setFbUrl} 
          onImport={handleImportAll} 
          dbStatus={dbStatus} 
          onStatusChange={setDbStatus} 
        />
      );
      default: return <POS products={products} openTabs={openTabs} onUpdateTabs={setOpenTabs} onCompleteSale={s => setSales(prev => [s, ...prev])} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        dbStatus={dbStatus} 
        isOnline={isOnline}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 lg:px-8 lg:py-4 flex justify-between items-center ml-0 md:ml-64">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-lg md:hidden text-slate-600 dark:text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <h1 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {viewTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSupportModalOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all shadow-sm"
              title="Reportar Erro ou Sugestão"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </button>
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all shadow-sm">
              {theme === 'light' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
              {theme === 'dark' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
              {theme === 'retro' && (
                 <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2L15.09,8.26L22,9.27L17,14.14L18.18,21.02L12,17.77L5.82,21.02L7,14.14L2,9.27L8.91,8.26L12,2Z" /></svg>
              )}
            </button>
          </div>
        </header>
        <div className="p-4 lg:p-8 ml-0 md:ml-64">{renderContent()}</div>
      </main>

      {/* Modal de Suporte */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-2 tracking-tighter">Central de Suporte</h3>
            <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest font-bold">Relate erros ou peça novas funções</p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assunto Curto</label>
                <input 
                  type="text" 
                  value={supportForm.title}
                  onChange={e => setSupportForm({...supportForm, title: e.target.value})}
                  placeholder="Ex: Erro ao apagar mesa"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O que aconteceu?</label>
                <textarea 
                  rows={4}
                  value={supportForm.description}
                  onChange={e => setSupportForm({...supportForm, description: e.target.value})}
                  placeholder="Descreva o problema de forma simples..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
                />
              </div>
              <div className="pt-2 flex flex-col gap-3">
                <button 
                  onClick={handleOpenGitHubIssue}
                  disabled={!supportForm.title || !supportForm.description}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  Abrir no GitHub
                </button>
                <button 
                  onClick={() => setIsSupportModalOpen(false)}
                  className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
