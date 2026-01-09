
import React, { useState, useMemo, useRef } from 'react';
import { Sale, Product, PaymentMethod, formatCurrency, SaleItem, User, Shift } from '../types';
import * as htmlToImage from 'html-to-image';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  users: User[];
  shifts: Shift[];
  currentUser: User;
  onQuitarPendura: (customerName: string, amount: number) => void;
}

type ReportCategory = 'FECHAMENTO' | 'FINANCEIRO' | 'PENDURAS' | 'EQUIPE' | 'OPERACIONAL' | 'PRODUTOS';

const Reports: React.FC<ReportsProps> = ({ sales = [], products = [], users = [], shifts = [], currentUser, onQuitarPendura }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('FECHAMENTO');
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [periodLabel, setPeriodLabel] = useState('DIA');

  const [selectedShiftId, setSelectedShiftId] = useState<string>(shifts[0]?.id || '');

  const canExport = currentUser.username === 'admin' || currentUser.permissions.includes('export_report');
  const canSettle = currentUser.username === 'admin' || currentUser.permissions.includes('clear_fiado');

  const filteredSales = useMemo<Sale[]>(() => {
    const start = new Date(startDate + 'T00:00:00').getTime();
    const end = new Date(endDate + 'T23:59:59').getTime();
    return (sales || []).filter((s: Sale) => s.timestamp >= start && s.timestamp <= end);
  }, [sales, startDate, endDate]);

  const reportData = useMemo(() => {
    const selectedShift = shifts.find(sh => sh.id === selectedShiftId);
    const shiftSales = (sales || []).filter(s => s.shiftId === selectedShiftId);

    const shiftTotalsByMethod = Object.values(PaymentMethod).reduce((acc, method) => {
      acc[method] = shiftSales.filter(s => s.paymentMethod === method).reduce((sum, s) => sum + s.total, 0);
      return acc;
    }, {} as Record<string, number>);

    // Detalhamento do Dinheiro (Vendas vs Quitações)
    const cashSalesOnly = shiftSales
      .filter(s => s.paymentMethod === PaymentMethod.CASH && !s.items?.some(i => i.productId === 'quitacao'))
      .reduce((acc, s) => acc + s.total, 0);

    const cashSettlementsOnly = shiftSales
      .filter(s => s.paymentMethod === PaymentMethod.CASH && s.items?.some(i => i.productId === 'quitacao'))
      .reduce((acc, s) => acc + s.total, 0);

    const totalsByMethod = Object.values(PaymentMethod).reduce((acc, method) => {
      acc[method] = { count: 0, total: 0 };
      return acc;
    }, {} as Record<string, { count: number, total: number }>);

    filteredSales.forEach((sale: Sale) => {
      if (totalsByMethod[sale.paymentMethod]) {
        totalsByMethod[sale.paymentMethod].count += 1;
        totalsByMethod[sale.paymentMethod].total += sale.total;
      }
    });

    const grandTotal = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const avgTicket = filteredSales.length > 0 ? grandTotal / filteredSales.length : 0;

    const penduraDebts = (sales || []).reduce((acc: Record<string, number>, s: Sale) => {
      if (!s.customerName) return acc;
      const name = s.customerName.trim().toUpperCase();
      if (s.paymentMethod === PaymentMethod.PENDURA) {
        acc[name] = (acc[name] || 0) + s.total;
      }
      if (s.items?.some(item => item.productId === 'quitacao')) {
        acc[name] = (acc[name] || 0) - s.total;
      }
      return acc;
    }, {} as Record<string, number>);

    // Fix: Cast Object.entries to solve 'unknown' type inference on line 83 and line 85.
    const activePenduras = (Object.entries(penduraDebts) as [string, number][])
      .filter(([_, amount]) => amount > 0.01)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return { 
      totalsByMethod, grandTotal, avgTicket, activePenduras, selectedShift, shiftSales, shiftTotalsByMethod, cashSalesOnly, cashSettlementsOnly
    };
  }, [filteredSales, sales, users, products, shifts, selectedShiftId]);

  const exportAsImage = () => {
    if (!canExport) return;
    if (reportRef.current === null) return;
    htmlToImage.toPng(reportRef.current, { backgroundColor: '#000000', pixelRatio: 2 })
    .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `comprovante-botequista-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
    });
  };

  const setPreset = (type: 'HOJE' | 'ONTEM' | 'SEMANA' | 'MÊS') => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (type === 'ONTEM') { start.setDate(now.getDate() - 1); end.setDate(now.getDate() - 1); }
    else if (type === 'SEMANA') { start.setDate(now.getDate() - now.getDay()); }
    else if (type === 'MÊS') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setPeriodLabel(type);
  };

  const renderActiveReport = () => {
    switch(activeCategory) {
      case 'FECHAMENTO':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
               <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2">Selecionar Turno</label>
                  <select value={selectedShiftId} onChange={e => setSelectedShiftId(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold uppercase text-xs outline-none">
                    {shifts.map(s => <option key={s.id} value={s.id}>{new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - @{s.openedBy}</option>)}
                  </select>
               </div>
               <button onClick={exportAsImage} disabled={!canExport} className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50">Salvar Cupom (PNG)</button>
            </div>

            {reportData.selectedShift ? (
              <div className="flex justify-center py-10">
                <div ref={reportRef} className="bg-black text-white w-full max-w-[400px] p-10 serrated-top-black serrated-bottom-black shadow-2xl space-y-6 font-mono">
                   <div className="text-center">
                      <h2 className="text-3xl font-black font-barrio leading-none uppercase tracking-tighter">Botequista</h2>
                      <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Comprovante de Fechamento</p>
                   </div>

                   <div className="text-[11px] leading-tight space-y-1 text-slate-400 border-t border-dashed border-slate-800 pt-4">
                      <p>TURNO: {reportData.selectedShift.id.slice(-6).toUpperCase()}</p>
                      <p>OPERADOR: @{reportData.selectedShift.openedBy.toUpperCase()}</p>
                      <p>ABERTURA: {new Date(reportData.selectedShift.startTime).toLocaleString('pt-BR')}</p>
                      {reportData.selectedShift.endTime && <p>FECHAMENTO: {new Date(reportData.selectedShift.endTime).toLocaleString('pt-BR')}</p>}
                   </div>

                   <div className="border-t border-dashed border-slate-800 pt-4 space-y-2">
                      <div className="text-xs font-black uppercase text-center mb-2">RESUMO FINANCEIRO</div>
                      {/* Fix: Explicitly cast Object.entries to [string, number][] to solve 'unknown' type error for total on line 151. */}
                      { (Object.entries(reportData.shiftTotalsByMethod) as [string, number][]).map(([method, total]) => (
                         <div key={method} className="flex justify-between text-[11px]">
                            <span className="text-slate-500 uppercase">{method}</span>
                            <span className="font-bold">{formatCurrency(total)}</span>
                         </div>
                      ))}
                      <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-emerald-400">
                         <span>TOTAL LÍQUIDO:</span>
                         <span>{formatCurrency(reportData.shiftSales.reduce((acc, s) => acc + s.total, 0))}</span>
                      </div>
                   </div>

                   <div className="border-t border-dashed border-slate-800 pt-4 space-y-2">
                      <div className="text-xs font-black uppercase text-center mb-2">CONFERÊNCIA DE GAVETA</div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                         <span>FUNDO INICIAL</span>
                         <span className="text-white">{formatCurrency(reportData.selectedShift.cashChange)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                         <span>VENDAS PROD. (DINH)</span>
                         <span className="text-white">{formatCurrency(reportData.cashSalesOnly)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                         <span>QUITAÇÕES (DINH)</span>
                         <span className="text-white">{formatCurrency(reportData.cashSettlementsOnly)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-black text-white">
                         <span>ESPERADO GAVETA:</span>
                         <span>{formatCurrency(reportData.selectedShift.cashChange + reportData.cashSalesOnly + reportData.cashSettlementsOnly)}</span>
                      </div>
                   </div>

                   <div className="text-center pt-8 border-t border-dashed border-slate-800 text-[9px] font-bold text-slate-600">
                      SISTEMA BOTEQUISTA V2.5<br/>
                      GERE SEU LUCRO, NÓS GERAMOS OS DADOS
                   </div>
                </div>
              </div>
            ) : (
              <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px]">Nenhum turno para exibir.</div>
            )}
          </div>
        );
      case 'FINANCEIRO':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Faturamento Acumulado</h3>
                <div className="space-y-4">
                   {/* Fix: Explicitly cast Object.entries to [string, { count: number, total: number }][] to solve 'unknown' type error for data on line 197 and line 200. */}
                   {(Object.entries(reportData.totalsByMethod) as [string, { count: number, total: number }][]).map(([method, data]) => (data.total > 0 && (
                     <div key={method} className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <span className="text-sm font-bold uppercase text-slate-500">{method}</span>
                        <span className="font-black text-slate-900 dark:text-white">{formatCurrency(data.total)}</span>
                     </div>
                   )))}
                   <div className="pt-4 flex justify-between items-center text-2xl font-black text-red-600">
                      <span className="text-[10px] text-slate-400">TOTAL</span>
                      <span>{formatCurrency(reportData.grandTotal)}</span>
                   </div>
                </div>
             </div>
             
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 flex flex-col justify-center text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ticket Médio</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(reportData.avgTicket)}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase">Base: {filteredSales.length} comandas</p>
             </div>
          </div>
        );
      case 'PENDURAS':
        return (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-orange-50/30 dark:bg-orange-900/10 flex justify-between items-center">
                <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest">Controle de Fiados Ativos</h3>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase">Total Geral</p>
                   <p className="text-xl font-black text-orange-600">{formatCurrency(reportData.activePenduras.reduce((acc, p) => acc + p.amount, 0))}</p>
                </div>
             </div>
             <table className="w-full text-left text-xs">
                <thead>
                   <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                      <th className="px-8 py-5">Cliente</th>
                      <th className="px-8 py-5 text-right">Saldo</th>
                      <th className="px-8 py-5 text-right">Ação</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                   {reportData.activePenduras.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                         <td className="px-8 py-5 font-black text-slate-800 dark:text-white uppercase">{p.name}</td>
                         <td className="px-8 py-5 text-right font-black text-red-500">{formatCurrency(p.amount)}</td>
                         <td className="px-8 py-5 text-right">
                            <button onClick={() => onQuitarPendura(p.name, p.amount)} disabled={!canSettle} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase disabled:opacity-50">Quitar</button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap justify-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          {(['FECHAMENTO', 'FINANCEIRO', 'PENDURAS', 'EQUIPE', 'OPERACIONAL', 'PRODUTOS'] as ReportCategory[]).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{cat}</button>
          ))}
        </div>
        
        {activeCategory !== 'PENDURAS' && activeCategory !== 'FECHAMENTO' && (
           <div className="flex gap-2">
              {['HOJE', 'ONTEM', 'SEMANA', 'MÊS'].map(p => (
                <button key={p} onClick={() => setPreset(p as any)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${periodLabel === p ? 'bg-black text-white border-black' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}>{p}</button>
              ))}
           </div>
        )}
      </div>
      <div className="min-h-[500px]">{renderActiveReport()}</div>
    </div>
  );
};

export default Reports;
