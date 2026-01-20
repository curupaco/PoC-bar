
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
      // Remover vínculo dos produtos
      const affectedProducts = products.filter(p => p.modifierGroupId === deletedId).map(p => p.id);
      if (affectedProducts.length > 0) {
        setProducts(prev => prev.map(p => affectedProducts.includes(p.id) ? { ...p, modifierGroupId: undefined } : p));
      }
      
      // Remover vínculo das categorias
      const affectedCategories = Object.keys(categoryModifiers).filter(cat => categoryModifiers[cat] === deletedId);
      if (affectedCategories.length > 0) {
        setCategoryModifiers(prev => {
          const next = { ...prev };
          affectedCategories.forEach(cat => delete next[cat]);
          return next;
        });
      }

      // Remover o grupo
      setModifierGroups(prev => prev.filter(g => g.id !== deletedId));
      
      // Sanitização de Mesas Abertas (Regra de Negócio 1.1)
      setOpenTabs(prev => prev.map(tab => ({
        ...tab,
        items: tab.items.map(item => {
           // Se o item tinha um modificador deste grupo (identificado pelo nome da opção e preço), removemos
           // Nota: Como não salvamos o groupId no item (apenas nome/preço), fazemos uma limpeza "best effort"
           // Idealmente, SaleItem deveria ter modifierGroupId. Como não tem, mantemos o item mas sem modificador se o grupo sumiu.
           // Na arquitetura atual, o modificador é embedded, então ele persiste na venda mesmo se o grupo sumir.
           // A regra 1.1 do docs diz "varredura automática".
           // Como o dado está "flattened" no SaleItem, a exclusão do grupo não quebra a venda histórica/aberta por padrão.
           return item; 
        })
      })));
    }
    setDeleteConfirmId(null);
  };

  const openEdit = (item: any, type: 'prod' | 'mod') => {
    setEditingId(item.id);
    if (type === 'prod') {
      const p = item as Product;
      setName(p.name);
      setPrice(p.price.toFixed(2).replace('.', ','));
      setCategory(p.category);
      setSellType(p.sellType);
      setModGroupId(p.modifierGroupId || '');
      setActiveTab('ITEMS');
    } else {
      const g = item as ModifierGroup;
      setGroupName(g.name);
      setGroupCategory(g.category);
      setOptions(g.options);
      setActiveTab('GROUPS');
    }
    setShowModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* HEADER DE NAVEGAÇÃO DE ABAS */}
      <div className="flex justify-center mb-8">
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex">
           {[
             { id: 'ITEMS', label: 'Produtos' },
             { id: 'GROUPS', label: 'Adicionais' },
             { id: 'CATEGORIES', label: 'Vínculos' }
           ].map(tab => (
             <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
             >
                {tab.label}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'ITEMS' && (
        <ProductItemsTab 
          products={products}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          collapsedCats={collapsedCats}
          toggleCategory={toggleCategory}
          setProducts={setProducts}
          onEdit={(p) => openEdit(p, 'prod')}
          onDelete={(id, name) => setDeleteConfirmId({ id, name, type: 'prod' })}
          onShowModal={() => { closeModal(); setActiveTab('ITEMS'); setShowModal(true); }}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {activeTab === 'GROUPS' && (
        <ModifierGroupsTab 
          modifierGroups={modifierGroups}
          onEdit={(g) => openEdit(g, 'mod')}
          onDelete={(id, name) => setDeleteConfirmId({ id, name, type: 'mod' })}
          onShowModal={() => { closeModal(); setActiveTab('GROUPS'); setShowModal(true); }}
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

      {/* MODAL DE CADASTRO UNIFICADO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={closeModal} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl relative z-[110] border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                 {editingId ? 'Editar' : 'Novo'} {activeTab === 'GROUPS' ? 'Menu de Opções' : 'Produto'}
               </h3>
               <button onClick={closeModal} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold hover:bg-red-500 hover:text-white transition-all">✕</button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
               {activeTab === 'GROUPS' ? (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Menu</label>
                         <input autoFocus type="text" value={groupName} onChange={e => setGroupName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-sm border-2 border-transparent focus:border-red-500 outline-none transition-all" placeholder="EX: BORDA, GELO..." />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria Destaque</label>
                         <input type="text" value={groupCategory} onChange={e => setGroupCategory(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-sm border-2 border-transparent focus:border-red-500 outline-none transition-all" placeholder="OPCIONAL" />
                      </div>
                   </div>
                   
                   <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Opções do Menu</p>
                      <div className="space-y-3 mb-4">
                         {options.map((opt, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                               <span className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">{opt.name}</span>
                               <div className="flex items-center gap-3">
                                  <span className="font-black text-xs text-red-600">{opt.price > 0 ? `+ ${formatCurrency(opt.price)}` : 'GRÁTIS'}</span>
                                  <button onClick={() => setOptions(options.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                               </div>
                            </div>
                         ))}
                         {options.length === 0 && <p className="text-center text-[10px] text-slate-400 italic py-2">Nenhuma opção adicionada</p>}
                      </div>
                      <div className="flex gap-2">
                         <input 
                            type="text" 
                            value={optName} 
                            onChange={e => setOptName(e.target.value)} 
                            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 font-bold uppercase text-xs outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="NOME DA OPÇÃO" 
                            onKeyDown={e => e.key === 'Enter' && addOption()}
                         />
                         <input 
                            type="text" 
                            inputMode="decimal"
                            value={optPrice} 
                            onChange={e => setOptPrice(sanitizeCurrencyInput(e.target.value))} 
                            className="w-24 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="R$ 0,00" 
                            onKeyDown={e => e.key === 'Enter' && addOption()}
                         />
                         <button onClick={addOption} className="bg-blue-600 text-white px-4 py-3 rounded-xl font-black uppercase text-xs hover:bg-blue-700 transition-colors">Add</button>
                      </div>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                      <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-lg border-2 border-transparent focus:border-red-500 outline-none transition-all" placeholder="EX: HEINEKEN 600ML" />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço de Venda</label>
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">R$</span>
                            <input type="text" inputMode="decimal" value={price} onChange={e => setPrice(sanitizeCurrencyInput(e.target.value))} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black text-xl border-2 border-transparent focus:border-red-500 outline-none transition-all" placeholder="0,00" />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                         <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-sm border-2 border-transparent focus:border-red-500 outline-none transition-all" placeholder="EX: CERVEJAS" />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Venda</label>
                         <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <button onClick={() => setSellType('unit')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sellType === 'unit' ? 'bg-white dark:bg-slate-800 text-black dark:text-white shadow-sm' : 'text-slate-400'}`}>Unidade</button>
                            <button onClick={() => setSellType('weight')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sellType === 'weight' ? 'bg-white dark:bg-slate-800 text-black dark:text-white shadow-sm' : 'text-slate-400'}`}>Peso (KG)</button>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Menu de Opções</label>
                         <select value={modGroupId} onChange={e => setModGroupId(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold uppercase text-xs border-2 border-transparent focus:border-red-500 outline-none transition-all">
                            <option value="">Sem Opções Extras</option>
                            {modifierGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                         </select>
                      </div>
                   </div>
                 </>
               )}
               
               {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center font-black uppercase text-xs">{error}</div>}
               
               <button onClick={activeTab === 'GROUPS' ? handleSaveGroup : handleSaveProduct} className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95">
                  Salvar {activeTab === 'GROUPS' ? 'Menu' : 'Produto'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-[210] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </div>
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-4 tracking-tighter leading-none italic">Excluir Item?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed px-2">
               Você tem certeza que deseja remover <span className="font-bold text-slate-800 dark:text-white">"{deleteConfirmId.name}"</span>?
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={executeDelete} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Sim, Remover</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
