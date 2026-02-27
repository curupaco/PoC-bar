import React from 'react';
import { Product, ModifierGroup, ModifierOption, formatCurrency } from '../../../../types';

interface UpsellModalProps {
  data: { 
    product: Product; 
    group: ModifierGroup; 
    quantity: number; 
  } | null;
  onConfirm: (option?: ModifierOption) => void;
  onClose: () => void;
}

const UpsellModal: React.FC<UpsellModalProps> = ({ data, onConfirm, onClose }) => {
  if (!data) return null;

  const { product, group } = data;

  return (
    <div className="fixed inset-0 z-[550] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
       <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
          <div className="text-center mb-6">
             <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                {group.name}
             </h4>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Complemento para {product.name}
             </p>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 p-2 no-scrollbar mb-6">
             {group.options.map((opt, idx) => (
                <button 
                   key={idx}
                   onClick={() => onConfirm(opt)}
                   className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex justify-between items-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 border border-transparent transition-all group"
                >
                   <span className="font-black uppercase text-sm text-slate-700 dark:text-slate-300 group-hover:text-red-600">
                      {opt.name}
                   </span>
                   <span className="font-bold text-xs text-slate-500 group-hover:text-red-500">
                      {opt.price > 0 ? `+ ${formatCurrency(opt.price)}` : 'GRÁTIS'}
                   </span>
                </button>
             ))}
          </div>

          <div className="flex flex-col gap-3">
             <button 
                onClick={() => onConfirm(undefined)}
                className="w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
             >
                Pular / Sem Adicional
             </button>
             <button 
                onClick={onClose}
                className="w-full py-3 text-[10px] font-bold uppercase text-slate-400 hover:text-red-500 transition-colors"
             >
                Cancelar Operação
             </button>
          </div>
       </div>
    </div>
  );
};

export default UpsellModal;