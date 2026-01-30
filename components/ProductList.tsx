
import React, { useState, useMemo, useEffect } from 'react';
import { Product, formatCurrency, User, ModifierGroup, ModifierOption, parseCurrencyValue, sanitizeCurrencyInput, generateUniqueId, SellType, Tab, Category } from '../types';
import ProductItemsTab from './products/ProductItemsTab';
import ModifierGroupsTab from './products/ModifierGroupsTab';
import CategoryLinksTab from './products/CategoryLinksTab';
import CategoriesTab from './products/CategoriesTab';
import ModifierGroupModal from './products/ModifierGroupModal';

interface ProductListProps {
  products: Product[];
  setProducts: (updater: (prev: Product[]) => Product[]) => void;
  modifierGroups: ModifierGroup[];
  setModifierGroups: (updater: (prev: ModifierGroup[]) => ModifierGroup[]) => void;
  categoryModifiers: Record<string, string>;
  setCategoryModifiers: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  openTabs: Tab[];
  onSaveTab: (tab: Tab) => void;
  categories?: Category[];
  setCategories?: (updater: (prev: Category[]) => Category[]) => void;
  currentUser: User;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products = [], 
  setProducts,
  modifierGroups = [], 
  setModifierGroups, 
  categoryModifiers = {},
  setCategoryModifiers,
  openTabs,
  onSaveTab,
  categories = [],
  setCategories,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'GROUPS' | 'LINKS' | 'CATEGORIES_MANAGE'>('ITEMS');
  const [showModal, setShowModal] = useState(false);
  
  // UX-01: Estado para feedback visual (Toast)
  const [toast, setToast] = useState<string | null>(null);

