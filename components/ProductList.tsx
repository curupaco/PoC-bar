
import React, { useState } from 'react';
import { Product } from '../types';

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

  const handleSave = () => {
    if (!name || !price) return;
    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) return;

    if (editingId) {
      onUpdate({ id: editingId, name, price: priceNum });
      setEditingId(null);
    } else {
      onAdd({ id: Date.now().toString(), name, price: priceNum });
      setIsAdding(false);
    }
    setName('');
    setPrice('');
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toString());
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Gerenciar Cardápio</h2>
          {!isAdding && !editingId && (
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-200 dark:shadow-none"
            >
              <span className="text-lg">+</span> Novo Produto
            </button>
          )}
        </div>

        {(isAdding || editingId) && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 animate-in slide-in-from-top-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4">
              {editingId ? 'Editar Produto' : 'Cadastrar Novo Item'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Nome do Produto</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="Ex: Cerveja Artesanal"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Preço de Venda (R$)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition-all"
                >
                  Salvar
                </button>
                <button 
                  onClick={() => { setIsAdding(false); setEditingId(null); setName(''); setPrice(''); }}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4 text-center">Preço</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{p.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-bold text-sm">
                      R$ {p.price.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button 
                      onClick={() => startEdit(p)}
                      className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => onDelete(p.id)}
                      className="text-rose-600 dark:text-rose-400 font-bold text-sm hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum produto cadastrado. Comece adicionando um item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
