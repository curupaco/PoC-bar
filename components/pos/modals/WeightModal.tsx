
import React, { useState, useEffect } from 'react';
import { Product } from '../../../types';

interface WeightModalProps {
  product: Product | null;
  initialWeight?: number; // Peso atual em KG (caso seja edição)
  onConfirm: (weightInKg: number) => void;
  onClose: () => void;
  showFeedback: (msg: string) => void;
}

const WeightModal: React.FC<WeightModalProps> = ({ 
  product, 
  initialWeight, 
  onConfirm, 
  onClose,
  showFeedback
}) => {
  const [inputGrams, setInputGrams] = useState('');

  // Sincroniza o input quando o modal abre ou muda o produto/peso inicial
  useEffect(() => {
    if (initialWeight) {
      // Converte KG de volta para gramas para exibição
      setInputGrams((initialWeight * 1000).toFixed(0));
    } else {
      setInputGrams('');
    }
  }, [product, initialWeight]);

  if (!product) return null;

  const handleConfirm = () => {
    const grams = parseFloat(inputGrams);
    if (!inputGrams || isNaN(grams) || grams <= 0) {
      showFeedback("PESO INVÁLIDO!");
      return;
    }
    // Retorna o peso em KG
    onConfirm(grams / 1000);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl text-center border border-slate-200 dark:border-slate-800">
        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-6 tracking-tighter italic">
          Lançar Peso (Gramas)
        </h4>
        <input 
          autoFocus 
          type="number" 
          inputMode="numeric" 
          value={inputGrams} 
          onChange={e => setInputGrams(e.target.value)} 
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleConfirm();
            }
          }}
          className="w-full text-5xl font-black p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-4 border-red-500 outline-none shadow-inner" 
          placeholder="0" 
        />
        <p className="text-[10px] font-black text-slate-400 uppercase mt-6 tracking-widest">
          Ex: 500 = 0.5kg | 1000 = 1.0kg
        </p>
        <div className="grid grid-cols-2 gap-4 mt-10">
          <button 
            onClick={handleConfirm} 
            className="bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95"
          >
            Lançar
          </button>
          <button 
            onClick={onClose} 
            className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeightModal;
