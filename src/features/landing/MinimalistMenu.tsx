
import React, { useMemo } from 'react';
import { Product, formatCurrency } from '../../types';

interface MinimalistMenuProps {
  products: Product[];
  unitName: string;
}

export const MinimalistMenu: React.FC<MinimalistMenuProps> = ({ products = [], unitName = 'Botequista' }) => {
  const categorizedProducts = useMemo(() => {
    const map: Record<string, Product[]> = {};
    products.forEach(p => {
      const cat = p.category || 'DIVERSOS';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [products]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-6 md:p-12 max-w-2xl mx-auto">
      <header className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black italic">B</div>
        <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-2">{unitName}</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Cardápio Digital • v4.7.3</p>
      </header>

      <div className="space-y-12">
        {categorizedProducts.map(([category, items]) => (
          <section key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-red-600 border-b border-slate-100 pb-2 mb-6 flex items-center gap-3">
              <span>{category}</span>
              <div className="h-px bg-red-100 flex-1"></div>
            </h2>
            <div className="grid gap-6">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-start group">
                  <div className="flex-1">
                    <h3 className="font-black uppercase text-sm group-hover:text-red-600 transition-colors leading-tight">{item.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{item.sellType === 'weight' ? 'Preço por KG' : 'Unidade'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm italic">{formatCurrency(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-24 pt-12 border-t border-slate-50 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest pb-12">
        Gerado por Botequista Elite • Gestão Digital para Bares
      </footer>
    </div>
  );
};
