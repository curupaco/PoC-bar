
import React, { useState, useEffect } from 'react';
import { Product, Sale, View, Theme } from './types';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import POS from './components/POS';
import SalesHistory from './components/SalesHistory';
import Sidebar from './components/Sidebar';
import Reports from './components/Reports';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('bar_theme');
    // Verifica preferência do sistema se não houver salvo
    if (!saved) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return (saved as Theme);
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('bar_products');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Cerveja Lata 350ml', price: 6.00 },
      { id: '2', name: 'Caipirinha Tradicional', price: 18.00 },
      { id: '3', name: 'Água Mineral', price: 4.00 },
      { id: '4', name: 'Porção de Batata Frita', price: 25.00 },
    ];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('bar_sales');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistência de dados
  useEffect(() => {
    localStorage.setItem('bar_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('bar_sales', JSON.stringify(sales));
  }, [sales]);

  // Sincronização do tema com o DOM e LocalStorage
  useEffect(() => {
    localStorage.setItem('bar_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Fecha o menu mobile ao mudar de view
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeView]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const registerSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard sales={sales} products={products} theme={theme} />;
      case 'products':
        return (
          <ProductList 
            products={products} 
            onAdd={addProduct} 
            onDelete={deleteProduct} 
            onUpdate={updateProduct} 
          />
        );
      case 'pos':
        return <POS products={products} onCompleteSale={registerSale} />;
      case 'history':
        return <SalesHistory sales={sales} />;
      case 'reports':
        return <Reports sales={sales} />;
      default:
        return <Dashboard sales={sales} products={products} theme={theme} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Overlay para mobile quando menu está aberto */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header Responsivo */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 lg:px-8 lg:py-4 flex justify-between items-center ml-0 md:ml-64">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden text-slate-600 dark:text-slate-400"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-slate-800 dark:text-slate-100 truncate">
                {activeView === 'dashboard' && 'Dashboard'}
                {activeView === 'products' && 'Cardápio'}
                {activeView === 'pos' && 'Venda'}
                {activeView === 'history' && 'Histórico'}
                {activeView === 'reports' && 'Relatórios'}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-all text-sm flex items-center justify-center min-w-[40px]"
              title="Alternar Tema"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block text-right">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Admin Ozzy</span>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border-2 border-red-500 bg-black flex items-center justify-center text-white text-base lg:text-lg overflow-hidden shadow-md">
                💀
              </div>
            </div>
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
