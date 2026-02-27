
import React, { useMemo, useDeferredValue } from 'react';
import { Product, formatCurrency } from '../../../types';

interface ProductItemsTabProps {
  products: Product[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  collapsedCats: Set<string>;
  toggleCategory: (cat: string) => void;
  setProducts: (updater: (prev: Product[]) => Product[]) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
  onShowModal: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

const ProductItemsTab: React.FC<ProductItemsTabProps> = React.memo(({
  products,
  searchTerm,
  setSearchTerm,
  collapsedCats,
  toggleCategory,
  setProducts,
  onEdit,
  onDelete,
  onShowModal,
  canEdit,
  canDelete
}) => {
  
  // Otimização TEC-01: Adia o processamento da busca para manter a UI responsiva
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const { groupedProducts, sortedCategories, resultCount } = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase();
    
    const filtered = products.filter(p => 
      !term || 
      p.name.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term)
    );

    const grouped = filtered.reduce((acc, p) => {
      const cat = p.category.toUpperCase().trim() || 'GERAL';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {} as Record<string, Product[]>);

    const sorted = Object.keys(grouped).sort();
    
    return { 
        groupedProducts: grouped, 
        sortedCategories: sorted,
        resultCount: filtered.length
    };
  }, [products, deferredSearchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-1 w-full relative">
           <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           <input 
              type="text" 
              placeholder="LOCALIZAR NO CARDÁPIO..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none outline-none font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-red-500 transition-all shadow-inner"
           />
        </div>
        <button onClick={onShowModal} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all w-full md:w-auto">Novo Produto</button>
      </div>

      <div className="space-y-10 pb-24">
        {sortedCategories.map((cat) => (
          <div key={cat} className="space-y-4">
            <div 
              onClick={() => toggleCategory(cat)}
              className="flex items-center gap-4 cursor-pointer group select-none"
            >
              <div className="flex items-center gap-2">
                <svg className={`w-4 h-4 text-red-600 transition-transform duration-300 ${collapsedCats.has(cat) ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" /></svg>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-red-500 transition-colors">{cat}</h3>
              </div>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
              <span className="text-[10px] font-black text-slate-300 uppercase">{groupedProducts[cat].length} ITENS</span>
            </div>

            {!collapsedCats.has(cat) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
                {groupedProducts[cat].map(p => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center group hover:border-red-500/30 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black uppercase text-sm text-slate-800 dark:text-white">{p.name}</p>
                        <button onClick={() => setProducts(prev => prev.map(x => x.id === p.id ? {...x, isFavorite: !x.isFavorite} : x))} className={`text-sm ${p.isFavorite ? 'text-amber-500' : 'text-slate-100 dark:text-slate-800'} hover:scale-125 transition-transform`}>★</button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-lg font-black text-red-600">{formatCurrency(p.price)}</p>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${p.sellType === 'weight' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{p.sellType === 'weight' ? 'PESO (KG)' : 'UNIDADE'}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button disabled={!canEdit} onClick={() => onEdit(p)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all disabled:opacity-20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button disabled={!canDelete} onClick={() => onDelete(p.id, p.name)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {resultCount === 0 && <div className="py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] italic opacity-30">Nenhum produto encontrado</div>}
      </div>
    </div>
  );
});

export default ProductItemsTab;
