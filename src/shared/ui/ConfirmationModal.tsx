import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDanger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop com Blur */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200" 
        onClick={onCancel}
      />
      
      {/* Card do Modal */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 text-center">
        
        {/* Ícone de Alerta */}
        <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl shadow-inner ${isDanger ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
          {isDanger ? '⚠️' : '🤔'}
        </div>

        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-4 leading-none">
          {title}
        </h3>
        
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg active:scale-95 transition-all text-white ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' : 'bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'}`}
          >
            {confirmLabel}
          </button>
          
          <button 
            onClick={onCancel}
            className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;