
import React, { useState, useEffect } from 'react';
import { ModifierGroup, ModifierOption, generateUniqueId, parseCurrencyValue, sanitizeCurrencyInput, formatCurrency } from '../../../types';

interface ModifierGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: ModifierGroup) => void;
  initialData: ModifierGroup | null;
}

const ModifierGroupModal: React.FC<ModifierGroupModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(''); // Usado para "Destaque" ou categoria interna
  const [options, setOptions] = useState<{ id: string; name: string; price: string }[]>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setCategory(initialData.category || '');
        setShowCommentInput(initialData.showCommentInput || false);
        setOptions(
          initialData.options.map((opt) => ({
            id: generateUniqueId('opt'), // ID temporário para key do React
            name: opt.name,
            price: opt.price.toFixed(2).replace('.', ','),
          }))
        );
      } else {
        setName('');
        setCategory('');
        setShowCommentInput(false);
        setOptions([{ id: generateUniqueId('opt'), name: '', price: '0,00' }]);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    setOptions([...options, { id: generateUniqueId('opt'), name: '', price: '0,00' }]);
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const updateOption = (id: string, field: 'name' | 'price', value: string) => {
    setOptions(
      options.map((opt) => {
        if (opt.id === id) {
          if (field === 'price') return { ...opt, price: sanitizeCurrencyInput(value) };
          return { ...opt, [field]: value };
        }
        return opt;
      })
    );
  };

  const handleConfirm = () => {
    if (!name.trim()) {
      alert('Nome do grupo é obrigatório');
      return;
    }

    const finalOptions: ModifierOption[] = options
      .filter((opt) => opt.name.trim() !== '')
      .map((opt) => ({
        name: opt.name.toUpperCase().trim(),
        price: parseCurrencyValue(opt.price),
      }));

    const group: ModifierGroup = {
      id: initialData?.id || generateUniqueId('group'),
      name: name.toUpperCase().trim(),
      category: category.toUpperCase().trim() || undefined,
      options: finalOptions,
      showCommentInput,
    };

    onSave(group);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
            {initialData ? 'Editar Menu' : 'Novo Menu de Opções'}
          </h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-bold">✕</button>
        </div>

        {/* UX-02: Increased padding-bottom (pb-32) to prevent keyboard overlap on mobile */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 p-1 pb-32">
          {/* Cabeçalho do Grupo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Menu</label>
              <input 
                autoFocus
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="EX: BORDA RECHEADA"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black uppercase text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria (Opcional)</label>
              <input 
                type="text" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                placeholder="EX: PIZZAS"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black uppercase text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          {/* Configurações do Grupo */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-all hover:border-red-500/30">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Texto Livre nos Adicionais</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mt-1">Exibir campo de observações no PDV</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showCommentInput} 
                onChange={(e) => setShowCommentInput(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-red-600"></div>
            </label>
          </div>

          {/* Lista de Opções */}
          <div className="space-y-3">
            <div className="flex justify-between items-end pb-2 border-b border-slate-100 dark:border-slate-800">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opções do Menu</label>
              <button onClick={handleAddOption} className="text-[10px] font-bold text-blue-500 uppercase hover:underline">+ Adicionar Opção</button>
            </div>
            
            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div key={opt.id} className="flex gap-3 items-center animate-in slide-in-from-left-2">
                  <span className="text-slate-300 font-bold text-xs w-4">{idx + 1}.</span>
                  <input 
                    type="text"
                    value={opt.name}
                    onChange={(e) => updateOption(opt.id, 'name', e.target.value)}
                    placeholder="NOME DA OPÇÃO"
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold uppercase text-xs outline-none focus:border-red-500"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                    <input 
                      type="text"
                      value={opt.price}
                      onChange={(e) => updateOption(opt.id, 'price', e.target.value)}
                      className="w-full pl-8 pr-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs outline-none focus:border-red-500 text-right"
                    />
                  </div>
                  <button onClick={() => handleRemoveOption(opt.id)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-20">
          <button onClick={handleConfirm} className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">
            Salvar Menu
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModifierGroupModal;
