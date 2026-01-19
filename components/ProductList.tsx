
import React, { useState, useMemo } from 'react';
import { Product, formatCurrency, User, ModifierGroup, ModifierOption, parseCurrencyValue, sanitizeCurrencyInput, generateUniqueId } from '../types';

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
  const [showModModal, setShowModModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingModId, setEditingModId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // States para Produtos
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(''); 
  const [modGroupId, setModGroupId] = useState<string>('');

  // States para Menus de Opções
  const [modGroupName, setModGroupName] = useState('');
  const [modGroupCategory, setModGroupCategory] = useState('');
  const [modOptions, setModOptions] = useState<ModifierOption[]>([]);
  const [newOptName, setNewOptName] = useState('');
  const [newOptPrice, setNewOptPrice] = useState('');

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category.toUpperCase().trim()))).sort(), [products]);

  const handleSaveProduct = () => {
    const numericPrice = parseCurrencyValue(price);
    if (!name.trim() || !category.trim()) { setError("CAMPOS OBRIGATÓRIOS!"); return; }
    const productData: Product = {
      id: editingId || generateUniqueId('prod'),
      name: name.toUpperCase().trim(),
      price: numericPrice,
      category: category.toUpperCase().trim(),
      sellType: 'unit',
      modifierGroupId: modGroupId || undefined,
      isFavorite: editingId ? products.find(p => p.id === editingId)?.isFavorite : false
    };
    setProducts(prev => editingId ? prev.map(p => p.id === editingId ? productData : p) : [...prev, productData]);
    closeModal();
  };

  const handleSaveModGroup = () => {
    if (!modGroupName.trim()) { setError("NOME DO MENU OBRIGATÓRIO!"); return; }
    const groupData: ModifierGroup = {
      id: editingModId || generateUniqueId('mod'),
      name: modGroupName.toUpperCase().trim(),
      category: modGroupCategory.toUpperCase().trim() || 'GERAL',
      options: modOptions
    };
    setModifierGroups(prev => editingModId ? prev.map(g => g.id === editingModId ? groupData : g) : [...prev, groupData]);
    closeModModal();
  };

  const closeModal = () => {
    setShowModal(false); setEditingId(null); setError(null);
    setName(''); setPrice(''); setCategory(''); setModGroupId('');
  };

  const closeModModal = () => {
    setShowModModal(false); setEditingModId(null); setError(null);
    setModGroupName(''); setModGroupCategory(''); setModOptions([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm w-fit overflow-x-auto no-scrollbar">
         <button onClick={() => setActiveTab('ITEMS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ITEMS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500'}`}>Produtos</button>
         <button onClick={() => setActiveTab('GROUPS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'GROUPS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500'}`}>Menus de Opções</button>
         <button onClick={() => setActiveTab('CATEGORIES')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CATEGORIES' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500'}`}>Vínculos Automáticos</button>
      </div>

      {activeTab === 'ITEMS' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div><h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">Cardápio</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{products.length} itens</p></div>
            <button onClick={() => setShowModal(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Novo Produto</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {products.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center group">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black uppercase text-sm text-slate-800 dark:text-white">{p.name}</p>
                    <button onClick={() => setProducts(prev => prev.map(x => x.id === p.id ? {...x, isFavorite: !x.isFavorite} : x))} className={`text-sm ${p.isFavorite ? 'text-amber-500' : 'text-slate-200 dark:text-slate-800'} hover:scale-125 transition-transform`}>★</button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-lg font-black text-red-600">{formatCurrency(p.price)}</p>
                    <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase text-slate-400">{p.category}</span>
                    {p.modifierGroupId && <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded uppercase">MENU ATIVO</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(p.id); setName(p.name); setPrice(p.price.toFixed(2).replace('.', ',')); setCategory(p.category); setModGroupId(p.modifierGroupId || ''); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                  <button onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'GROUPS' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div><h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">Menus de Opções / Serviços</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crie serviços extras ou opcionais</p></div>
            <button onClick={() => setShowModModal(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Novo Menu</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {modifierGroups.map(group => (
               <div key={group.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                     <div><h4 className="font-black uppercase text-lg text-slate-800 dark:text-white">{group.name}</h4><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opções: {group.options.length}</p></div>
                     <div className="flex gap-1">
                        <button onClick={() => { setEditingModId(group.id); setModGroupName(group.name); setModGroupCategory(group.category); setModOptions(group.options); setShowModModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={() => setModifierGroups(prev => prev.filter(g => g.id !== group.id))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                     </div>
                  </div>
                  <div className="space-y-2 flex-1">
                     {group.options.map((opt, i) => (
                       <div key={i} className="flex justify-between text-[11px] font-bold py-1 border-b border-slate-50 dark:border-slate-800 last:border-0"><span className="text-slate-500 uppercase">{opt.name}</span><span className="text-emerald-500">+{formatCurrency(opt.price)}</span></div>
                     ))}
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'CATEGORIES' && (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <h3 className="text-xl font-black uppercase italic text-slate-800 dark:text-white">Vínculos por Categoria</h3>
              <p className="text-xs text-slate-500 mt-2">Vincule um menu a todos os itens de uma categoria.</p>
           </div>
           <div className="space-y-4">
              {categories.map(cat => (
                <div key={cat} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                   <h4 className="font-black text-lg text-slate-800 dark:text-white uppercase">{cat}</h4>
                   <div className="w-64">
                      <select value={categoryModifiers[cat] || ''} onChange={e => setCategoryModifiers(prev => ({...prev, [cat]: e.target.value}))} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold uppercase text-[10px] outline-none">
                        <option value="">Sem Vínculo</option>
                        {modifierGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* MODAL PRODUTO */}
      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-2xl font-black uppercase italic mb-8 text-slate-800 dark:text-white">{editingId ? 'Editar' : 'Novo'} Produto</h3>
              {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase text-center">{error}</div>}
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome</label>
                    <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} placeholder="EX: HEINEKEN 600ML" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black border-none outline-none uppercase shadow-inner" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Preço</label>
                        <input type="text" value={price} onChange={e => setPrice(sanitizeCurrencyInput(e.target.value))} placeholder="0,00" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black text-2xl text-red-600 outline-none shadow-inner" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
                        <input type="text" value={category} onChange={e => setCategory(e.target.value)} list="existing-cats" placeholder="EX: BEBIDAS" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-xs outline-none focus:ring-2 focus:ring-red-500 shadow-inner" />
                        <datalist id="existing-cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vínculo Individual</label>
                    <select value={modGroupId} onChange={e => setModGroupId(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-xs outline-none shadow-inner">
                      <option value="">Padrão da categoria</option>
                      {modifierGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button onClick={handleSaveProduct} className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl active:scale-95 transition-all">Salvar</button>
                    <button onClick={closeModal} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase">Sair</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL MENU DE OPÇÕES */}
      {showModModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              <h3 className="text-2xl font-black uppercase italic mb-8 text-slate-800 dark:text-white">Gerenciar Menu de Opções</h3>
              <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nome</label><input autoFocus type="text" value={modGroupName} onChange={e => setModGroupName(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-sm outline-none shadow-inner" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Tipo</label><input type="text" value={modGroupCategory} onChange={e => setModGroupCategory(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-sm outline-none shadow-inner" /></div>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[32px] space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Adicionar Opção</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                       <input type="text" value={newOptName} onChange={e => setNewOptName(e.target.value)} placeholder="NOME" className="md:col-span-2 p-4 rounded-xl bg-white dark:bg-slate-900 font-bold uppercase text-xs border-none outline-none" />
                       <div className="flex gap-2">
                          <input type="text" value={newOptPrice} onChange={e => setNewOptPrice(sanitizeCurrencyInput(e.target.value))} placeholder="0,00" className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-900 font-bold text-emerald-500 border-none outline-none" />
                          <button onClick={() => { if(newOptName.trim()){ setModOptions([...modOptions, { name: newOptName.toUpperCase().trim(), price: parseCurrencyValue(newOptPrice) }]); setNewOptName(''); setNewOptPrice(''); } }} className="bg-black text-white w-12 h-12 rounded-xl font-black text-xl">+</button>
                       </div>
                    </div>
                    <div className="pt-4 space-y-2">
                       {modOptions.map((opt, i) => (
                         <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 shadow-sm"><div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-800 dark:text-white">{opt.name}</span><span className="text-[9px] font-bold text-emerald-500">+{formatCurrency(opt.price)}</span></div><button onClick={() => setModOptions(modOptions.filter((_, idx) => idx !== i))} className="text-red-500 p-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="flex gap-4 pt-8">
                 <button onClick={handleSaveModGroup} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl">Salvar Menu</button>
                 <button onClick={closeModModal} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase">Cancelar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
