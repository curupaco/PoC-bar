
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, formatCurrency } from '../../types';

interface POSProductGridProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
}

// Sub-componente memoizado para evitar re-renders desnecessários
const ProductCard = React.memo(({ product, onClick }: { product: Product, onClick: (p: Product) => void }) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleClick = () => {
    setIsAdded(true);
    onClick(product);
    setTimeout(() => setIsAdded(false), 300); // Feedback visual de 300ms
  };

  return (
    <button 
      onClick={handleClick} 
      className={`relative bg-white dark:bg-slate-900 p-2 md:p-3 rounded-2xl md:rounded-[24px] border transition-all h-20 md:h-24 flex flex-col items-center justify-center text-center touch-manipulation
        ${isAdded 
          ? 'scale-90 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-none' 
          : 'border-slate-200 dark:border-slate-800 hover:border-red-500 shadow-sm active:scale-90'}
      `}
    >
      <p className={`text-[9px] md:text-[10px] font-black uppercase px-1 line-clamp-2 leading-none mb-1 transition-colors ${isAdded ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
        {product.name}
      </p>
      <p className={`text-lg md:text-xl font-black transition-colors ${isAdded ? 'text-emerald-600' : 'text-red-600'}`}>
        {product.price.toFixed(2).replace('.', ',')}
      </p>
      {isAdded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <span className="animate-in zoom-in fade-in duration-200 text-emerald-600 font-bold text-2xl drop-shadow-sm">+1</span>
        </div>
      )}
    </button>
  );
});

const SkeletonCard = () => (
  <div className="h-20 md:h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl md:rounded-[24px] animate-pulse"></div>
);

const POSProductGrid: React.FC<POSProductGridProps> = ({ products, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());
  const [isChangingCategory, setIsChangingCategory] = useState(false);

  // Debounce na busca para evitar filtragens excessivas
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Simula skeleton ao filtrar ou carregar
  useEffect(() => {
    setIsChangingCategory(true);
    const t = setTimeout(() => setIsChangingCategory(false), 300);
    return () => clearTimeout(t);
  }, [debouncedTerm]);

  const filteredProducts = useMemo(() => 
    (products || []).filter(p => p.name.toLowerCase().includes(debouncedTerm.toLowerCase())),
  [products, debouncedTerm]);

  const favorites = useMemo(() => 
    filteredProducts.filter(p => p.isFavorite),
  [filteredProducts]);

  const categories: string[] = useMemo(() => 
    (Array.from(new Set(filteredProducts.map(p => p.category))) as string[]).sort(),
  [filteredProducts]);

  const toggleCategory = (cat: string) => {
    setCollapsedCats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cat)) newSet.delete(cat);
      else newSet.add(cat);
      return newSet;
    });
  };

  const toggleExpandList = (cat: string) => {
    setExpandedLists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cat)) newSet.delete(cat);
      else newSet.add(cat);
      return newSet;
    });
  };

  // Callback estável para o ProductCard
  const handleAddClick = useCallback((p: Product) => {
    onAddProduct(p);
  }, [onAddProduct]);

  return (
    <div className="flex-1 space-y-4 md:space-y-6 pb-24">
      <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl md:rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <div className="p-2 md:p-3 bg-slate-100 dark:bg-slate-800 rounded-xl md:rounded-2xl text-slate-400">
           <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input 
          type="text" 
          placeholder="BUSCAR NO CARDÁPIO..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="w-full px-3 md:px-6 py-2 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-[10px] md:text-[11px] tracking-widest outline-none border-none shadow-inner" 
        />
      </div>

      {isChangingCategory ? (
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
         </div>
      ) : (
        <div className="space-y-8 md:space-y-10">
          {favorites.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-[9px] md:text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] pl-2">⭐ FAVORITOS</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                {favorites.map(p => (
                  <ProductCard key={p.id} product={p} onClick={handleAddClick} />
                ))}
              </div>
            </div>
          )}
          
          {categories.map(cat => {
            const catProducts = filteredProducts.filter(p => p.category === cat);
            const isExpanded = expandedLists.has(cat);
            const visibleProducts = isExpanded || debouncedTerm ? catProducts : catProducts.slice(0, 12);
            const hasMore = catProducts.length > 12;

            return (
              <div key={cat} className="space-y-3 md:space-y-4">
                <div 
                  onClick={() => toggleCategory(cat)} 
                  className="flex items-center gap-3 md:gap-4 cursor-pointer group select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 md:p-2 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2">
                    <svg className={`w-3 h-3 md:w-4 md:h-4 text-red-600 transition-transform duration-300 ${collapsedCats.has(cat) ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" /></svg>
                    <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em] group-hover:text-red-500 transition-colors">{cat}</h3>
                  </div>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  <span className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase whitespace-nowrap">{catProducts.length} ITENS</span>
                </div>
                
                {!collapsedCats.has(cat) && (
                  <div className="animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                      {visibleProducts.map(p => (
                        <ProductCard key={p.id} product={p} onClick={handleAddClick} />
                      ))}
                    </div>
                    
                    {hasMore && !debouncedTerm && (
                      <button 
                        onClick={() => toggleExpandList(cat)}
                        className="w-full mt-3 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200"
                      >
                        {isExpanded ? 'Mostrar Menos' : `Ver +${catProducts.length - 12} produtos em ${cat}`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filteredProducts.length === 0 && <div className="py-20 text-center text-slate-400 font-black uppercase text-[9px] tracking-[0.4em] italic opacity-30">Vazio</div>}
        </div>
      )}
    </div>
  );
};

export default POSProductGrid;
