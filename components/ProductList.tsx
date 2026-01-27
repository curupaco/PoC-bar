
import React, { useState, useMemo } from 'react';
import { Product, formatCurrency, User, ModifierGroup, ModifierOption, parseCurrencyValue, sanitizeCurrencyInput, generateUniqueId, SellType, Tab, Category } from '../types';
import ProductItemsTab from './products/ProductItemsTab';
import ModifierGroupsTab from './products/ModifierGroupsTab';
import CategoryLinksTab from './products/CategoryLinksTab';
import CategoriesTab from './products/CategoriesTab';

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

  const handleSaveProduct = () => {
    setError(null);
    const numericPrice = parseCurrencyValue(price);
    const finalName = name.toUpperCase().trim();
    const finalCategory = category.toUpperCase().trim();
    if (!finalName || !finalCategory) { setError("NOME E CATEGORIA OBRIGATÓRIOS!"); return; }
    if (numericPrice <= 0) { setError("O PREÇO DEVE SER MAIOR QUE ZERO!"); return; }

    const productData: Product = {
      id: editingId || generateUniqueId('prod'),
      name: finalName,
      price: numericPrice,
      category: finalCategory,
      sellType: sellType,
      modifierGroupId: modGroupId || undefined,
      isFavorite: editingId ? products.find(p => p.id === editingId)?.isFavorite : false
    };

    setProducts(prev => editingId ? prev.map(p => p.id === editingId ? productData : p) : [...prev, productData]);
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false); setEditingId(null); setError(null);
    setName(''); setPrice(''); setCategory(''); setSellType('unit'); setModGroupId('');
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toFixed(2).replace('.', ','));
    setCategory(p.category);
    setSellType(p.sellType);
    setModGroupId(p.modifierGroupId || '');
    setShowModal(true);
  };

  const availableCategories = useMemo(() => {
     const savedNames = categories?.map(c => c.name) || [];
     const currentProdNames = Array.from(new Set(products.map(p => p.category.toUpperCase().trim()))).sort();
     return Array.from(new Set([...savedNames, ...currentProdNames])).sort();
  }, [categories, products]);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-center mb-8 overflow-x-auto no-scrollbar">
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex">
           {[
             { id: 'ITEMS', label: 'Produtos' },
             { id: 'CATEGORIES_MANAGE', label: 'Categorias' },
             { id: 'GROUPS', label: 'Adicionais' },
             { id: 'LINKS', label: 'Vínculos' }
           ].map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-red-800 dark:hover:text-slate-200'}`}>{tab.label}</button>
           ))}
        </div>
      </div>

      {activeTab === 'ITEMS' && (
        <ProductItemsTab 
          products={products}
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          collapsedCats={collapsedCats} toggleCategory={(cat) => setCollapsedCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; })}
          setProducts={setProducts} onEdit={openEdit} onDelete={(id, name) => setDeleteConfirmId({ id, name, type: 'prod' })}
          onShowModal={() => { closeModal(); setShowModal(true); }} canEdit={canEdit} canDelete={canDelete}
        />
      )}

      {activeTab === 'GROUPS' && (
        <ModifierGroupsTab 
          modifierGroups={modifierGroups} onEdit={() => {}} onDelete={(id, name) => setDeleteConfirmId({ id, name, type: 'mod' })} onShowModal={() => {}}
        />
      )}

      {activeTab === 'CATEGORIES_MANAGE' && setCategories && (
         <CategoriesTab categories={categories || []} setCategories={setCategories} products={products} setProducts={setProducts} />
      )}

      {activeTab === 'LINKS' && (
         <CategoryLinksTab categories={availableCategories} categoryModifiers={categoryModifiers} modifierGroups={modifierGroups} setCategoryModifiers={setCategoryModifiers} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={closeModal} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-2xl relative z-[710] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{editingId ? 'Ajustar Item' : 'Novo Produto'}</h3>
               <button onClick={closeModal} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold">✕</button>
            </div>
            <div className="p-8 space-y-6">
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                  <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-lg outline-none border-2 border-transparent focus:border-red-500 transition-all shadow-inner" placeholder="EX: HEINEKEN 600ML" />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço de Venda</label>
                     <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                        <input type="text" inputMode="decimal" value={price} onChange={e => setPrice(sanitizeCurrencyInput(e.target.value))} className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black text-2xl outline-none shadow-inner" placeholder="0,00" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                     <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-sm outline-none shadow-inner">
                        <option value="">SELECIONE...</option>
                        {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
               </div>
               <button onClick={handleSaveProduct} className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 shadow-red-500/20">Salvar no Cardápio</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-[810] text-center">
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-4 italic">Excluir "{deleteConfirmId.name}"?</h3>
             <div className="flex flex-col gap-3">
                <button onClick={() => { 
                   if (deleteConfirmId.type === 'prod') setProducts(p => p.filter(x => x.id !== deleteConfirmId.id));
                   setDeleteConfirmId(null);
                }} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Confirmar Exclusão</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-4 text-slate-400 font-black uppercase text-xs">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
