
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
  const [showModModal, setShowModModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingModId, setEditingModId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // States para Produtos
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(''); 
  const [sellType, setSellType] = useState<SellType>('unit');
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
      sellType: sellType, // INÍCIO DA ALTERAÇÃO: Respeitando a escolha do usuário entre Unidade e Peso
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
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${p.sellType === 'weight' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>{p.sellType === 'weight' ? 'PESO (KG)' : 'UNIDADE'}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(p.id); setName(p.name); setPrice(p.price.toFixed(2).replace('.', ',')); setCategory(p.category); setSellType(p.sellType); setModGroupId(p.modifierGroupId || ''); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                  <button onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL PRODUTO CORRIGIDO */}
      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-2xl font-black uppercase italic mb-8 text-slate-800 dark:text-white">{editingId ? 'Editar' : 'Novo'} Produto</h3>
              {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase text-center">{error}</div>}
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome do Produto</label>
                    <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} placeholder="EX: HEINEKEN 600ML" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black border-none outline-none uppercase shadow-inner" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Preço (ou Preço por KG)</label>
                        <input type="text" value={price} onChange={e => setPrice(sanitizeCurrencyInput(e.target.value))} placeholder="0,00" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black text-2xl text-red-600 outline-none shadow-inner" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
                        <input type="text" value={category} onChange={e => setCategory(e.target.value)} list="existing-cats" placeholder="EX: BEBIDAS" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-xs outline-none focus:ring-2 focus:ring-red-500 shadow-inner" />
                        <datalist id="existing-cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
                    </div>
                 </div>
                 {/* NOVO: SELETOR DE TIPO DE VENDA */}
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Modo de Venda</label>
                    <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                       <button onClick={() => setSellType('unit')} className={`py-3 rounded-xl font-black uppercase text-[10px] transition-all ${sellType === 'unit' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}>Unidade</button>
                       <button onClick={() => setSellType('weight')} className={`py-3 rounded-xl font-black uppercase text-[10px] transition-all ${sellType === 'weight' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}>Peso (KG)</button>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vínculo de Menu Individual</label>
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
      {/* Restante do código de Menus e Categorias permanece igual no App.tsx original */}
    </div>
  );
};

export default ProductList;
