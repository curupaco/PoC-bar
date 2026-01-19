
import React, { useState, useMemo } from 'react';
import { Product, SellType, formatCurrency, User, ModifierGroup, ModifierOption, sanitizeCurrencyInput, parseCurrencyValue } from '../types';

interface ProductListProps {
  products: Product[];
  modifierGroups: ModifierGroup[];
  setModifierGroups: (groups: ModifierGroup[]) => void;
  onAdd: (product: Product) => void;
  onDelete: (id: string) => void;
  onUpdate: (product: Product) => void;
  currentUser: User;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products = [], 
  modifierGroups = [], 
  setModifierGroups, 
  onAdd, 
  onDelete, 
  onUpdate, 
  currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'GROUPS'>('ITEMS');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // States Produto
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(''); 
  const [sellType, setSellType] = useState<SellType>('unit');
  const [modGroupId, setModGroupId] = useState<string>('');
  const [searchProduct, setSearchProduct] = useState('');

  // States Grupos de Modificadores/Serviços
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupCategory, setGroupCategory] = useState('GERAL');
  const [options, setOptions] = useState<ModifierOption[]>([{ name: '', price: 0 }]);

  const canEdit = currentUser.username === 'admin' || currentUser.permissions.includes('edit_product');

  const categoriesList = useMemo(() => {
    const cats = new Set(['BEBIDAS', 'CERVEJAS', 'PORÇÕES', 'REFEIÇÕES', 'DOSES', 'COMBOS']);
    products.forEach(p => { if (p.category) cats.add(p.category.toUpperCase().trim()); });
    return Array.from(cats).sort();
  }, [products]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach(p => {
      const cat = (p.category || 'SEM CATEGORIA').toUpperCase().trim();
      if (p.name.toLowerCase().includes(searchProduct.toLowerCase())) {
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(p);
      }
    });
    return groups;
  }, [products, searchProduct]);

  const handleSaveProduct = () => {
    if (!name.trim() || !category.trim()) return;
    const priceNum = parseCurrencyValue(price);
    const productData: Product = {
      id: editingId || Date.now().toString(),
      name: name.toUpperCase().trim(),
      price: priceNum,
      category: category.toUpperCase().trim(),
      sellType,
      modifierGroupId: modGroupId || undefined,
      isFavorite: editingId ? products.find(p => p.id === editingId)?.isFavorite : false
    };
    if (editingId) onUpdate(productData); else onAdd(productData);
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false); setEditingId(null);
    setName(''); setPrice(''); setCategory(''); setSellType('unit'); setModGroupId('');
  };

  const startEdit = (p: Product) => {
    if (!canEdit) return;
    setEditingId(p.id); setName(p.name); setPrice(p.price.toFixed(2).replace('.', ','));
    setCategory(p.category); setSellType(p.sellType); setModGroupId(p.modifierGroupId || '');
    setShowModal(true);
  };

  // Funções de Gestão de Modificadores
  const handleAddOption = () => setOptions([...options, { name: '', price: 0 }]);
  const handleRemoveOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const handleOptionChange = (index: number, field: keyof ModifierOption, value: any) => {
    const newOptions = [...options];
    if (field === 'price') {
      newOptions[index][field] = parseCurrencyValue(value);
    } else {
      newOptions[index][field] = value;
    }
    setOptions(newOptions);
  };

  const handleSaveGroup = () => {
    if (!groupName.trim()) return;
    const cleanOptions = options.filter(o => o.name.trim() !== '');
    const newGroup: ModifierGroup = {
      id: editingGroupId || `mod-${Date.now()}`,
      name: groupName.toUpperCase(),
      category: groupCategory.toUpperCase(),
      options: cleanOptions
    };
    if (editingGroupId) setModifierGroups(modifierGroups.map(g => g.id === editingGroupId ? newGroup : g));
    else setModifierGroups([...modifierGroups, newGroup]);
    setShowGroupModal(false);
    setGroupName(''); setGroupCategory('GERAL'); setOptions([{ name: '', price: 0 }]); setEditingGroupId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
         <button onClick={() => setActiveTab('ITEMS')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ITEMS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>Produtos</button>
         <button onClick={() => setActiveTab('GROUPS')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'GROUPS' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>Serviços e Adicionais</button>
      </div>

      {activeTab === 'ITEMS' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter italic">Itens à Venda</h2>
              {canEdit && <button onClick={() => setShowModal(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg uppercase text-[10px] tracking-widest">Novo Item</button>}
            </div>
            <input type="text" placeholder="BUSCAR NO CARDÁPIO..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-red-500 transition-all" />
          </div>

          <div className="space-y-8 pb-24">
            {Object.keys(groupedProducts).sort().map(cat => (
              <div key={cat} className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-4">{cat}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedProducts[cat].map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-red-500 transition-all group flex justify-between items-center">
                       <div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase">{p.name}</h4>
                          <p className="text-xl font-black text-red-600 mt-1">{formatCurrency(p.price)}</p>
                          {p.modifierGroupId && (
                             <span className="text-[8px] bg-blue-50 dark:bg-blue-900/20 text-blue-500 px-2 py-0.5 rounded font-black uppercase mt-2 inline-block">Possui Serviços</span>
                          )}
                       </div>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(p)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          <button onClick={() => onDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
              <div>
                 <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Serviços e Modificadores</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ex: Opções de Gelo, Ponto da Carne, Adicionais Pagos</p>
              </div>
              <button onClick={() => setShowGroupModal(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95">Criar Grupo</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modifierGroups.map(g => (
                 <div key={g.id} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm group">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{g.category}</p>
                          <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-tight">{g.name}</h4>
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditingGroupId(g.id); setGroupName(g.name); setGroupCategory(g.category); setOptions(g.options.length ? g.options : [{ name: '', price: 0 }]); setShowGroupModal(true); }} className="text-blue-500 p-1.5"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232" /></svg></button>
                          <button onClick={() => setModifierGroups(modifierGroups.filter(x => x.id !== g.id))} className="text-red-500 p-1.5"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862" /></svg></button>
                       </div>
                    </div>
                    <div className="space-y-3">
                       {g.options.map((opt, i) => (
                          <div key={i} className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase border-b border-slate-50 dark:border-slate-800 pb-2 last:border-0">
                             <span>{opt.name}</span>
                             <span className={opt.price > 0 ? 'text-emerald-500' : 'text-slate-300'}>{opt.price > 0 ? `+${formatCurrency(opt.price)}` : 'Grátis'}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              ))}
              {modifierGroups.length === 0 && (
                <div className="col-span-full py-24 text-center text-slate-400 font-black uppercase text-[10px] italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px]">Nenhum serviço cadastrado</div>
              )}
           </div>
        </div>
      )}

      {/* Modal Cadastro Item */}
      {showModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
              <div className="px-10 py-8 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center border-b dark:border-slate-800">
                 <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white italic">{editingId ? 'Editar Detalhes' : 'Novo Produto'}</h3>
                 <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="p-10 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nome Comercial</label>
                       <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold uppercase text-slate-800 dark:text-white border dark:border-slate-800" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Categoria</label>
                       <input list="cats" type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold uppercase text-xs border dark:border-slate-800" />
                       <datalist id="cats">{categoriesList.map(c => <option key={c} value={c} />)}</datalist>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Preço R$</label>
                       <input type="text" inputMode="decimal" value={price} onChange={e => setPrice(sanitizeCurrencyInput(e.target.value))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-black text-xl border dark:border-slate-800 text-red-600" />
                    </div>
                    <div className="col-span-2 space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest italic">Vincular Grupo de Serviços/Adicionais</label>
                       <select value={modGroupId} onChange={e => setModGroupId(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold uppercase text-xs border dark:border-slate-800 text-blue-500 outline-none">
                          <option value="">NENHUM SERVIÇO VINCULADO</option>
                          {modifierGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.category})</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="pt-6 flex gap-4">
                    <button onClick={handleSaveProduct} className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Salvar Item</button>
                    <button onClick={closeModal} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 py-5 rounded-2xl font-black uppercase text-xs tracking-widest">Cancelar</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal Grupo de Serviços / Modificadores */}
      {showGroupModal && (
         <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border dark:border-slate-800 animate-in zoom-in-95">
               <div className="px-10 py-8 border-b dark:border-slate-800 bg-blue-50 dark:bg-blue-900/10">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-blue-600">{editingGroupId ? 'Editar Serviços' : 'Novo Grupo de Serviços'}</h3>
               </div>
               <div className="p-10 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Título do Grupo</label>
                        <input autoFocus type="text" value={groupName} onChange={e => setGroupName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold border dark:border-slate-800" placeholder="EX: OPÇÕES DE BEBIDA" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Categoria do Serviço</label>
                        <input type="text" value={groupCategory} onChange={e => setGroupCategory(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-bold border dark:border-slate-800" placeholder="EX: BAR" />
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Opções de Serviço e Preços</label>
                        <button onClick={handleAddOption} className="text-blue-500 text-[10px] font-black uppercase hover:underline">+ Adicionar Linha</button>
                     </div>
                     <div className="max-h-60 overflow-y-auto space-y-3 no-scrollbar pr-2">
                        {options.map((opt, idx) => (
                           <div key={idx} className="flex gap-2 animate-in slide-in-from-right-2" style={{ animationDelay: `${idx * 50}ms` }}>
                              <input type="text" value={opt.name} onChange={e => handleOptionChange(idx, 'name', e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold uppercase text-xs border dark:border-slate-800" placeholder="Nome do Serviço (ex: Só Gelo)" />
                              <div className="relative w-32">
                                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                                 <input type="text" value={opt.price === 0 ? '' : opt.price.toFixed(2).replace('.', ',')} onChange={e => handleOptionChange(idx, 'price', e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 font-black text-xs border dark:border-slate-800 text-emerald-600" placeholder="0,00" />
                              </div>
                              <button onClick={() => handleRemoveOption(idx)} className="p-3 text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                     <button onClick={handleSaveGroup} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Salvar Grupo</button>
                     <button onClick={() => { setShowGroupModal(false); setEditingGroupId(null); }} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 py-5 rounded-2xl font-black uppercase text-xs tracking-widest">Cancelar</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ProductList;
