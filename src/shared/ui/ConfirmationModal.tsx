import React from 'react';
import Modal from './Modal';
import Button from './Button';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="sm"
      className="text-center"
    >
      <div className="flex flex-col items-center pt-2">
        {/* Ícone de Alerta */}
        <div className={`w-16 h-16 mb-5 rounded-full flex items-center justify-center text-3xl shadow-inner ${isDanger ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
          {isDanger ? '⚠️' : '🤔'}
        </div>

        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-3 leading-none">
          {title}
        </h3>
        
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col gap-3 w-full">
          <Button 
            onClick={onConfirm}
            variant={isDanger ? 'danger' : 'dark'}
            size="lg"
            fullWidth
          >
            {confirmLabel}
          </Button>
          
          <Button 
            onClick={onCancel}
            variant="ghost"
            size="md"
            fullWidth
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;