  // States para Grupos de Modificadores
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string, type: 'prod' | 'mod'} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Form States
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(''); 
  const [sellType, setSellType] = useState<SellType>('unit');
  const [modGroupId, setModGroupId] = useState<string>('');

  const canEdit = currentUser.username === 'admin' || currentUser.permissions.includes('edit_product');
  const canDelete = currentUser.username === 'admin' || currentUser.permissions.includes('delete_product');

  // Limpa o toast automaticamente
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showFeedback = (msg: string) => setToast(msg);

  const handleSaveProduct = () => {
    setError(null);
    const numericPrice = parseCurrencyValue(price);
    const finalName = name.toUpperCase().trim();
    const finalCategory = category.toUpperCase().trim() || 'GERAL';

    if (!finalName) { setError("Nome é obrigatório."); return; }
    if (isNaN(numericPrice) || numericPrice < 0) { setError("Preço inválido."); return; }

    if (editingId) {
      setProducts(prev => prev.map(p => p.id === editingId ? {
        ...p,
        name: finalName,
        price: numericPrice,
        category: finalCategory,
        sellType,
        modifierGroupId: modGroupId || undefined
      } : p));
      showFeedback("PRODUTO ATUALIZADO!");
    } else {
      const newProduct: Product = {
        id: generateUniqueId('prod'),
        name: finalName,
        price: numericPrice,
        category: finalCategory,
        sellType,
        isFavorite: false,
        modifierGroupId: modGroupId || undefined
      };
      setProducts(prev => [...prev, newProduct]);
      showFeedback("PRODUTO CADASTRADO!");
    }

    // CORREÇÃO: Criação segura de categoria com verificação atômica dentro do updater
    // Isso previne que salvamentos rápidos criem categorias duplicadas por race condition
    if (setCategories) {
        setCategories(prev => {
            const exists = prev.some(c => c.name.toUpperCase().trim() === finalCategory);
            if (exists) return prev;
            return [...prev, { id: generateUniqueId('cat'), name: finalCategory }];
        });
    }

    closeModal();
  };

  const handleSaveGroup = (group: ModifierGroup) => {
    setModifierGroups(prev => {
      const exists = prev.some(g => g.id === group.id);
      if (exists) {
        return prev.map(g => g.id === group.id ? group : g);
      } else {
        return [...prev, group];
      }
    });
    showFeedback("MENU DE OPÇÕES SALVO!");
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  const openEditProduct = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toFixed(2).replace('.', ','));
    setCategory(p.category);
    setSellType(p.sellType);
    setModGroupId(p.modifierGroupId || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setName('');
    setPrice('');
    setCategory('');
    setSellType('unit');
    setModGroupId('');
    setError(null);
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    if (deleteConfirmId.type === 'prod') {
      setProducts(prev => prev.filter(p => p.id !== deleteConfirmId.id));
      showFeedback("ITEM REMOVIDO");
    } else {
      setModifierGroups(prev => prev.filter(g => g.id !== deleteConfirmId.id));
      showFeedback("GRUPO REMOVIDO");
    }
    setDeleteConfirmId(null);
  };

  // Safe category list including distinct categories from products if missing in official list
  // CORREÇÃO: Normalização estrita (trim + upper) para evitar duplicatas visuais (ex: "BEBIDAS" vs "BEBIDAS ")
  const allCategories = useMemo(() => {
     const catNames = new Set<string>();
     
     // 1. Normaliza categorias oficiais
     categories.forEach(c => {
         if (c.name) catNames.add(c.name.trim().toUpperCase());
     });

     // 2. Normaliza categorias vindas dos produtos (para capturar órfãs)
     products.forEach(p => { 
         if(p.category) catNames.add(p.category.trim().toUpperCase()); 
     });
     
     return Array.from(catNames).sort();
  }, [categories, products]);

  return (
    <div className="max-w-7xl mx-auto pb-32 relative">
      {/* TOAST NOTIFICATION (UX-01) */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1200] animate-in slide-in-from-top-4 fade-in">
           <div className="bg-emerald-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-3 border border-emerald-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              {toast}
           </div>
        </div>
      )}

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <button onClick={() => setActiveTab('ITEMS')} className={`flex-1 min-w-[120px] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'ITEMS' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Produtos</button>
        <button onClick={() => setActiveTab('GROUPS')} className={`flex-1 min-w-[120px] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'GROUPS' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Adicionais</button>
        <button onClick={() => setActiveTab('LINKS')} className={`flex-1 min-w-[120px] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'LINKS' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Vínculos</button>
        {setCategories && (
          <button onClick={() => setActiveTab('CATEGORIES_MANAGE')} className={`flex-1 min-w-[120px] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'CATEGORIES_MANAGE' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Categorias</button>
        )}
      </div>

      {activeTab === 'ITEMS' && (
        <ProductItemsTab 
          products={products}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          collapsedCats={collapsedCats}
          toggleCategory={toggleCategory}
          setProducts={setProducts}
          onEdit={openEditProduct}
          onDelete={(id, name) => setDeleteConfirmId({id, name, type: 'prod'})}
          onShowModal={() => setShowModal(true)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {activeTab === 'GROUPS' && (
        <ModifierGroupsTab 
          modifierGroups={modifierGroups}
          onEdit={(g) => { setEditingGroup(g); setShowGroupModal(true); }}
          onDelete={(id, name) => setDeleteConfirmId({id, name, type: 'mod'})}
          onShowModal={() => { setEditingGroup(null); setShowGroupModal(true); }}
        />
      )}

      {activeTab === 'LINKS' && (
        <CategoryLinksTab 
          categories={allCategories}
          categoryModifiers={categoryModifiers}
          modifierGroups={modifierGroups}
          setCategoryModifiers={setCategoryModifiers}
        />
      )}

      {activeTab === 'CATEGORIES_MANAGE' && categories && setCategories && (
        <CategoriesTab 
          categories={categories}
          setCategories={setCategories}
          products={products}
          setProducts={setProducts}
        />
      )}

      {/* MODAL DE GRUPO DE MODIFICADORES */}
      <ModifierGroupModal 
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onSave={handleSaveGroup}
        initialData={editingGroup}
      />

      {/* MODAL DE PRODUTO */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={closeModal} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center mb-8 shrink-0">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={closeModal} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-bold">✕</button>
            </div>

            <div className="space-y-6 overflow-y-auto no-scrollbar p-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                <input 
                  autoFocus
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-sm uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                  placeholder="EX: HEINEKEN 600ML" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Venda</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={price} 
                      onChange={e => setPrice(sanitizeCurrencyInput(e.target.value))} 
                      className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-lg outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                      placeholder="0,00" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade</label>
                  <div className="flex p-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button onClick={() => setSellType('unit')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${sellType === 'unit' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}>UN</button>
                    <button onClick={() => setSellType('weight')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${sellType === 'weight' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}>KG</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allCategories.slice(0, 5).map(c => (
                    <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${category === c ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-xs uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                  placeholder="DIGITE OU SELECIONE..." 
                  list="cat-suggestions"
                />
                <datalist id="cat-suggestions">
                  {allCategories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Menu de Adicionais (Opcional)</label>
                <select 
                  value={modGroupId} 
                  onChange={e => setModGroupId(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all"
                >
                  <option value="">Sem adicionais</option>
                  {modifierGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <p className="text-center text-[10px] font-black text-red-500 uppercase">{error}</p>
                </div>
              )}
            </div>

            <div className="pt-6 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 shrink-0">
              <button onClick={handleSaveProduct} className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">
                Salvar Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-4 italic">Excluir Item?</h3>
             <p className="text-sm text-slate-500 mb-8 leading-relaxed">Você está prestes a remover <strong className="text-slate-800 dark:text-white">"{deleteConfirmId.name}"</strong> do cadastro.</p>
             <div className="flex flex-col gap-3">
                <button onClick={confirmDelete} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Sim, Excluir</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-4 text-slate-400 font-black uppercase text-xs tracking-widest">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
