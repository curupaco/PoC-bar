
import React, { useState, useMemo } from 'react';
import { formatCurrency, sanitizeCurrencyInput, parseCurrencyValue } from '../../../types';

interface PenduraReportProps {
  reportData: any;
  onQuitarPendura: (name: string, amount: number) => void;
  canSettle: boolean;
}

const PenduraReport: React.FC<PenduraReportProps> = ({ reportData, onQuitarPendura, canSettle }) => {
  const [quitarData, setQuitarData] = useState<{ name: string; total: number; amount: string } | null>(null);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());

  const handleCobrarWhatsApp = (name: string, amount: number) => {
    const formattedAmount = amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const message = `Olá, ${name}! Tudo bem? Passando para te lembrar da sua comanda pendente no Botequista de R$ ${formattedAmount}. Quando puder, dá uma passadinha aqui ou solicita a chave Pix para acertarmos. Grande abraço!`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleQuitar = () => {
    if (!quitarData) return;
    const numericAmount = parseCurrencyValue(quitarData.amount);
    if (numericAmount <= 0) {
      alert("Informe um valor válido para quitação.");
      return;
    }
    if (numericAmount > quitarData.total + 0.05) {
       alert("O valor pago não pode ser maior que a dívida.");
       return;
    }
    onQuitarPendura(quitarData.name, numericAmount);
    setQuitarData(null);
  };

  const toggleSelect = (name: string) => {
    const next = new Set(selectedNames);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedNames(next);
  };

  const bulkTotal = useMemo(() => {
    return Array.from(selectedNames).reduce((acc, name) => {
      const debtor = reportData.activePenduras.find((p: any) => p.name === name);
      return acc + (debtor?.amount || 0);
    }, 0);
  }, [selectedNames, reportData.activePenduras]);

  const handleBulkQuitar = () => {
    if (selectedNames.size === 0) return;
    const names = Array.from(selectedNames).join(', ');
    onQuitarPendura(`LOTE: ${names.substring(0, 30)}${names.length > 30 ? '...' : ''}`, bulkTotal);
    setSelectedNames(new Set());
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-500">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-orange-50/30 dark:bg-orange-900/10 flex flex-col md:flex-row justify-between items-center gap-4">
           <div>
              <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest italic leading-none">Carteira Global de Devedores (Ativos)</h3>
              {selectedNames.size > 0 && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                  {selectedNames.size} SELECIONADOS • TOTAL: <span className="text-red-500">{formatCurrency(bulkTotal)}</span>
                </p>
              )}
           </div>
           
           {selectedNames.size > 0 && (
              <button 
                onClick={handleBulkQuitar}
                className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl animate-in slide-in-from-right-2"
              >
                Quitar Selecionados
              </button>
           )}
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left text-xs">
              <thead>
                 <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black tracking-widest text-[10px]">
                    <th className="px-10 py-6 text-left w-10">Select</th>
                    <th className="px-10 py-6 text-left">Nome do Cliente</th>
                    <th className="px-10 py-6 text-right">Saldo Devedor</th>
                    <th className="px-10 py-6 text-right">Gestão</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                 {reportData.activePenduras.map((p: any, idx: number) => {
                    const isSelected = selectedNames.has(p.name);
                    return (
                       <tr key={idx} className={`transition-colors cursor-pointer ${isSelected ? 'bg-orange-50/50 dark:bg-orange-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`} onClick={() => toggleSelect(p.name)}>
                          <td className="px-10 py-6">
                             <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-orange-600 border-orange-600' : 'border-slate-200'}`}>
                                {isSelected && <span className="text-white text-[10px]">✓</span>}
                             </div>
                          </td>
                          <td className="px-10 py-6 font-black text-slate-800 dark:text-white uppercase">{p.name}</td>
                          <td className="px-10 py-6 text-right font-black text-red-600">{formatCurrency(p.amount)}</td>
                          <td className="px-10 py-6 text-right" onClick={e => e.stopPropagation()}>
                             <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleCobrarWhatsApp(p.name, p.amount)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                                  title="Cobrar via WhatsApp"
                                >
                                   <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                     <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.428 1.977 13.962.95 11.998.95c-5.44 0-9.866 4.372-9.87 9.802 0 1.814.498 3.585 1.442 5.161l-.992 3.624 3.722-.972zm11.236-6.618c-.3-.15-1.776-.875-2.05-1.012-.275-.138-.475-.207-.675.1-.2.3-.775 1.012-.95 1.212-.175.2-.35.225-.65.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.487-1.777-1.663-2.074-.177-.3-.018-.465.13-.615.136-.135.3-.349.45-.524.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.524-.075-.15-.675-1.625-.925-2.225-.244-.589-.491-.51-.675-.51-.174-.001-.374-.001-.573-.001-.2 0-.525.075-.8.375-.275.3-1.05 1.024-1.05 2.5 0 1.475 1.075 2.9 1.225 3.1.15.2 2.11 3.22 5.116 4.516.715.309 1.273.493 1.708.632.72.228 1.375.195 1.892.117.577-.087 1.774-.725 2.025-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z" />
                                   </svg>
                                   Cobrar
                                </button>
                                <button 
                                  onClick={() => setQuitarData({ name: p.name, total: p.amount, amount: p.amount.toFixed(2).replace('.', ',') })} 
                                  disabled={!canSettle} 
                                  className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all shadow-md shadow-red-600/20"
                                >
                                  Quitar
                                </button>
                             </div>
                          </td>
                       </tr>
                    );
                 })}
                 {reportData.activePenduras.length === 0 && (
                   <tr><td colSpan={4} className="px-10 py-24 text-center text-slate-400 font-bold uppercase opacity-30 italic">Nenhum devedor no radar.</td></tr>
                 )}
              </tbody>
           </table>
        </div>

        {quitarData && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setQuitarData(null)} />
             <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
                <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-4 italic">Quitar Pendura</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{quitarData.name} deve {formatCurrency(quitarData.total)}</p>
                
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl mb-8 border border-slate-100 dark:border-slate-800">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Quanto ele está pagando hoje?</label>
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">R$</span>
                      <input 
                         autoFocus
                         type="text" 
                         inputMode="decimal"
                         value={quitarData.amount} 
                         onChange={e => setQuitarData({ ...quitarData, amount: sanitizeCurrencyInput(e.target.value) })}
                         className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 font-black text-2xl outline-none shadow-inner text-red-600" 
                         placeholder="0,00" 
                      />
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                   <button onClick={handleQuitar} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Confirmar Recebimento</button>
                   <button onClick={() => setQuitarData(null)} className="w-full py-4 text-slate-400 font-black uppercase text-xs tracking-widest">Cancelar</button>
                </div>
             </div>
          </div>
        )}
    </div>
  );
};

export default PenduraReport;
