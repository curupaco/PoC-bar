
import React, { useState, useMemo } from 'react';
import { Category, Product, generateUniqueId } from '../../types';

interface CategoriesTabProps {
  categories: Category[];
  setCategories: (updater: (prev: Category[]) => Category[]) => void;
  products: Product[];
  setProducts: (updater: (prev: Product[]) => Product[]) => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ categories, setCategories, products, setProducts }) => {
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Detecta categorias que estão nos produtos mas não na lista oficial
  const orphanCategories = useMemo(() => {
    const registeredNames = new Set(categories.map(c => c.name.toUpperCase().trim()));
    const productNames = Array.from(new Set(products.map(p => p.category.toUpperCase().trim()).filter(Boolean)));
    
    return productNames.filter(name => !registeredNames.has(name)).sort();
  }, [categories, products]);

  const importOrphans = () => {
    const newCats = orphanCategories.map(name => ({
      id: generateUniqueId('cat'),
      name
    }));
    setCategories(prev => [...prev, ...newCats]);
  };

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    const finalName = newCatName.toUpperCase().trim();
    if (categories.some(c => c.name.toUpperCase() === finalName)) {
      alert("Categoria já existe!");
      return;
    }
    const newCat: Category = {
      id: generateUniqueId('cat'),
      name: finalName
    };
    setCategories(prev => [...prev, newCat]);
    setNewCatName('');
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = (id: string, oldName: string) => {
    const finalName = editName.toUpperCase().trim();
    if (!finalName) return;
    
    if (categories.some(c => c.id !== id && c.name === finalName)) {
      alert("Já existe uma categoria com este nome.");
      return;
    }

    // Update Category
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: finalName } : c));

    // Update Products (Cascading Update) - Renomeia a categoria nos produtos existentes
    setProducts(prev => prev.map(p => p.category === oldName ? { ...p, category: finalName } : p));

    cancelEdit();
  };

  const handleDelete = (id: string, name: string) => {
    const usageCount = products.filter(p => p.category === name).length;
    if (usageCount > 0) {
      alert(`ERRO: Não é possível excluir a categoria "${name}".\n\nExistem ${usageCount} produtos vinculados a ela.\nEdite ou remova os produtos antes de excluir a categoria.`);
      return;
    }

    if (confirm(`Remover permanentemente a categoria "${name}"?`)) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24">
      {/* ALERTA DE IMPORTAÇÃO */}
      {orphanCategories.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-[32px] border border-amber-200 dark:border-amber-900/30 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-4 text-amber-600">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center shrink-0">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                 <h4 className="font-black uppercase text-sm">Categorias Detectadas</h4>
                 <p className="text-[10px] font-bold opacity-80 uppercase leading-relaxed">Encontramos {orphanCategories.length} categorias nos seus produtos que ainda não estão cadastradas oficialmente.</p>
              </div>
           </div>
           <button onClick={importOrphans} className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">
              Importar Todas ({orphanCategories.length})
           </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Gestão de Categorias</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Padronize a organização do cardápio</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
           <input 
             type="text" 
             value={newCatName}
             onChange={e => setNewCatName(e.target.value)}
             placeholder="NOVA CATEGORIA..."
             className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-sm border-2 border-transparent focus:border-red-500 outline-none w-full shadow-inner"
             onKeyDown={e => e.key === 'Enter' && handleAdd()}
           />
           <button onClick={handleAdd} className="bg-red-600 text-white px-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 shadow-lg active:scale-95 transition-all">Adicionar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center group hover:border-red-500/20 transition-all shadow-sm">
             {editingId === cat.id ? (
                <div className="flex items-center gap-2 w-full">
                   <input 
                      autoFocus
                      type="text" 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 font-black uppercase text-sm border border-red-500 outline-none"
                      onKeyDown={e => {
                         if (e.key === 'Enter') saveEdit(cat.id, cat.name);
                         if (e.key === 'Escape') cancelEdit();
                      }}
                   />
                   <button onClick={() => saveEdit(cat.id, cat.name)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   </button>
                   <button onClick={cancelEdit} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
             ) : (
                <>
                   <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-red-500 transition-colors"></div>
                      <span className="font-black text-slate-800 dark:text-white uppercase truncate flex-1 text-sm">{cat.name}</span>
                   </div>
                   <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(cat)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(cat.id, cat.name)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                   </div>
                </>
             )}
          </div>
        ))}
        {categories.length === 0 && orphanCategories.length === 0 && (
           <div className="col-span-full py-16 text-center text-slate-400 font-bold uppercase text-[10px] opacity-50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
             Nenhuma categoria cadastrada.
           </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesTab;
