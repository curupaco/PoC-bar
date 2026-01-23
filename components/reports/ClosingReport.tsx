
import React, { useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { Shift, formatCurrency } from '../../types';

interface ClosingReportProps {
  shifts: Shift[];
  selectedShiftId: string;
  setSelectedShiftId: (id: string) => void;
  reportData: any; // Mantendo any por brevidade no refactor, mas idealmente seria tipado com o retorno do useMemo do pai
  canExport: boolean;
  showToast: (msg: string) => void;
}

const ClosingReport: React.FC<ClosingReportProps> = ({
  shifts,
  selectedShiftId,
  setSelectedShiftId,
  reportData,
  canExport,
  showToast
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const exportAsImage = () => {
    if (!canExport || !reportRef.current) return;
    showToast("PROCESSANDO CUPOM...");
    htmlToImage.toPng(reportRef.current, { backgroundColor: '#000000', pixelRatio: 2 })
    .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `fechamento-${selectedShiftId.slice(-6)}.png`;
        link.href = dataUrl;
        link.click();
        showToast("PDF/PNG SALVO!");
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
         <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Turno p/ Protocolo</label>
            <select value={selectedShiftId} onChange={e => setSelectedShiftId(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black uppercase text-xs outline-none">
              <option value="">Escolha um turno...</option>
              {shifts.map(s => <option key={s.id} value={s.id}>{new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - @{s.openedBy}</option>)}
            </select>
         </div>
         <button onClick={exportAsImage} disabled={!canExport || !selectedShiftId} className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2.5} /></svg>
           Salvar Cupom (PNG)
         </button>
      </div>

      {reportData.selectedShift ? (
        <div className="flex justify-center py-10 bg-slate-100 dark:bg-slate-950/50 rounded-[40px]">
          <div ref={reportRef} className="bg-black text-white w-full max-w-[380px] p-12 shadow-2xl space-y-6 font-mono text-[11px] leading-relaxed">
             <div className="text-center border-b border-dashed border-slate-800 pb-6">
                {/* FONTE ALTERADA PARA BARRIO (LOGO) */}
                <h2 className="text-4xl font-normal font-barrio tracking-tighter text-white">Botequista</h2>
                <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Protocolo de Turno</p>
             </div>
             <div className="space-y-1 text-slate-400">
                <p>PROTOCOLO: {reportData.selectedShift.id.slice(-8).toUpperCase()}</p>
                <p>OPERADOR: @{reportData.selectedShift.openedBy.toUpperCase()}</p>
                <p>ABERTURA: {new Date(reportData.selectedShift.startTime).toLocaleString('pt-BR')}</p>
                {reportData.selectedShift.endTime && <p>FECHAMENTO: {new Date(reportData.selectedShift.endTime).toLocaleString('pt-BR')}</p>}
             </div>
             <div className="border-t border-dashed border-slate-800 pt-4 space-y-2">
                <div className="text-[10px] font-black uppercase text-center mb-2">CONCILIAÇÃO FINANCEIRA</div>
                { (Object.entries(reportData.shiftTotalsByMethod) as [string, number][]).map(([method, total]) => (
                   <div key={method} className="flex justify-between">
                      <span className="text-slate-500 uppercase">{method}:</span>
                      <span className="font-bold">{formatCurrency(total)}</span>
                   </div>
                ))}
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-emerald-400">
                   <span>TOTAL DO TURNO:</span>
                   <span>{formatCurrency(reportData.shiftTotalRevenue)}</span>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center opacity-30 italic font-black uppercase text-[10px]">Aguardando seleção de turno...</div>
      )}
    </div>
  );
};

export default ClosingReport;
