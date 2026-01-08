
import React, { useState } from 'react';
import { Product, SellType, formatCurrency } from '../types';

interface ProductListProps {
  products: Product[];
  onAdd: (product: Product) => void;
  onDelete: (id: string) => void;
  onUpdate: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onAdd, onDelete, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Geral');
  const [sellType, setSellType] = useState<SellType>('unit');

  const categories = Array.from(new Set(['Geral', 'Bebidas', 'Cervejas', 'Porções', 'Refeições', 'Doses', ...products.map(p => p.category)]));

  const handleSave = () => {
    if (!name || !price) return;
    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) return;

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
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toString());
    setCategory(p.category);
    setSellType(p.sellType);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Gerenciar Cardápio</h2>
          {!isAdding && (
            <button onClick={() => setIsAdding(true)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg">
              + Novo Produto
            </button>
          )}
        </div>

        {isAdding && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 animate-in slide-in-from-top-2">
            <h3 className="font-bold text-xs uppercase text-slate-400 mb-4">{editingId ? 'Editar Produto' : 'Novo Cadastro'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none" 
                  placeholder="Ex: Cerveja 600ml" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Venda</label>
                <div className="flex gap-2">
                  <button onClick={() => setSellType('unit')} className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-colors ${sellType === 'unit' ? 'bg-red-600 border-red-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>UNIDADE</button>
                  <button onClick={() => setSellType('weight')} className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-colors ${sellType === 'weight' ? 'bg-red-600 border-red-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>POR PESO (KG)</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Preço (R$ {sellType === 'weight' ? 'por Kg' : ''})</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none" 
                  placeholder="0,00" 
                />
              </div>
              <div className="lg:col-span-2 flex gap-3 pt-5">
                <button onClick={handleSave} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md">Salvar Produto</button>
                <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{p.name}</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase">{p.category}</span></td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{p.sellType === 'unit' ? '📦 Unidade' : '⚖️ Por Peso'}</td>
                  <td className="px-6 py-4 font-black text-red-600 dark:text-red-400">{formatCurrency(p.price)}{p.sellType === 'weight' ? '/kg' : ''}</td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => startEdit(p)} className="text-blue-500 font-bold hover:underline">Editar</button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="text-red-500 font-bold hover:underline">Excluir</button>
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
