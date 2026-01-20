
import React, { useState, useMemo } from 'react';
import { Product, formatCurrency, User, ModifierGroup, ModifierOption, parseCurrencyValue, sanitizeCurrencyInput, generateUniqueId, SellType } from '../types';

interface ProductListProps {
  products: Product[];
  setProducts: (updater: (prev: Product[]) => Product[]) => void;
  modifierGroups: ModifierGroup[];
  setModifierGroups: (updater: (prev: ModifierGroup[]) => ModifierGroup[]) => void;
  categoryModifiers: Record<string, string>;
  setCategoryModifiers: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  currentUser: User;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products = [], 
  setProducts,
  modifierGroups = [], 
  setModifierGroups, 
  categoryModifiers = {},
  setCategoryModifiers,
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

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach(p => {
      const cat = p.category.toUpperCase().trim() || 'GERAL';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const toggleCategory = (cat: string) => {
    const newCollapsed = new Set(collapsedCats);
    if (newCollapsed.has(cat)) newCollapsed.delete(cat);
    else newCollapsed.add(cat);
    setCollapsedCats(newCollapsed);
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
      // 1. Remover o grupo da lista mestre
      setModifierGroups(prev => prev.filter(g => g.id !== deletedId));
      
      // 2. LIMPEZA DE ÓRFÃOS: Remover referência de produtos que usavam este grupo
      setProducts(prev => prev.map(p => p.modifierGroupId === deletedId ? { ...p, modifierGroupId: undefined } : p));
      
      // 3. LIMPEZA DE ÓRFÃOS: Remover vínculos automáticos por categoria
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
      {/* MODAL DE CONFIRMAÇÃO CUSTOMIZADO */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl relative z-[710] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </div>
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-2 tracking-tighter italic">Apagar Registro?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
               Você está prestes a remover <span className="font-bold">"{deleteConfirmId.name}"</span> definitivamente do sistema. Isso também limpará vínculos automáticos.
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={executeDelete} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Sim, Remover</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest text-slate-400">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {/* TABS DE GESTÃO */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm w-fit overflow-x-auto no-scrollbar">
         <button onClick={() => setActiveTab('ITEMS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ITEMS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'}`}>Produtos</button>
         <button onClick={() => setActiveTab('GROUPS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'GROUPS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'}`}>Menus de Opções</button>
         <button onClick={() => setActiveTab('CATEGORIES')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CATEGORIES' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'}`}>Vínculos Automáticos</button>
      </div>

      {/* ABA PRODUTOS */}
      {activeTab === 'ITEMS' && (
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
            <button onClick={() => setShowModal(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all w-full md:w-auto">Novo Produto</button>
          </div>

          <div className="space-y-10 pb-24">
            {(Object.entries(groupedProducts) as [string, Product[]][]).map(([cat, items]) => (
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
                  <span className="text-[10px] font-black text-slate-300 uppercase">{items.length} ITENS</span>
                </div>

                {!collapsedCats.has(cat) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
                    {items.map(p => (
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
                          <button disabled={!canEdit} onClick={() => { setEditingId(p.id); setName(p.name); setPrice(p.price.toFixed(2).replace('.', ',')); setCategory(p.category); setSellType(p.sellType); setModGroupId(p.modifierGroupId || ''); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all disabled:opacity-20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          <button disabled={!canDelete} onClick={() => setDeleteConfirmId({id: p.id, name: p.name, type: 'prod'})} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredProducts.length === 0 && <div className="py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] italic opacity-30">Nenhum produto encontrado</div>}
          </div>
        </div>
      )}

      {/* ABA MENUS DE OPÇÕES */}
      {activeTab === 'GROUPS' && (
        <div className="space-y-6 animate-in fade-in duration-300 pb-24">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Menus de Opções</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Crie adicionais e acompanhamentos dinâmicos</p>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Novo Menu</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modifierGroups.map(group => (
              <div key={group.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="font-black text-lg uppercase text-slate-800 dark:text-white leading-none">{group.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Destaque: {group.category || 'Geral'}</p>
                   </div>
                   <div className="flex gap-1">
                      <button onClick={() => { setEditingId(group.id); setGroupName(group.name); setGroupCategory(group.category); setOptions(group.options); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={() => setDeleteConfirmId({id: group.id, name: group.name, type: 'mod'})} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                   </div>
                </div>
                <div className="space-y-2">
                   {group.options.map((opt, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                         <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{opt.name}</span>
                         <span className="text-xs font-black text-red-600">{opt.price > 0 ? `+ ${formatCurrency(opt.price)}` : 'GRÁTIS'}</span>
                      </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA VÍNCULOS AUTOMÁTICOS */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-6 animate-in fade-in duration-300 pb-24">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Vínculos por Categoria</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure o sistema para abrir menus de opções sozinhos em certas categorias</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {categories.map(cat => (
                <div key={cat} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                   <span className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">{cat}</span>
                   <select 
                      value={categoryModifiers[cat] || ''} 
                      onChange={e => setCategoryModifiers(prev => ({ ...prev, [cat]: e.target.value }))}
                      className="flex-1 w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-[10px] tracking-widest border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-red-500 transition-all"
                   >
                      <option value="">NENHUM VÍNCULO ATIVO</option>
                      {modifierGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                   </select>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* MODAL UNIFICADO */}
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
                      <button onClick={addOption} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg">Adicionar à Lista</button>
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
