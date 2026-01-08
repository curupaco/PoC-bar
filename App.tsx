
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

// ========================================================
// CONFIGURAÇÃO DINÂMICA PARA DEPLOY
// ========================================================
const DEFAULT_FB_URL = 'https://poc-botequista-default-rtdb.firebaseio.com';
const FIXED_FB_URL = process.env.FIREBASE_URL || DEFAULT_FB_URL;
// ========================================================

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const isInitialMount = useRef(true);

  const [fbUrl, setFbUrl] = useState(() => FIXED_FB_URL || localStorage.getItem('bar_fb_url') || '');
  const [gistId, setGistId] = useState('');

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('bar_theme');
    return (saved as Theme) || 'dark';
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('bar_products');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Cerveja Lata 350ml', price: 6.00, category: 'Bebidas', sellType: 'unit' },
      { id: '2', name: 'Batata Frita', price: 45.00, category: 'Porções', sellType: 'weight' },
    ];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('bar_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [openTabs, setOpenTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('bar_open_tabs');
    return saved ? JSON.parse(saved) : [];
  });

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
    
    const root = window.document.documentElement;
    root.classList.remove('dark', 'retro');
    if (theme !== 'light') root.classList.add(theme);

    if (fbUrl && !isInitialMount.current) {
      const timer = setTimeout(() => {
        const fullData = { products, sales, openTabs, config: { fbUrl, ghToken: '', gistId } };
        saveToFirebase(fbUrl, fullData)
          .then(() => setDbStatus('success'))
          .catch(() => setDbStatus('error'));
      }, 1000); // Reduzi o delay para 1s para sincronia mais rápida
      return () => clearTimeout(timer);
    }
    isInitialMount.current = false;
  }, [products, sales, openTabs, fbUrl, gistId, theme]);

  const handleImportAll = (data: AppFullData) => {
    if (!data) return;
    if (data.products) setProducts(data.products);
    if (data.sales) setSales(data.sales);
    if (data.openTabs) setOpenTabs(data.openTabs);
    setDbStatus('success');
  };

  const deleteSale = (id: string) => {
    if (confirm("Deseja realmente excluir esta venda do histórico?")) {
      setSales(prev => prev.filter(s => s.id !== id));
    }
  };

  useEffect(() => {
    const urlToLoad = FIXED_FB_URL || localStorage.getItem('bar_fb_url');
    if (urlToLoad) {
      setDbStatus('loading');
      loadFromFirebase(urlToLoad)
        .then((data) => {
          if (data) handleImportAll(data);
          else setDbStatus('idle');
        })
        .catch(() => setDbStatus('error'));
    }
  }, []);

  const renderContent = () => {
    const commonProps = { products, sales, openTabs };
    switch (activeView) {
      case 'dashboard': return <Dashboard {...commonProps} theme={theme} />;
      case 'products': return <ProductList products={products} onAdd={p => setProducts([...products, p])} onDelete={id => setProducts(products.filter(p => p.id !== id))} onUpdate={u => setProducts(products.map(p => p.id === u.id ? u : p))} />;
      case 'pos': return <POS products={products} openTabs={openTabs} onUpdateTabs={setOpenTabs} onCompleteSale={s => setSales([s, ...sales])} />;
      case 'history': return <SalesHistory sales={sales} onDeleteSale={deleteSale} />;
      case 'reports': return <Reports sales={sales} />;
      case 'settings': return (
        <Settings 
          {...commonProps} 
          fbUrl={fbUrl} setFbUrl={setFbUrl} 
          onImport={handleImportAll} 
          dbStatus={dbStatus} 
          onStatusChange={setDbStatus} 
        />
      );
      default: return <POS products={products} openTabs={openTabs} onUpdateTabs={setOpenTabs} onCompleteSale={s => setSales([s, ...sales])} />;
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
        </header>
        <div className="p-4 lg:p-8 ml-0 md:ml-64">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
