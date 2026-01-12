
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sale, Product, PaymentMethod, formatCurrency, User, Shift } from '../types';
import * as htmlToImage from 'html-to-image';

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
  const [toast, setToast] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [periodLabel, setPeriodLabel] = useState('HOJE');

  const [selectedShiftId, setSelectedShiftId] = useState<string>(shifts[0]?.id || '');

  const canExport = currentUser.username === 'admin' || currentUser.permissions.includes('export_report');
  const canSettle = currentUser.username === 'admin' || currentUser.permissions.includes('clear_fiado');

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const setPreset = (type: 'HOJE' | 'ONTEM' | 'SEMANA' | 'MÊS') => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (type === 'ONTEM') { 
      start.setDate(now.getDate() - 1); 
      end.setDate(now.getDate() - 1); 
    }
    else if (type === 'SEMANA') { 
      start.setDate(now.getDate() - now.getDay()); 
    }
    else if (type === 'MÊS') { 
      start = new Date(now.getFullYear(), now.getMonth(), 1); 
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setPeriodLabel(type);
    showToast(`PERÍODO ALTERADO PARA: ${type}`);
  };

  const filteredSales = useMemo<Sale[]>(() => {
    const startTs = new Date(`${startDate}T00:00:00`).getTime();
    const endTs = new Date(`${endDate}T23:59:59`).getTime();
    return (sales || []).filter((s: Sale) => s.timestamp >= startTs && s.timestamp <= endTs);
  }, [sales, startDate, endDate]);

  const reportData = useMemo(() => {
    const selectedShift = shifts.find(sh => sh.id === selectedShiftId);
    const shiftSales = (sales || []).filter((s: Sale) => s.shiftId === selectedShiftId);

    const shiftTotalsByMethod = Object.values(PaymentMethod).reduce((acc: Record<string, number>, method) => {
      acc[method] = shiftSales.filter((s: Sale) => s.paymentMethod === method).reduce((sum: number, s: Sale) => sum + s.total, 0);
      return acc;
    }, {} as Record<string, number>);

    // Estatísticas de Categoria para o Turno
    const shiftCategoryStats = shiftSales.flatMap(s => s.items || []).reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      const catName = product ? product.category.toUpperCase() : 'OUTROS';
      acc[catName] = (acc[catName] || 0) + item.totalPrice;
      return acc;
    }, {} as Record<string, number>);

    const shiftTotalRevenue = shiftSales.reduce((acc, s) => acc + s.total, 0);

    const totalsByMethod = Object.values(PaymentMethod).reduce((acc: Record<string, { count: number, total: number }>, method) => {
      acc[method] = { count: 0, total: 0 };
      return acc;
    }, {} as Record<string, { count: number, total: number }>);

    filteredSales.forEach((sale: Sale) => {
      if (totalsByMethod[sale.paymentMethod]) {
        totalsByMethod[sale.paymentMethod].count += 1;
        totalsByMethod[sale.paymentMethod].total += sale.total;
      }
    });

    const grandTotal = filteredSales.reduce((acc: number, s: Sale) => acc + s.total, 0);
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

    const activePenduras = (Object.entries(penduraDebts) as [string, number][])
      .filter(([_, amount]) => amount > 0.01)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const teamStats = users.map(u => {
      const uSales = filteredSales.filter((s: Sale) => s.userId === u.id);
      return {
        name: u.displayName,
        count: uSales.length,
        total: uSales.reduce((acc: number, s: Sale) => acc + s.total, 0)
      };
    }).sort((a, b) => b.total - a.total);

    const productStats = filteredSales.flatMap((s: Sale) => s.items || []).reduce((acc: Record<string, { name: string, qty: number, total: number }>, item) => {
      if (!acc[item.productName]) acc[item.productName] = { name: item.productName, qty: 0, total: 0 };
      acc[item.productName].qty += item.quantity;
      acc[item.productName].total += item.totalPrice;
      return acc;
    }, {} as Record<string, { name: string, qty: number, total: number }>);

    const topProducts = (Object.values(productStats) as { name: string, qty: number, total: number }[]).sort((a, b) => b.total - a.total);

    const hourlyStats = Array.from({ length: 24 }).map((_, i) => ({ hour: i, total: 0, count: 0 }));
    filteredSales.forEach((s: Sale) => {
      const h = new Date(s.timestamp).getHours();
      hourlyStats[h].total += s.total;
      hourlyStats[h].count += 1;
    });

    return { 
      totalsByMethod, grandTotal, avgTicket, activePenduras, selectedShift, shiftSales, shiftTotalsByMethod,
      teamStats, topProducts, hourlyStats, shiftCategoryStats, shiftTotalRevenue
    };
  }, [filteredSales, sales, shifts, selectedShiftId, users, products]);

  const exportAsImage = () => {
    if (!canExport || !reportRef.current) return;
    showToast("GERANDO CUPOM...");
    htmlToImage.toPng(reportRef.current, { backgroundColor: '#000000', pixelRatio: 2 })
    .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `fechamento-${periodLabel}-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
        showToast("CUPOM SALVO COM SUCESSO!");
    });
  };

  const renderActiveReport = () => {
    if (filteredSales.length === 0 && activeCategory !== 'PENDURAS' && activeCategory !== 'FECHAMENTO') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] animate-in fade-in">
          Nenhum dado para o período: {startDate} até {endDate}
        </div>
      );
    }

    switch(activeCategory) {
      case 'FECHAMENTO':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
               <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2">Selecionar Turno para Detalhar</label>
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
                   
                   {/* RESUMO FINANCEIRO */}
                   <div className="border-t border-dashed border-slate-800 pt-4 space-y-2">
                      <div className="text-xs font-black uppercase text-center mb-2">RESUMO FINANCEIRO</div>
                      { (Object.entries(reportData.shiftTotalsByMethod) as [string, number][]).map(([method, total]) => (
                         <div key={method} className="flex justify-between text-[11px]">
                            <span className="text-slate-500 uppercase">{method}</span>
                            <span className="font-bold">{formatCurrency(total)}</span>
                         </div>
                      ))}
                      <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-emerald-400">
                         <span>TOTAL LÍQUIDO:</span>
                         <span>{formatCurrency(reportData.shiftTotalRevenue)}</span>
                      </div>
                   </div>

                   {/* CONSUMO POR CATEGORIA (BARRA VISUAL) */}
                   <div className="border-t border-dashed border-slate-800 pt-4 space-y-4">
                      <div className="text-xs font-black uppercase text-center mb-1">MIX DE VENDAS (CATEGORIAS)</div>
                      <div className="space-y-3">
                         {/* Fix: Explicitly cast Object.entries to [string, number][] to avoid 'unknown' type errors during arithmetic operations and formatting */}
                         {(Object.entries(reportData.shiftCategoryStats) as [string, number][])
                            .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
                            .map(([cat, val]: [string, number]) => {
                               const percentage = reportData.shiftTotalRevenue > 0 ? (val / reportData.shiftTotalRevenue) * 100 : 0;
                               return (
                                  <div key={cat} className="space-y-1">
                                     <div className="flex justify-between text-[9px] font-black uppercase">
                                        <span className="text-slate-300">{cat}</span>
                                        <span>{formatCurrency(val)} ({percentage.toFixed(0)}%)</span>
                                     </div>
                                     <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <div 
                                           className="h-full bg-red-600 rounded-full" 
                                           style={{ width: `${percentage}%` }}
                                        />
                                     </div>
                                  </div>
                               );
                            })
                         }
                         {Object.keys(reportData.shiftCategoryStats).length === 0 && (
                            <p className="text-[10px] text-center text-slate-600 italic">Nenhum consumo registrado no turno</p>
                         )}
                      </div>
                   </div>

                   {reportData.selectedShift.status === 'closed' && (
                     <div className="border-t border-dashed border-slate-800 pt-4 space-y-2">
                        <div className="text-xs font-black uppercase text-center mb-2">CONFERÊNCIA DE GAVETA</div>
                        <div className="flex justify-between text-[11px]">
                           <span className="text-slate-500 uppercase">ESPERADO:</span>
                           <span className="font-bold">{formatCurrency(reportData.selectedShift.finalCashChange || 0)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                           <span className="text-slate-500 uppercase">CONTADO:</span>
                           <span className="font-bold">{formatCurrency(reportData.selectedShift.actualCashCounted || 0)}</span>
                        </div>
                        <div className={`flex justify-between text-sm font-black pt-2 border-t border-slate-800 ${ (reportData.selectedShift.cashDifference || 0) < -0.01 ? 'text-red-500' : 'text-emerald-400'}`}>
                           <span>QUEBRA/DIF:</span>
                           <span>{formatCurrency(reportData.selectedShift.cashDifference || 0)}</span>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            ) : <div className="text-center py-20 opacity-30 italic text-sm">Selecione um turno acima</div>}
          </div>
        );
      case 'FINANCEIRO':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Faturamento Acumulado</h3>
                <div className="space-y-4">
                   {(Object.entries(reportData.totalsByMethod) as [string, { count: number, total: number }][]).map(([method, data]) => (
                     data.total > 0 ? (
                       <div key={method} className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                          <span className="text-sm font-bold uppercase text-slate-500">{method}</span>
                          <span className="font-black text-slate-900 dark:text-white">{formatCurrency(data.total)}</span>
                       </div>
                     ) : null
                   ))}
                   <div className="pt-4 flex justify-between items-center text-2xl font-black text-red-600">
                      <span className="text-[10px] text-slate-400">TOTAL NO PERÍODO</span>
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
                            <button onClick={() => { onQuitarPendura(p.name, p.amount); showToast(`QUITANDO PENDURA DE ${p.name}`); }} disabled={!canSettle} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase disabled:opacity-50">Quitar</button>
                         </td>
                      </tr>
                   ))}
                   {reportData.activePenduras.length === 0 && (
                     <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold uppercase">Nenhuma pendura ativa</td></tr>
                   )}
                </tbody>
             </table>
          </div>
        );
      case 'EQUIPE':
        return (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Performance da Equipe</h3>
             </div>
             <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                    <th className="px-8 py-5">Colaborador</th>
                    <th className="px-8 py-5 text-center">Atendimentos</th>
                    <th className="px-8 py-5 text-right">Faturamento Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {reportData.teamStats.map((u, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5 font-black text-slate-800 dark:text-white uppercase">@{u.name}</td>
                      <td className="px-8 py-5 text-center font-bold text-slate-500">{u.count}</td>
                      <td className="px-8 py-5 text-right font-black text-blue-600">{formatCurrency(u.total)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        );
      case 'PRODUTOS':
        return (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ranking de Produtos</h3>
             </div>
             <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                    <th className="px-8 py-5">Produto</th>
                    <th className="px-8 py-5 text-center">Volume</th>
                    <th className="px-8 py-5 text-right">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {reportData.topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5 font-black text-slate-800 dark:text-white uppercase">{p.name}</td>
                      <td className="px-8 py-5 text-center"><span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">{p.qty.toFixed(0)}</span></td>
                      <td className="px-8 py-5 text-right font-black text-emerald-600">{formatCurrency(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        );
      case 'OPERACIONAL':
        const peakHour = reportData.hourlyStats.reduce((prev, current) => (prev.count > current.count) ? prev : current);
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 h-64">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Fluxo por Horário (Quantidade)</h3>
               <div className="flex items-end justify-between h-32 gap-1">
                 {reportData.hourlyStats.map((h, i) => (
                   <div key={i} className="flex-1 bg-red-500/20 hover:bg-red-500 transition-all rounded-t-sm" title={`${h.hour}:00h - ${h.count} vendas`} style={{ height: `${(h.count / (peakHour.count || 1)) * 100}%` }}></div>
                 ))}
               </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Horário de Pico</p>
              <p className="text-4xl font-black text-red-600 tracking-tighter">{peakHour.hour}:00h</p>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24 relative">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4">
           {toast}
        </div>
      )}

      {/* FILTRO DE PERÍODO SUPERIOR */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Período do Relatório</p>
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {(['HOJE', 'ONTEM', 'SEMANA', 'MÊS'] as const).map(type => (
            <button 
              key={type} 
              onClick={() => setPreset(type)} 
              className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${periodLabel === type ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              {type}
            </button>
          ))}
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase italic">
          {startDate} até {endDate}
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
        <div className="flex flex-wrap justify-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          {(['FECHAMENTO', 'FINANCEIRO', 'PENDURAS', 'EQUIPE', 'OPERACIONAL', 'PRODUTOS'] as ReportCategory[]).map(cat => (
            <button key={cat} onClick={() => { setActiveCategory(cat); showToast(`VISUALIZANDO: ${cat}`); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>{cat}</button>
          ))}
        </div>
      </div>
      
      <div className="min-h-[500px] animate-in fade-in duration-500">{renderActiveReport()}</div>
    </div>
  );
};

export default Reports;
