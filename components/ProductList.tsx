
import React, { useState, useEffect } from 'react';
import { Product, SellType, formatCurrency, User } from '../types';

interface ProductListProps {
  products: Product[];
  onAdd: (product: Product) => void;
  onDelete: (id: string) => void;
  onUpdate: (product: Product) => void;
  currentUser: User;
}

const ProductList: React.FC<ProductListProps> = ({ products, onAdd, onDelete, onUpdate, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Geral');
  const [sellType, setSellType] = useState<SellType>('unit');

  const canEdit = currentUser.username === 'admin' || currentUser.permissions.includes('edit_product');
  const canDelete = currentUser.username === 'admin' || currentUser.permissions.includes('delete_product');

  // Bloquear o scroll do body quando o modal estiver aberto
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const categories = Array.from(new Set([
    'Geral', 'Bebidas', 'Cervejas', 'Porções', 'Refeições', 'Doses', 'Cacheta', 
    ...products.map(p => p.category === 'CACHETA' ? 'Cacheta' : p.category)
  ])).filter(cat => cat !== 'CACHETA');

  const handleSave = () => {
    if (!name || !price) return;
    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) return;

    if (editingId && !canEdit) {
        alert("Você não tem permissão para editar produtos.");
        return;
    }

    const productData: Product = {
      id: editingId || Date.now().toString(),
      name,
      price: priceNum,
      category: category === 'CACHETA' ? 'Cacheta' : category,
      sellType
    };

    if (editingId) {
      onUpdate(productData);
    } else {
      onAdd(productData);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory('Geral');
    setSellType('unit');
  };

  const startEdit = (p: Product) => {
    if (!canEdit) {
        alert("Você não tem permissão para editar produtos.");
        return;
    }
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toString());
    setCategory(p.category === 'CACHETA' ? 'Cacheta' : p.category);
    setSellType(p.sellType);
    setShowModal(true);
  };

  const handleDelete = (id: string, productName: string) => {
    if (!canDelete) {
        alert("Você não tem permissão para excluir produtos.");
        return;
    }
    if (window.confirm(`Tem certeza que deseja remover "${productName}" do cardápio?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Gerenciar Cardápio</h2>
          {canEdit && (
            <button 
              onClick={() => { resetForm(); setShowModal(true); }} 
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Novo Produto
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5">Item</th>
                <th className="px-6 py-5">Categoria</th>
                <th className="px-6 py-5">Tipo</th>
                <th className="px-6 py-5">Preço</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-5 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{p.name}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    {p.sellType === 'unit' ? 'Unidade' : 'Peso (Kg)'}
                  </td>
                  <td className="px-6 py-5 font-black text-red-600 dark:text-red-400 text-base">
                    {formatCurrency(p.price)}
                    <span className="text-[10px] opacity-60 ml-1 font-bold">{p.sellType === 'weight' ? '/kg' : ''}</span>
                  </td>
                  <td className="px-6 py-5 text-right space-x-4">
                    <button onClick={() => startEdit(p)} disabled={!canEdit} className="text-blue-500 dark:text-blue-400 font-black uppercase text-[10px] hover:underline disabled:opacity-20 transition-opacity">Editar</button>
                    <button onClick={() => handleDelete(p.id, p.name)} disabled={!canDelete} className="text-red-500 dark:text-red-400 font-black uppercase text-[10px] hover:underline disabled:opacity-20 transition-opacity">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE PRODUTO (CENTRALIZADO NO VIEWPORT) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Overlay Escuro com Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={closeModal}
          />
          
          {/* Container do Modal */}
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            {/* Header do Modal */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">
                  {editingId ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mt-2">Gestão de Cardápio</p>
              </div>
              <button 
                onClick={closeModal}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome do Produto */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Comercial</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Ex: Cerveja IPA 600ml"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-transparent focus:border-red-500 outline-none transition-all font-bold" 
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                  <div className="relative">
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)} 
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-transparent focus:border-red-500 outline-none transition-all uppercase text-xs font-black appearance-none cursor-pointer"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                {/* Modelo de Venda */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Modelo de Venda</label>
                  <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={() => setSellType('unit')} 
                      className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase transition-all ${sellType === 'unit' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Unidade
                    </button>
                    <button 
                      onClick={() => setSellType('weight')} 
                      className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase transition-all ${sellType === 'weight' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Peso (Kg)
                    </button>
                  </div>
                </div>

                {/* Preço */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                    Preço de Venda {sellType === 'weight' ? '(p/ Kg)' : ''}
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">R$</span>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      placeholder="0.00"
                      className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-transparent focus:border-red-500 outline-none font-black text-2xl" 
                    />
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="pt-6 flex flex-col md:flex-row gap-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={handleSave} 
                  className="flex-[2] bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95"
                >
                  {editingId ? 'Confirmar Alterações' : 'Cadastrar no Cardápio'}
                </button>
                <button 
                  onClick={closeModal} 
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
