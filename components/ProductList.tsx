
import React, { useState } from 'react';
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

      {/* MODAL DE PRODUTO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={closeModal}
          />
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                  {editingId ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Preencha as informações do cardápio</p>
              </div>
              <button 
                onClick={closeModal}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nome do Item</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Ex: Cerveja IPA 600ml"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-red-500 outline-none transition-all font-medium" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Categoria</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-red-500 outline-none transition-all uppercase text-xs font-bold appearance-none cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Modelo de Negócio</label>
                  <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={() => setSellType('unit')} 
                      className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${sellType === 'unit' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Por Unidade
                    </button>
                    <button 
                      onClick={() => setSellType('weight')} 
                      className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${sellType === 'weight' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Por Peso (Kg)
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">
                    Preço de Venda {sellType === 'weight' ? '(p/ Kg)' : ''}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">R$</span>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-red-500 outline-none font-black text-xl" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col md:flex-row gap-3">
                <button 
                  onClick={handleSave} 
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95"
                >
                  {editingId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
                <button 
                  onClick={closeModal} 
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
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
