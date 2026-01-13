
import React, { useState, useEffect, useMemo } from 'react';
import { Product, SellType, formatCurrency, User, sanitizeCurrencyInput, parseCurrencyValue } from '../types';

interface ProductListProps {
  products: Product[];
  onAdd: (product: Product) => void;
  onDelete: (id: string) => void;
  onUpdate: (product: Product) => void;
  currentUser: User;
}

const ProductList: React.FC<ProductListProps> = ({ products = [], onAdd, onDelete, onUpdate, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('GERAL');
  const [sellType, setSellType] = useState<SellType>('unit');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string} | null>(null);
  const [isRenamingCategory, setIsRenamingCategory] = useState(false);
  const [catToRename, setCatToRename] = useState('');
  const [newCatName, setNewCatName] = useState('');

  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<string>('TODOS');
  const [searchProduct, setSearchProduct] = useState('');

  const canEdit = currentUser.username === 'admin' || currentUser.permissions.includes('edit_product');
  const canDelete = currentUser.username === 'admin' || currentUser.permissions.includes('delete_product');

  useEffect(() => {
    if (showModal || deleteConfirmId || isRenamingCategory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showModal, deleteConfirmId, isRenamingCategory]);

  const categoriesList = useMemo(() => {
    const cats = new Set(['GERAL', 'BEBIDAS', 'CERVEJAS', 'PORÇÕES', 'REFEIÇÕES', 'DOSES', 'TABACARIA']);
    products.forEach(p => {
      if (p.category) cats.add(p.category.toUpperCase().trim());
    });
    return Array.from(cats).sort();
  }, [products]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    const normalizedSearch = searchProduct.toLowerCase().trim();

    products.forEach(p => {
      const cat = (p.category || 'GERAL').toUpperCase().trim();
      const matchesSearch = p.name.toLowerCase().includes(normalizedSearch);
      
      if (matchesSearch) {
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(p);
      }
    });
    return groups;
  }, [products, searchProduct]);

  const sortedCategories = useMemo(() => {
    const allCats = Object.keys(groupedProducts).sort();
    if (selectedCategoryIndex === 'TODOS') return allCats;
    return allCats.filter(c => c === selectedCategoryIndex);
  }, [groupedProducts, selectedCategoryIndex]);

  const handleSave = () => {
    if (!name || !price) return;
    const priceNum = parseCurrencyValue(price);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const productData: Product = {
      id: editingId || Date.now().toString(),
      name: name.toUpperCase().trim(),
      price: priceNum,
      category: category.toUpperCase().trim(),
      sellType,
      isFavorite: editingId ? products.find(p => p.id === editingId)?.isFavorite : false
    };

    if (editingId) onUpdate(productData);
    else onAdd(productData);
    closeModal();
  };

  const handleRenameCategoryBatch = () => {
    if (!catToRename || !newCatName) return;
    const catUpper = catToRename.toUpperCase().trim();
    const newUpper = newCatName.toUpperCase().trim();
    
    products.forEach(p => {
      if ((p.category || 'GERAL').toUpperCase().trim() === catUpper) {
        onUpdate({ ...p, category: newUpper });
      }
    });
    
    setIsRenamingCategory(false);
    setCatToRename('');
    setNewCatName('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory('GERAL');
    setSellType('unit');
  };

  const startEdit = (p: Product) => {
    if (!canEdit) return;
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toFixed(2).replace('.', ','));
    setCategory(p.category);
    setSellType(p.sellType);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 relative">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
             <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Gestão de Cardápio</h2>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{products.length} Itens Cadastrados</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             {canEdit && (
               <button onClick={() => setIsRenamingCategory(true)} className="flex-1 sm:flex-none bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Categorias</button>
             )}
             {canEdit && (
               <button onClick={() => { resetForm(); setShowModal(true); }} className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg transition-all active:scale-95 uppercase text-[10px] tracking-widest">Novo Item</button>
             )}
          </div>
        </div>

        <div className="relative">
           <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           <input 
             type="text" 
             placeholder="FILTRAR POR NOME DO PRODUTO..." 
             value={searchProduct}
             onChange={e => setSearchProduct(e.target.value)}
             className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none outline-none font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-red-500 transition-all"
           />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 -mx-4 px-4 sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <button 
          onClick={() => setSelectedCategoryIndex('TODOS')}
          className={`shrink-0 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all border ${selectedCategoryIndex === 'TODOS' ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-400'}`}
        >
          Todos
        </button>
        {categoriesList.map(cat => (
          <button 
            key={cat}
            onClick={() => setSelectedCategoryIndex(cat)}
            className={`shrink-0 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all border ${selectedCategoryIndex === cat ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-red-400'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-10 pb-20">
        {sortedCategories.map(cat => (
          <div key={cat} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex items-center gap-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] pl-2">{cat}</h3>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800/50"></div>
                <span className="text-[9px] font-black text-slate-300 uppercase">{groupedProducts[cat].length} ITENS</span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {groupedProducts[cat].sort((a,b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1)).map(p => (
                 <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-5 border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-red-500 transition-all flex flex-col justify-between h-44 relative overflow-hidden">
                    {p.isFavorite && <div className="absolute -top-6 -right-6 w-12 h-12 bg-amber-400/10 rotate-45 pointer-events-none"></div>}
                    
                    <div className="flex justify-between items-start z-10">
                       <div className="pr-4">
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight mb-1">{p.name}</h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{p.sellType === 'unit' ? 'Unidade' : 'Peso (Kg)'}</span>
                       </div>
                       <button onClick={() => onUpdate({ ...p, isFavorite: !p.isFavorite })} className={`transition-all ${p.isFavorite ? 'text-amber-400 scale-125' : 'text-slate-200 dark:text-slate-800 hover:text-amber-200'}`}>
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                       </button>
                    </div>

                    <div className="flex items-center justify-between mt-4 z-10">
                       <p className="text-2xl font-black text-red-600 dark:text-red-400">{formatCurrency(p.price)}<span className="text-[10px] ml-1 opacity-50">{p.sellType === 'weight' ? '/kg' : ''}</span></p>
                       <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(p)} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          <button onClick={() => setDeleteConfirmId({id: p.id, name: p.name})} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        ))}
      </div>

      {isRenamingCategory && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setIsRenamingCategory(false)} />
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl relative z-20 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tighter">Renomear em Lote</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Categoria Atual</label>
                    <select value={catToRename} onChange={e => setCatToRename(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold uppercase text-xs outline-none">
                       <option value="">Selecione...</option>
                       {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Novo Nome</label>
                    <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="EX: BEBIDAS GELADAS" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold uppercase text-xs outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>
                 <button onClick={handleRenameCategoryBatch} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Alterar Todos os Itens</button>
                 <button onClick={() => setIsRenamingCategory(false)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest">Fechar</button>
              </div>
           </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative z-20 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </div>
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase text-center mb-2 tracking-tighter leading-none">Confirmar Exclusão?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-8">
               O item <span className="text-red-600 font-black uppercase">"{deleteConfirmId.name}"</span> será removido permanentemente.
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={() => { onDelete(deleteConfirmId.id); setDeleteConfirmId(null); }} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Sim, Excluir</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">
                  {editingId ? 'Editar Produto' : 'Novo Produto'}
                </h3>
              </div>
              <button onClick={closeModal} className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all active:scale-90">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Comercial</label>
                  <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cerveja IPA 600ml" className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-transparent focus:border-red-500 outline-none transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                  <input type="text" list="cat-suggestions" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: BEBIDAS" className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-transparent focus:border-red-500 outline-none transition-all uppercase text-xs font-black" />
                  <datalist id="cat-suggestions">
                     {categoriesList.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Modelo de Venda</label>
                  <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button onClick={() => setSellType('unit')} className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase transition-all ${sellType === 'unit' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Unidade</button>
                    <button onClick={() => setSellType('weight')} className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase transition-all ${sellType === 'weight' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Peso (Kg)</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Preço de Venda</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">R$</span>
                    <input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(sanitizeCurrencyInput(e.target.value))} placeholder="0,00" className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-transparent focus:border-red-500 outline-none font-black text-2xl shadow-inner" />
                  </div>
                </div>
              </div>
              <div className="pt-6 flex flex-col md:flex-row gap-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={handleSave} className="flex-[2] bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95">Salvar</button>
                <button onClick={closeModal} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
