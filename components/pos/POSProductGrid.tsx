
import React, { useState } from 'react';
import { Product, formatCurrency } from '../../types';

interface POSProductGridProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
}

const POSProductGrid: React.FC<POSProductGridProps> = ({ products, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  const filteredProducts = (products || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const favorites = filteredProducts.filter(p => p.isFavorite);
  // FIX: Using spread operator to ensure correct type inference for string[] from Set
  const categories: string[] = [...new Set(filteredProducts.map(p => p.category))].sort();

  const toggleCategory = (cat: string) => {
    setCollapsedCats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cat)) newSet.delete(cat);
      else newSet.add(cat);
      return newSet;
    });
  };

  return (
    <div className="flex-1 space-y-6 pb-24 overflow-y-auto no-scrollbar">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 sticky top-0 z-20">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input type="text" placeholder="LOCALIZAR ITEM NO CARDÁPIO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-[10px] tracking-widest outline-none border-none shadow-inner" />
      </div>

      <div className="space-y-10">
        {favorites.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] pl-2">⭐ FAVORITOS</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {favorites.map(p => (
                <button key={p.id} onClick={() => onAddProduct(p)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-amber-500/30 hover:border-amber-500 shadow-sm transition-all h-24 flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-black uppercase px-1 line-clamp-2 leading-none mb-1">{p.name}</p>
                  <p className="text-xl font-black text-amber-600">{p.price.toFixed(2).replace('.', ',')}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        {categories.map(cat => (
          <div key={cat} className="space-y-4">
            <div 
              onClick={() => toggleCategory(cat)} 
              className="flex items-center gap-4 cursor-pointer group select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-all"
            >
              <div className="flex items-center gap-2">
                <svg className={`w-4 h-4 text-red-600 transition-transform duration-300 ${collapsedCats.has(cat) ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" /></svg>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-red-500 transition-colors">{cat}</h3>
              </div>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
              <span className="text-[9px] font-black text-slate-300 uppercase">{filteredProducts.filter(p => p.category === cat).length} ITENS</span>
            </div>
            {!collapsedCats.has(cat) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 animate-in slide-in-from-top-2">
                {filteredProducts.filter(p => p.category === cat).map(p => (
                  <button key={p.id} onClick={() => onAddProduct(p)} className="bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 hover:border-red-500 shadow-sm transition-all h-24 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-black uppercase px-1 line-clamp-2 leading-none mb-1">{p.name}</p>
                    <p className="text-xl font-black text-red-600">{p.price.toFixed(2).replace('.', ',')}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default POSProductGrid;
