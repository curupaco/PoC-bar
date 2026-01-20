
import React, { useState, useMemo } from 'react';
import { Product, formatCurrency, User, ModifierGroup, ModifierOption, parseCurrencyValue, sanitizeCurrencyInput, generateUniqueId, SellType, Tab } from '../types';
import ProductItemsTab from './products/ProductItemsTab';
import ModifierGroupsTab from './products/ModifierGroupsTab';
import CategoryLinksTab from './products/CategoryLinksTab';

interface ProductListProps {
  products: Product[];
  setProducts: (updater: (prev: Product[]) => Product[]) => void;
  modifierGroups: ModifierGroup[];
  setModifierGroups: (updater: (prev: ModifierGroup[]) => ModifierGroup[]) => void;
  categoryModifiers: Record<string, string>;
  setCategoryModifiers: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  setOpenTabs: (updater: (prev: Tab[]) => Tab[]) => void;
  currentUser: User;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products = [], 
  setProducts,
  modifierGroups = [], 
  setModifierGroups, 
  categoryModifiers = {},
  setCategoryModifiers,
  setOpenTabs,
  currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'GROUPS' | 'CATEGORIES'>('ITEMS');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string, type: 'prod' | 'mod'} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Form States (Produtos)
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(''); 
  const [sellType, setSellType] = useState<SellType>('unit');
  const [modGroupId, setModGroupId] = useState<string>('');

  // Form States (Modificadores)
  const [groupName, setGroupName] = useState('');
  const [groupCategory, setGroupCategory] = useState('');
  const [options, setOptions] = useState<ModifierOption[]>([]);
  const [optName, setOptName] = useState('');
  const [optPrice, setOptPrice] = useState('');

  const canEdit = currentUser.username === 'admin' || currentUser.permissions.includes('edit_product');
  const canDelete = currentUser.username === 'admin' || currentUser.permissions.includes('delete_product');

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category.toUpperCase().trim()))).sort();
  }, [products]);

  const toggleCategory = (cat: string) => {
    setCollapsedCats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cat)) newSet.delete(cat);
      else newSet.add(cat);
      return newSet;
    });
  };

  const handleSaveProduct = () => {
    const numericPrice = parseCurrencyValue(price);
    if (!name.trim() || !category.trim()) { setError("CAMPOS OBRIGATÓRIOS!"); return; }
    const productData: Product = {
      id: editingId || generateUniqueId('prod'),
      name: name.toUpperCase().trim(),
      price: numericPrice,
      category: category.toUpperCase().trim(),
      sellType: sellType,
      modifierGroupId: modGroupId || undefined,
      isFavorite: editingId ? products.find(p => p.id === editingId)?.isFavorite : false
    };
    setProducts(prev => editingId ? prev.map(p => p.id === editingId ? productData : p) : [...prev, productData]);
    closeModal();
  };

  const handleSaveGroup = () => {
    if (!groupName.trim() || options.length === 0) { setError("NOME E AO MENOS UMA OPÇÃO SÃO OBRIGATÓRIOS!"); return; }
    const groupData: ModifierGroup = {
      id: editingId || generateUniqueId('mod'),
      name: groupName.toUpperCase().trim(),
      category: groupCategory.toUpperCase().trim(),
      options
    };
    setModifierGroups(prev => editingId ? prev.map(g => g.id === editingId ? groupData : g) : [...prev, groupData]);
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false); setEditingId(null); setError(null);
    setName(''); setPrice(''); setCategory(''); setSellType('unit'); setModGroupId('');
    setGroupName(''); setGroupCategory(''); setOptions([]); setOptName(''); setOptPrice('');
  };

  const addOption = () => {
    if (!optName.trim()) return;
    setOptions([...options, { name: optName.toUpperCase().trim(), price: parseCurrencyValue(optPrice) }]);
    setOptName(''); setOptPrice('');
  };

  const executeDelete = () => {
    if (!deleteConfirmId) return;
    if (deleteConfirmId.type === 'prod') {
      setProducts(prev => prev.filter(p => p.id !== deleteConfirmId.id));
    } else {
      const deletedId = deleteConfirmId.id;
      const affectedProducts = products.filter(p => p.modifierGroupId === deletedId).map(p => p.id);
      const affectedCategories = Object.keys(categoryModifiers).filter(cat => categoryModifiers[cat] === deletedId);

      setOpenTabs(prev => prev.map(tab => ({
        ...tab,
        items: (tab.items || []).map(item => {
          const isFromAffectedProd = affectedProducts.includes(item.productId);
          const isFromAffectedCat = affectedCategories.includes(item.category.toUpperCase().trim());
          
          if (item.modifier && (isFromAffectedProd || isFromAffectedCat)) {
            return { 
              ...item, 
              modifier: undefined,
              totalPrice: Number((item.quantity * item.unitPrice).toFixed(2))
            };
          }
          return item;
        })
      })));

      setModifierGroups(prev => prev.filter(g => g.id !== deletedId));
      setProducts(prev => prev.map(p => p.modifierGroupId === deletedId ? { ...p, modifierGroupId: undefined } : p));
      
      setCategoryModifiers(prev => {
        const updatedMap = { ...prev };
        Object.keys(updatedMap).forEach(cat => {
          if (updatedMap[cat] === deletedId) {
            delete updatedMap[cat];
          }
        });
        return updatedMap;
      });
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl relative z-[710] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </div>
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-2 tracking-tighter italic">Apagar Registro?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
               Você está prestes a remover <span className="font-bold">"{deleteConfirmId.name}"</span> definitivamente do sistema. Isso também limpará vínculos automáticos e mesas abertas.
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={executeDelete} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Sim, Remover</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest text-slate-400">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm w-fit overflow-x-auto no-scrollbar">
         <button onClick={() => setActiveTab('ITEMS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ITEMS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'}`}>Produtos</button>
         <button onClick={() => setActiveTab('GROUPS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'GROUPS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'}`}>Menus de Opções</button>
         <button onClick={() => setActiveTab('CATEGORIES')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CATEGORIES' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'}`}>Vínculos Automáticos</button>
      </div>

      {activeTab === 'ITEMS' && (
        <ProductItemsTab 
          products={products}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          collapsedCats={collapsedCats}
          toggleCategory={toggleCategory}
          setProducts={setProducts}
          onEdit={(p) => { setEditingId(p.id); setName(p.name); setPrice(p.price.toFixed(2).replace('.', ',')); setCategory(p.category); setSellType(p.sellType); setModGroupId(p.modifierGroupId || ''); setShowModal(true); }}
          onDelete={(id, name) => setDeleteConfirmId({id, name, type: 'prod'})}
          onShowModal={() => setShowModal(true)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {activeTab === 'GROUPS' && (
        <ModifierGroupsTab 
          modifierGroups={modifierGroups}
          onEdit={(g) => { setEditingId(g.id); setGroupName(g.name); setGroupCategory(g.category); setOptions(g.options); setShowModal(true); }}
          onDelete={(id, name) => setDeleteConfirmId({id, name, type: 'mod'})}
          onShowModal={() => setShowModal(true)}
        />
      )}

      {activeTab === 'CATEGORIES' && (
        <CategoryLinksTab 
          categories={categories}
          categoryModifiers={categoryModifiers}
          modifierGroups={modifierGroups}
          setCategoryModifiers={setCategoryModifiers}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh] no-scrollbar">
              <h3 className="text-2xl font-black uppercase italic mb-8 text-slate-800 dark:text-white">
                {editingId ? 'Editar' : 'Novo'} {activeTab === 'ITEMS' ? 'Produto' : 'Menu'}
              </h3>
              {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase text-center">{error}</div>}
              {activeTab === 'ITEMS' ? (
                <div className="space-y-4">
                   <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} placeholder="NOME DO PRODUTO" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black border-none outline-none uppercase shadow-inner" />
                   <div className="grid grid-cols-2 gap-4">
                      <input type="text" value={price} onChange={e => setPrice(sanitizeCurrencyInput(e.target.value))} placeholder="PREÇO 0,00" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black text-xl text-red-600 outline-none shadow-inner" />
                      <input type="text" value={category} onChange={e => setCategory(e.target.value)} list="existing-cats" placeholder="CATEGORIA" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-xs outline-none focus:ring-2 focus:ring-red-500 shadow-inner" />
                      <datalist id="existing-cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
                   </div>
                   <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                      <button onClick={() => setSellType('unit')} className={`py-3 rounded-xl font-black uppercase text-[10px] ${sellType === 'unit' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}>Unidade</button>
                      <button onClick={() => setSellType('weight')} className={`py-3 rounded-xl font-black uppercase text-[10px] ${sellType === 'weight' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}>Peso (KG)</button>
                   </div>
                   <select value={modGroupId} onChange={e => setModGroupId(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-[10px] outline-none shadow-inner">
                      <option value="">NENHUM MENU DE OPÇÕES</option>
                      {modifierGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                   </select>
                   <div className="flex gap-4 pt-4">
                      <button onClick={handleSaveProduct} className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl active:scale-95">Salvar</button>
                      <button onClick={closeModal} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase">Sair</button>
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                   <input autoFocus type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="NOME DO MENU (EX: PONTO CARNE)" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black border-none outline-none uppercase shadow-inner" />
                   <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[32px] space-y-4 shadow-inner">
                      <div className="grid grid-cols-2 gap-3">
                         <input type="text" value={optName} onChange={e => setOptName(e.target.value)} placeholder="NOME OPÇÃO" className="p-4 rounded-xl bg-white dark:bg-slate-900 font-bold uppercase text-[10px] outline-none shadow-sm" />
                         <input type="text" value={optPrice} onChange={e => setOptPrice(sanitizeCurrencyInput(e.target.value))} placeholder="ADICIONAL R$" className="p-4 rounded-xl bg-white dark:bg-slate-900 font-bold text-[10px] outline-none shadow-sm" />
                      </div>
                      <button onClick={addOption} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-9px tracking-widest shadow-lg">Adicionar à Lista</button>
                   </div>
                   <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                      {options.map((opt, i) => (
                         <div key={i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                            <span className="text-[10px] font-black uppercase">{opt.name}</span>
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black text-red-600">{formatCurrency(opt.price)}</span>
                               <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-red-500 p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                         </div>
                      ))}
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button onClick={handleSaveGroup} className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl active:scale-95">Salvar Menu</button>
                      <button onClick={closeModal} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase">Sair</button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
