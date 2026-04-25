
import React, { useMemo, useState, useEffect } from 'react';
import { Product, formatCurrency } from '../../types';
import { loadFromFirebase, getFirebaseToken } from '../../services/firebaseService';


interface MinimalistMenuProps {
  products?: Product[];
  unitName?: string;
  unitId?: string | null;
  syncConfig?: { url: string; key: string } | null;
  barName?: string | null;
}

const slugify = (str: string) => 
  str.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[^\w\s-]/g, "")
     .replace(/[\s_-]+/g, "-")
     .replace(/^-+|-+$/g, "");

export const MinimalistMenu: React.FC<MinimalistMenuProps> = ({ 
    products: initialProducts = [], 
    unitName: initialUnitName = 'Botequista',
    unitId: initialUnitId,
    syncConfig,
    barName
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [unitName, setUnitName] = useState(initialUnitName);
  const [unitId, setUnitId] = useState(initialUnitId);
  const [loading, setLoading] = useState(initialProducts.length === 0 && (!!initialUnitId || !!barName));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('btq_menu_theme') as 'light' | 'dark') || 'dark');

  useEffect(() => {
    localStorage.setItem('btq_menu_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const fetchMenuData = async () => {
        if (!syncConfig) return;

        setLoading(true);
        try {
            let currentUnitId = unitId;
            let currentUnitName = unitName;
            let currentUnitUseStock = true;

            // 0. Autenticação para acesso público (usa credenciais de leitura do .env)
            let token = '';
            if (syncConfig.email && syncConfig.pass && syncConfig.key) {
                const fetchedToken = await getFirebaseToken(syncConfig.email, syncConfig.pass, syncConfig.key);
                if (fetchedToken) token = fetchedToken;
            }

            // 1. Buscamos as configurações da unidade na lista global
            if (currentUnitId || barName) {
                const unitsData = await loadFromFirebase(syncConfig.url, undefined, token, 'units');
                if (unitsData) {
                    const unitsArray = Array.isArray(unitsData) ? unitsData : Object.values(unitsData);
                    let found = null;
                    
                    if (currentUnitId) {
                        found = unitsArray.find((u: any) => u.id === currentUnitId);
                    } 
                    if (!found && barName) {
                        found = unitsArray.find((u: any) => slugify(u.name) === slugify(barName));
                    }

                    if (found) {
                        currentUnitId = found.id;
                        currentUnitName = found.name;
                        currentUnitUseStock = found.useStock !== false; // Padrão é true se não definido
                        setUnitId(found.id);
                        setUnitName(found.name);
                    }
                }
            }

            // 3. Se temos ID (ou encontramos um), buscamos os produtos
            if (currentUnitId) {
                const path = `data/units/${currentUnitId}/products`;
                const data = await loadFromFirebase(syncConfig.url, undefined, token, path);
                
                if (data) {
                    const productsArray = Array.isArray(data) ? data : Object.values(data);
                    
                    // Filtragem Inteligente:
                    // 1. Remove excluídos
                    // 2. Se a UNIDADE controla estoque:
                    //    - Mostra se trackStock for false (item de serviço/preparo)
                    //    - Mostra se stock > 0
                    // 3. Se a UNIDADE NÃO controla estoque:
                    //    - Mostra tudo
                    const filtered = productsArray.filter((p: any) => {
                        if (p.deleted) return false;
                        if (!currentUnitUseStock) return true;
                        if (p.trackStock === false) return true;
                        return (p.stock || 0) > 0;
                    });

                    setProducts(filtered);
                }
            }
        } catch (e) {
            console.error("Erro ao carregar cardápio:", e);
        } finally {
            setLoading(false);
        }
    };

    fetchMenuData();
  }, [unitId, barName, syncConfig]);

  const categorizedProducts = useMemo(() => {
    const map: Record<string, Product[]> = {};
    products.forEach(p => {
      const cat = p.category || 'DIVERSOS';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [products]);

  if (loading) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-12 text-center transition-colors duration-500">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8 shadow-lg shadow-indigo-500/20"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse">Preparando Experiência...</p>
          </div>
      );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'} font-sans transition-colors duration-500`}>
      <div className="max-w-2xl mx-auto p-6 md:p-12 pb-32">
        {/* Theme Switcher */}
        <div className="fixed top-6 right-6 z-50">
            <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-90 ${theme === 'dark' ? 'bg-slate-800 text-amber-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}
            >
                {theme === 'dark' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
            </button>
        </div>

        <header className="text-center mb-20 animate-in fade-in slide-in-from-top-6 duration-1000">
            <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto mb-8 text-3xl font-black italic transform -rotate-6 shadow-2xl transition-all ${theme === 'dark' ? 'bg-white text-slate-950' : 'bg-slate-900 text-white'}`}>B</div>
            <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-4 leading-none">{unitName}</h1>
            <div className="flex items-center justify-center gap-4">
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 max-w-[40px]"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Cardápio Digital Premium</p>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 max-w-[40px]"></div>
            </div>
        </header>

        {products.length === 0 ? (
            <div className="text-center py-32 space-y-6 opacity-40">
                <div className="text-6xl">🍹</div>
                <p className="text-sm font-black uppercase italic tracking-widest">Nenhum item disponível agora</p>
                <p className="text-[10px] font-bold uppercase opacity-60">Volte em instantes para novidades</p>
            </div>
        ) : (
            <div className="space-y-20">
                {categorizedProducts.map(([category, items], idx) => (
                <section key={category} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                    <div className="flex items-center gap-4 mb-10">
                        <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-indigo-500 whitespace-nowrap">{category}</h2>
                        <div className={`h-1 flex-1 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                            <div className="h-full bg-indigo-500/30 rounded-full w-1/3"></div>
                        </div>
                    </div>
                    <div className="grid gap-10">
                    {items.map(item => (
                        <div key={item.id} className="flex justify-between items-start group">
                            <div className="flex-1 pr-6">
                                <h3 className={`font-black uppercase text-base transition-colors leading-tight group-hover:text-indigo-500 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    {item.sellType === 'weight' ? 'Preço por KG' : 'Unidade'}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={`font-black text-lg italic tracking-tighter ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-900'}`}>
                                    {formatCurrency(item.price)}
                                </span>
                            </div>
                        </div>
                    ))}
                    </div>
                </section>
                ))}
            </div>
        )}

        <footer className="mt-32 pt-16 border-t border-slate-100 dark:border-slate-900 text-center space-y-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Botequista Elite v4.8.0</p>
            <div className="flex justify-center gap-8 opacity-20 grayscale">
                <div className="w-8 h-8 rounded-lg bg-slate-400"></div>
                <div className="w-8 h-8 rounded-lg bg-slate-400"></div>
                <div className="w-8 h-8 rounded-lg bg-slate-400"></div>
            </div>
            <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest pt-8">
                Tecnologia para bares que não param de crescer.
            </p>
        </footer>
      </div>
    </div>
  );
};

