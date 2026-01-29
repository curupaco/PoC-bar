import React, { useRef, useMemo } from 'react';
import * as htmlToImage from 'html-to-image';
import { Shift, formatCurrency, Sale, SaleItem } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ClosingReportProps {
  shifts: Shift[];
  selectedShiftId: string;
  setSelectedShiftId: (id: string) => void;
  reportData: any; 
  canExport: boolean;
  showToast: (msg: string) => void;
  theme?: string;
}

const ClosingReport: React.FC<ClosingReportProps> = ({
  shifts,
  selectedShiftId,
  setSelectedShiftId,
  reportData,
  canExport,
  showToast,
  theme
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const exportAsImage = () => {
    if (!canExport || !reportRef.current) return;
    showToast("GERANDO RELATÓRIO...");
    
    // Configuração robusta para evitar erros de CORS com CSS externo
    htmlToImage.toPng(reportRef.current, { 
      backgroundColor: isDark ? '#020617' : '#f8fafc',
      pixelRatio: 2,
      style: { borderRadius: '0px' },
      cacheBust: true,
      // Filtro para garantir que elementos de script do Tailwind não causem problemas no clone
      filter: (node) => {
        const tagName = (node as HTMLElement).tagName ? (node as HTMLElement).tagName.toUpperCase() : '';
        return tagName !== 'SCRIPT';
      }
    })
    .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `fechamento-turno-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
        showToast("RELATÓRIO SALVO!");
    })
    .catch((err) => {
        console.error("Export Error:", err);
        showToast("ERRO AO GERAR PNG.");
    });
  };

  const shift = useMemo(() => shifts.find(s => s.id === selectedShiftId), [shifts, selectedShiftId]);

  // Cálculo de Categorias apenas para este Turno
  const categoryData = useMemo(() => {
    if (!shift || !reportData.activeDataSource) return [];
    
    const shiftSales = (reportData.activeDataSource as Sale[]).filter(s => s.shiftId === selectedShiftId && !s.deleted);
    const categoryMap: Record<string, number> = {};

    shiftSales.forEach(sale => {
      // FIX: Adicionada verificação de existência para items
      const items = sale.items || [];
      items.forEach(item => {
        if (item.productId === 'quitacao') return; // Ignora quitações do gráfico de categorias
        const cat = item.category?.toUpperCase() || 'GERAL';
        categoryMap[cat] = (categoryMap[cat] || 0) + item.totalPrice;
      });
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [shift, selectedShiftId, reportData.activeDataSource]);

  if (!shift) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
           <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Selecionar Turno para Análise</label>
           <select value={selectedShiftId} onChange={e => setSelectedShiftId(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black uppercase text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all">
             <option value="">Escolha um turno na lista...</option>
             {shifts.map(s => <option key={s.id} value={s.id}>{new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - Responsável: @{s.openedBy}</option>)}
           </select>
        </div>
        <div className="bg-white dark:bg-slate-900 p-20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center opacity-30 italic font-black uppercase text-[10px]">Aguardando seleção de turno...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 shadow-sm">
         <div className="flex-1 w-full">
            <select value={selectedShiftId} onChange={e => setSelectedShiftId(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black uppercase text-xs outline-none">
              {shifts.map(s => <option key={s.id} value={s.id}>{new Date(s.startTime).toLocaleDateString()} - @{s.openedBy}</option>)}
            </select>
         </div>
         <button onClick={exportAsImage} disabled={!canExport} className="w-full md:w-auto bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-500/20 active:scale-95">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={3} /></svg>
           Salvar Relatório PNG
         </button>
      </div>

      <div ref={reportRef} className="space-y-6 p-2">
        {/* HEADER DO RELATÓRIO */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-center md:text-left">
              <h2 className="text-4xl font-normal font-barrio text-slate-900 dark:text-white leading-none">Botequista</h2>
              <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mt-2 italic">Relatório de Encerramento de Turno</p>
           </div>
           <div className="grid grid-cols-2 gap-8 text-center md:text-right">
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Início</p>
                 <p className="font-black text-slate-800 dark:text-white text-sm">{new Date(shift.startTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fim</p>
                 <p className="font-black text-slate-800 dark:text-white text-sm">{shift.endTime ? new Date(shift.endTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'EM ABERTO'}</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* COLUNA 1: FINANÇAS POR PAGAMENTO */}
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-4">Entradas por Pagamento</h3>
              <div className="space-y-4">
                 {Object.entries(reportData.shiftTotalsByMethod).map(([method, total]: any) => (
                    total > 0 && (
                      <div key={method} className="flex justify-between items-center">
                         <span className="text-xs font-bold text-slate-500 uppercase">{method}</span>
                         <span className="font-black text-slate-800 dark:text-white">{formatCurrency(total)}</span>
                      </div>
                    )
                 ))}
                 <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-black text-red-600 uppercase">Faturamento Bruto</span>
                    <span className="text-2xl font-black text-red-600 italic">{formatCurrency(reportData.shiftTotalRevenue)}</span>
                 </div>
              </div>
           </div>

           {/* COLUNA 2: GRÁFICO DE CATEGORIAS */}
           <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center italic">Performance por Categoria (R$)</h3>
              <div className="h-[240px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 30 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: '900' }} />
                       <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} formatter={(val: number) => formatCurrency(val)} contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: '900' }} />
                       <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                          {categoryData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : (isDark ? '#334155' : '#e2e8f0')} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* AUDITORIA DE CAIXAS (ABERTURA E FECHAMENTO) */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center italic">Auditoria de Saldos dos Compartimentos</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CAIXA PRIMÁRIO */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800">
                 <p className="text-[9px] font-black text-slate-400 uppercase text-center mb-4">Caixa Primário (Cofre)</p>
                 <div className="flex justify-between items-center px-2">
                    <div className="text-center">
                       <span className="text-[8px] font-bold text-slate-400 uppercase block">Abertura</span>
                       <span className="text-sm font-black text-slate-600 dark:text-slate-400">{formatCurrency(shift.openingCashPrimary || 0)}</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={3}/></svg>
                    <div className="text-center">
                       <span className="text-[8px] font-bold text-emerald-500 uppercase block">Fechamento</span>
                       <span className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(shift.finalCashPrimary || 0)}</span>
                    </div>
                 </div>
              </div>

              {/* GAVETA / TROCO */}
              <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
                 <p className="text-[9px] font-black text-blue-500 uppercase text-center mb-4">Gaveta (Dinheiro Vivo)</p>
                 <div className="flex justify-between items-center px-2">
                    <div className="text-center">
                       <span className="text-[8px] font-bold text-slate-400 uppercase block">Abertura</span>
                       <span className="text-sm font-black text-slate-600 dark:text-slate-400">{formatCurrency(shift.openingCashChange || 0)}</span>
                    </div>
                    <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={3}/></svg>
                    <div className="text-center">
                       <span className="text-[8px] font-bold text-blue-600 uppercase block">Contado</span>
                       <span className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(shift.actualCashCounted || 0)}</span>
                    </div>
                 </div>
                 {shift.cashDifference !== undefined && shift.cashDifference !== 0 && (
                    <div className={`mt-4 text-center py-1.5 rounded-full text-[9px] font-black uppercase ${shift.cashDifference > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                       {shift.cashDifference > 0 ? `Sobra: ${formatCurrency(shift.cashDifference)}` : `Falta: ${formatCurrency(Math.abs(shift.cashDifference))}`}
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* AUDITORIA DE TRANSAÇÕES DE CAIXA (SANGRIAS/SUPRIMENTOS) */}
        {shift.transactions && shift.transactions.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">Movimentações de Tesouraria</h3>
             <div className="space-y-2">
                {shift.transactions.map((t: any) => (
                   <div key={t.id} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black text-slate-400 uppercase">@{t.user} • {new Date(t.timestamp).toLocaleTimeString()}</span>
                         <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                            {t.from === 'Change' ? 'SANGRIA (GAVETA ➔ COFRE)' : (t.to === 'Change' ? 'SUPRIMENTO (COFRE ➔ GAVETA)' : 'TRANSFERÊNCIA INTERNA')}
                         </span>
                      </div>
                      <span className={`font-black text-sm ${t.from === 'Change' ? 'text-red-500' : 'text-emerald-500'}`}>
                         {t.from === 'Change' ? '-' : '+'} {formatCurrency(t.amount)}
                      </span>
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClosingReport;