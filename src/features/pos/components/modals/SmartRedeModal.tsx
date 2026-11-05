import React, { useState, useEffect } from 'react';
import { formatCurrency, PaymentMethod } from '../../../../types';

interface SmartRedeModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  method: PaymentMethod;
  onPaymentApproved: (paymentDetails: {
    nsu: string;
    authCode: string;
    brand: string;
    cardLast4: string;
  }) => void;
}

export const SmartRedeModal: React.FC<SmartRedeModalProps> = ({
  isOpen,
  onClose,
  amount,
  method,
  onPaymentApproved,
}) => {
  const [step, setStep] = useState<'WAITING' | 'READING' | 'APPROVED'>('WAITING');
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStep('WAITING');
      return;
    }

    // Animação dos pontinhos
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateTap = () => {
    setStep('READING');
    setTimeout(() => {
      setStep('APPROVED');
      setTimeout(() => {
        const randomNsu = Math.floor(100000000 + Math.random() * 900000000).toString();
        const randomAuth = Math.floor(100000 + Math.random() * 900000).toString();
        onPaymentApproved({
          nsu: randomNsu,
          authCode: randomAuth,
          brand: 'Mastercard',
          cardLast4: '4402',
        });
      }, 1200);
    }, 1500);
  };

  const isCredit = method === PaymentMethod.CREDITO;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center">
        {/* Topo / Header da Maquininha */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-400">
              SMART REDE • ITAÚ
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">TID: RO927776</span>
        </div>

        {/* Display da Maquininha */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-white/5 mb-6 shadow-inner">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
            {isCredit ? 'Cartão de Crédito' : 'Cartão de Débito'}
          </span>
          <div className="text-3xl font-black text-white tracking-tight mb-4">
            {formatCurrency(amount)}
          </div>

          {step === 'WAITING' && (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-3xl animate-bounce">
                📶
              </div>
              <p className="text-xs font-bold text-orange-300">
                Aproxime ou insira o cartão{dots}
              </p>
              <p className="text-[10px] text-slate-500">
                Aguardando leitura no leitor da maquininha
              </p>
            </div>
          )}

          {step === 'READING' && (
            <div className="space-y-3 py-2">
              <div className="w-12 h-12 mx-auto border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-white">
                Processando transação com a Rede...
              </p>
              <p className="text-[10px] text-slate-400">Conectando ao banco</p>
            </div>
          )}

          {step === 'APPROVED' && (
            <div className="space-y-2 py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl text-emerald-400">
                ✓
              </div>
              <p className="text-sm font-black text-emerald-400 uppercase tracking-wider">
                Transação Aprovada!
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Imprimindo comprovante...
              </p>
            </div>
          )}
        </div>

        {/* Botão de Simulação / Ação */}
        {step === 'WAITING' && (
          <div className="space-y-2.5">
            <button
              onClick={handleSimulateTap}
              className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-xs tracking-wider shadow-xl shadow-orange-600/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>💳</span>
              <span>Aproximar Cartão (Simular)</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-[11px] font-bold text-slate-400 hover:text-white uppercase transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

