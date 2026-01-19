
import React, { useState, useMemo } from 'react';
// Added sanitizeCurrencyInput to imports from types
import { Product, formatCurrency, User, ModifierGroup, ModifierOption, parseCurrencyValue, sanitizeCurrencyInput } from '../types';

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
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(''); 
  const [modGroupId, setModGroupId] = useState<string>('');

  const handleSaveProduct = () => {
    const numericPrice = parseCurrencyValue(price);
    if (!name.trim()) { setError("NOME OBRIGATÓRIO"); return; }
    if (!category.trim()) { setError("CATEGORIA OBRIGATÓRIA"); return; }
    if (numericPrice <= 0) { setError("O PREÇO DEVE SER MAIOR QUE ZERO"); return; }
    
    const productData: Product = {
      id: editingId || Date.now().toString(),
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

  const closeModal = () => {
    setShowModal(false); setEditingId(null); setError(null);
    setName(''); setPrice(''); setCategory(''); setModGroupId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[24px] border dark:border-slate-800 shadow-sm w-fit overflow-x-auto">
         <button onClick={() => setActiveTab('ITEMS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'ITEMS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500'}`}>Produtos</button>
         <button onClick={() => setActiveTab('GROUPS')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'GROUPS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500'}`}>Menus de Opções</button>
         <button onClick={() => setActiveTab('CATEGORIES')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'CATEGORIES' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500'}`}>Vínculos de Categoria</button>
      </div>

      {activeTab === 'ITEMS' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">Gerenciar Cardápio</h2>
            <button onClick={() => setShowModal(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Novo Produto</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {products.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border dark:border-slate-800 shadow-sm flex justify-between items-center group">
                <div>
                  <p className="font-black uppercase text-sm">{p.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-black text-red-600">{formatCurrency(p.price)}</p>
                    <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase text-slate-400 tracking-tighter">{p.category}</span>
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

      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] p-10 border dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-2xl font-black uppercase italic mb-8">Produto</h3>
              {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase text-center">{error}</div>}
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nome do Produto</label>
                    <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} placeholder="EX: HEINEKEN 600ML" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black border-none outline-none uppercase" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Preço de Venda</label>
                    {/* sanitizeCurrencyInput is now imported from types.ts */}
                    <input type="text" value={price} onChange={e => setPrice(sanitizeCurrencyInput(e.target.value))} placeholder="0,00" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black text-3xl text-red-600 outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Categoria</label>
                    <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="EX: CERVEJAS" className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-xs outline-none border border-transparent focus:border-red-500" />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button onClick={handleSaveProduct} className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl active:scale-95 transition-all">Salvar</button>
                    <button onClick={closeModal} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase">Sair</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
