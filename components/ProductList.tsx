
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
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Geral');
  const [sellType, setSellType] = useState<SellType>('unit');

  const canEdit = currentUser.username === 'admin' || currentUser.permissions.includes('edit_product');
  const canDelete = currentUser.username === 'admin' || currentUser.permissions.includes('delete_product');

  // Removido 'CACHETA' (uppercase) e mantido 'Cacheta' como padrão sugerido
  const categories = Array.from(new Set(['Geral', 'Bebidas', 'Cervejas', 'Porções', 'Refeições', 'Doses', 'Cacheta', ...products.map(p => p.category)]))
    .filter(cat => cat !== 'CACHETA');

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
      category,
      sellType
    };

    if (editingId) {
      onUpdate(productData);
      setEditingId(null);
    } else {
      onAdd(productData);
      setIsAdding(false);
    }
    resetForm();
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
    setCategory(p.category);
    setSellType(p.sellType);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Gerenciar Cardápio</h2>
          {!isAdding && canEdit && (
            <button onClick={() => setIsAdding(true)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95">
              + Novo Produto
            </button>
          )}
        </div>

        {isAdding && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 animate-in slide-in-from-top-2">
            <h3 className="font-bold text-xs uppercase text-slate-400 dark:text-slate-500 mb-4">{editingId ? 'Editar Produto' : 'Novo Cadastro'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nome</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-red-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Categoria</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-red-500 outline-none transition-all uppercase text-xs font-bold"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Tipo de Venda</label>
                <div className="flex gap-2">
                  <button onClick={() => setSellType('unit')} className={`flex-1 py-3 rounded-xl font-bold text-[10px] border transition-all ${sellType === 'unit' ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>UNIDADE</button>
                  <button onClick={() => setSellType('weight')} className={`flex-1 py-3 rounded-xl font-bold text-[10px] border transition-all ${sellType === 'weight' ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>PESO (KG)</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Preço (R$ {sellType === 'weight' ? 'p/ Kg' : ''})</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-red-500 outline-none font-black text-lg" 
                />
              </div>
              <div className="lg:col-span-2 flex gap-3 pt-5">
                <button onClick={handleSave} className="flex-1 bg-red-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95">Salvar Produto</button>
                <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Cancelar</button>
              </div>
            </div>
          </div>
        )}

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
                  <td className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase">
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
    </div>
  );
};

export default ProductList;
