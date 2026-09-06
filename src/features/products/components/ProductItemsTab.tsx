import React, { useMemo, useDeferredValue } from 'react';
import { Product, formatCurrency } from '../../../types';
import { Input } from '../../../shared/ui/Input';
import Button from '../../../shared/ui/Button';
import Card from '../../../shared/ui/Card';
import Badge from '../../../shared/ui/Badge';

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
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const { groupedProducts, sortedCategories } = useMemo(() => {
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
      sortedCategories: sorted
    };
  }, [products, deferredSearchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card variant="glass" padding="md" className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-1 w-full">
          <Input 
            placeholder="LOCALIZAR NO CARDÁPIO..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <Button onClick={onShowModal} variant="primary" size="md" className="w-full md:w-auto shrink-0 h-12 flex items-center justify-center gap-2">
          <span>➕</span>
          <span>Novo Produto</span>
        </Button>
      </Card>

      <div className="space-y-10 pb-24">
        {sortedCategories.map((cat) => (
          <div key={cat} className="space-y-4">
            <div 
              onClick={() => toggleCategory(cat)}
              className="flex items-center gap-4 cursor-pointer group select-none"
            >
              <div className="flex items-center gap-2">
                <svg className={`w-4 h-4 text-red-600 transition-transform duration-300 ${collapsedCats.has(cat) ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" />
                </svg>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-red-500 transition-colors">{cat}</h3>
              </div>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
              <Badge variant="neutral" size="sm">{groupedProducts[cat].length} ITENS</Badge>
            </div>

            {!collapsedCats.has(cat) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
                {groupedProducts[cat].map(p => (
                  <Card key={p.id} hoverEffect padding="md" className="flex justify-between items-center group">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black uppercase text-sm text-slate-800 dark:text-white truncate">{p.name}</p>
                        {p.isRawMaterial && (
                          <Badge variant="info" size="sm">Insumo</Badge>
                        )}
                        <button 
                          onClick={() => setProducts(prev => prev.map(x => x.id === p.id ? {...x, isFavorite: !x.isFavorite} : x))} 
                          className={`w-6 h-6 flex items-center justify-center text-sm ${p.isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700'} hover:scale-125 transition-transform`}
                          title={p.isFavorite ? "Remover dos favoritos" : "Marcar como favorito"}
                        >
                          ★
                        </button>
                      </div>
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(p.price)}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        disabled={!canEdit}
                        onClick={() => onEdit(p)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 transition-colors"
                        title="Editar produto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      <button
                        disabled={!canDelete}
                        onClick={() => onDelete(p.id, p.name)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors"
                        title="Excluir produto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default ProductItemsTab;
