
import React, { useState, useEffect } from 'react';
import { Product, Sale, View, Theme, Tab } from './types';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import POS from './components/POS';
import SalesHistory from './components/SalesHistory';
import Sidebar from './components/Sidebar';
import Reports from './components/Reports';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('pos'); // Começar no PDV por conveniência
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('bar_theme');
    if (!saved) return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return (saved as Theme);
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

  useEffect(() => {
    localStorage.setItem('bar_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('bar_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('bar_open_tabs', JSON.stringify(openTabs));
  }, [openTabs]);

  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('bar_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addProduct = (p: Product) => setProducts(prev => [...prev, p]);
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  const updateProduct = (u: Product) => setProducts(prev => prev.map(p => p.id === u.id ? u : p));

  const updateTabs = (tabs: Tab[]) => setOpenTabs(tabs);

  const registerSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard sales={sales} products={products} theme={theme} />;
      case 'products':
        return <ProductList products={products} onAdd={addProduct} onDelete={deleteProduct} onUpdate={updateProduct} />;
      case 'pos':
        return <POS products={products} openTabs={openTabs} onUpdateTabs={updateTabs} onCompleteSale={registerSale} />;
      case 'history':
        return <SalesHistory sales={sales} />;
      case 'reports':
        return <Reports sales={sales} />;
      default:
        return <POS products={products} openTabs={openTabs} onUpdateTabs={updateTabs} onCompleteSale={registerSale} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 lg:px-8 lg:py-4 flex justify-between items-center ml-0 md:ml-64">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden text-slate-600 dark:text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <h1 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              {activeView === 'dashboard' && 'Dashboard'}
              {activeView === 'products' && 'Cardápio'}
              {activeView === 'pos' && 'Ponto de Venda'}
              {activeView === 'history' && 'Histórico'}
              {activeView === 'reports' && 'Relatórios'}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">{theme === 'light' ? '🌙' : '☀️'}</button>
            <div className="w-9 h-9 rounded-full border-2 border-red-600 bg-black flex items-center justify-center shadow-lg">💀</div>
          </div>
        </header>
        <div className="p-4 lg:p-8 ml-0 md:ml-64 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
