
import React, { useState, useMemo, useRef } from 'react';
import { Sale, Product, PaymentMethod, formatCurrency, SaleItem, User, Shift } from '../types';
import * as htmlToImage from 'html-to-image';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  users: User[];
  shifts: Shift[];
  onQuitarPendura: (customerName: string, amount: number) => void;
}

type ReportCategory = 'FECHAMENTO' | 'FINANCEIRO' | 'PENDURAS' | 'EQUIPE' | 'OPERACIONAL' | 'PRODUTOS';

const Reports: React.FC<ReportsProps> = ({ sales = [], products = [], users = [], shifts = [], onQuitarPendura }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('FECHAMENTO');
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [periodLabel, setPeriodLabel] = useState('DIA');

  const [selectedShiftId, setSelectedShiftId] = useState<string>(shifts[0]?.id || '');

  const filteredSales = useMemo<Sale[]>(() => {
    const start = new Date(startDate + 'T00:00:00').getTime();
    const end = new Date(endDate + 'T23:59:59').getTime();
    const baseSales: Sale[] = sales || [];
    return baseSales.filter((s: Sale) => s.timestamp >= start && s.timestamp <= end);
  }, [sales, startDate, endDate]);

  const reportData = useMemo(() => {
    const totalsByMethod = Object.values(PaymentMethod).reduce((acc, method) => {
      acc[method] = { count: 0, total: 0 };
      return acc;
    }, {} as Record<string, { count: number, total: number }>);

    filteredSales.forEach((sale: Sale) => {
      if (totalsByMethod[sale.paymentMethod]) {
        totalsByMethod[sale.paymentMethod].count += 1;
        totalsByMethod[sale.paymentMethod].total += (sale.total || 0);
      }
    });

    const grandTotal = filteredSales.reduce((acc: number, s: Sale) => acc + (s.total ?? 0), 0);
    const avgTicket = filteredSales.length > 0 ? grandTotal / filteredSales.length : 0;

    const salesByUser = filteredSales.reduce((acc: Record<string, number>, s: Sale) => {
      const user = users.find(u => u.id === s.userId)?.displayName || 'Desconhecido';
      acc[user] = (acc[user] || 0) + (s.total || 0);
      return acc;
    }, {} as Record<string, number>);

    const userChartData = Object.entries(salesByUser)
      .map(([name, total]): { name: string; total: number } => ({ name, total: Number(total) }))
      .sort((a: { total: number }, b: { total: number }) => b.total - a.total);

    const productMap = products.reduce((acc, p) => { acc[p.id] = p.category; return acc; }, {} as Record<string, string>);
    const categoryAgg = filteredSales.flatMap(s => s.items || []).reduce((acc: Record<string, number>, item: SaleItem) => {
      const cat = productMap[item.productId] || 'Geral';
      acc[cat] = (acc[cat] || 0) + (item.totalPrice || 0);
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryAgg)
      .map(([name, total]): { name: string; total: number } => ({ name, total: Number(total) }))
      .sort((a: { total: number }, b: { total: number }) => b.total - a.total);

    // Lógica corrigida de Penduras
    const penduraDebts = (sales || []).reduce((acc: Record<string, number>, s: Sale) => {
      if (!s.customerName) return acc;
      const name = s.customerName.trim().toUpperCase();
      
      // Se a venda foi feita como Pendura, soma ao débito
      if (s.paymentMethod === PaymentMethod.PENDURA) {
        acc[name] = (acc[name] || 0) + s.total;
      }
      
      // Se houver um item 'quitacao' na venda (de qualquer método), subtrai do débito
      const isQuitacao = s.items?.some(item => item.productId === 'quitacao');
      if (isQuitacao) {
        acc[name] = (acc[name] || 0) - s.total;
      }
      
      return acc;
    }, {} as Record<string, number>);

    const activePenduras = (Object.entries(penduraDebts) as [string, number][])
      .filter(([_, amount]) => amount > 0.01)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount);

    const selectedShift = shifts.find(sh => sh.id === selectedShiftId);
    const shiftSales = (sales || []).filter(s => s.shiftId === selectedShiftId);
    const shiftTotalsByMethod = Object.values(PaymentMethod).reduce((acc, method) => {
      acc[method] = shiftSales.filter(s => s.paymentMethod === method).reduce((sum, s) => sum + s.total, 0);
      return acc;
    }, {} as Record<string, number>);

    return { 
      totalsByMethod, 
      grandTotal, 
      avgTicket,
      userChartData,
      categoryData,
      activePenduras,
      selectedShift,
      shiftSales,
      shiftTotalsByMethod
    };
  }, [filteredSales, sales, users, products, shifts, selectedShiftId]);

  const exportAsImage = () => {
    if (reportRef.current === null) return;
    
    // Configurações para evitar cortes na exportação
    htmlToImage.toPng(reportRef.current, { 
        backgroundColor: '#ffffff',
        style: {
            transform: 'scale(1)',
            padding: '20px'
        },
        pixelRatio: 2
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `fechamento-botequista-${new Date().getTime()}.png`;
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
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
               <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Selecionar Turno para Análise</label>
                  <select 
                    value={selectedShiftId} 
                    onChange={e => setSelectedShiftId(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold uppercase text-xs outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  >
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>
                        {new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - @{s.openedBy} ({s.status === 'open' ? 'EM CURSO' : 'FECHADO'})
                      </option>
                    ))}
                  </select>
               </div>
               <button onClick={exportAsImage} className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Salvar Comprovante
               </button>
            </div>

            {reportData.selectedShift ? (
              <div className="flex justify-center py-10">
                <div ref={reportRef} className="bg-white text-slate-900 w-full max-w-[400px] p-10 serrated-top serrated-bottom shadow-2xl space-y-6 font-mono border-x border-slate-100">
                   <div className="text-center space-y-1">
                      <h2 className="text-3xl font-black font-barrio leading-none uppercase tracking-tighter">Botequista</h2>
                      <p className="text-[10px] font-bold">CNPJ: 00.000.000/0001-00</p>
                      <div className="text-[10px] font-bold pt-4 border-t border-dashed border-slate-300">
                         RESUMO DE FECHAMENTO DE TURNO
                      </div>
                   </div>

                   <div className="text-[11px] leading-tight space-y-1">
                      <p>TURNO: {reportData.selectedShift.id.slice(-6).toUpperCase()}</p>
                      <p>OPERADOR: @{reportData.selectedShift.openedBy.toUpperCase()}</p>
                      <p>ABERTURA: {new Date(reportData.selectedShift.startTime).toLocaleString('pt-BR')}</p>
                      {reportData.selectedShift.endTime && <p>FECHAMENTO: {new Date(reportData.selectedShift.endTime).toLocaleString('pt-BR')}</p>}
                   </div>

                   <div className="border-t border-dashed border-slate-300 pt-4 space-y-2">
                      <div className="text-xs font-black uppercase text-center mb-2">VENDAS POR MÉTODO</div>
                      {(Object.entries(reportData.shiftTotalsByMethod) as [string, number][]).map(([method, total]) => (
                         <div key={method} className="flex justify-between text-[11px]">
                            <span>{method.padEnd(15, '.')}</span>
                            <span className="font-bold">{formatCurrency(total)}</span>
                         </div>
                      ))}
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black">
                         <span>TOTAL TURNO:</span>
                         <span>{formatCurrency(reportData.shiftSales.reduce((acc, s) => acc + s.total, 0))}</span>
                      </div>
                   </div>

                   <div className="border-t border-dashed border-slate-300 pt-4 space-y-2">
                      <div className="text-xs font-black uppercase text-center mb-2">CONFERÊNCIA DE GAVETA</div>
                      <div className="flex justify-between text-[11px]">
                         <span>FUNDO INICIAL</span>
                         <span>{formatCurrency(reportData.selectedShift.cashChange)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                         <span>VENDAS DINHEIRO</span>
                         <span>{formatCurrency(reportData.shiftTotalsByMethod[PaymentMethod.CASH] || 0)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-emerald-700">
                         <span>ESPERADO GAVETA:</span>
                         <span>{formatCurrency(reportData.selectedShift.cashChange + (reportData.shiftTotalsByMethod[PaymentMethod.CASH] || 0))}</span>
                      </div>
                   </div>

                   <div className="border-t border-dashed border-slate-300 pt-4 space-y-1">
                      <div className="text-xs font-black uppercase text-center mb-2">TOP PRODUTOS</div>
                      {Object.entries(
                          reportData.shiftSales.flatMap(s => s.items).reduce((acc: any, item) => {
                             acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
                             return acc;
                          }, {})
                       ).sort((a:any, b:any) => b[1] - a[1]).slice(0, 5).map(([name, qty]: any) => (
                          <div key={name} className="flex justify-between text-[10px]">
                             <span className="truncate max-w-[180px]">{name.toUpperCase()}</span>
                             <span className="font-bold">{qty}x</span>
                          </div>
                       ))}
                   </div>

                   <div className="text-center pt-8 border-t border-dashed border-slate-300 text-[9px] font-bold">
                      OBRIGADO PELA PREFERÊNCIA!<br/>
                      BOTEQUISTA - GESTÃO INTELIGENTE
                   </div>
                </div>
              </div>
            ) : (
              <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px]">
                 Nenhum turno selecionado para conferência.
              </div>
            )}
          </div>
        );
      case 'FINANCEIRO':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Faturamento por Método</h3>
                <div className="space-y-4">
                   {(Object.entries(reportData.totalsByMethod) as [string, { count: number; total: number }][]).map(([method, data]) => (data.total > 0 && (
                     <div key={method} className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <span className="text-sm font-bold uppercase text-slate-600 dark:text-slate-400">{method}</span>
                        <span className="font-black text-slate-900 dark:text-white">{formatCurrency(data.total)}</span>
                     </div>
                   )))}
                   <div className="pt-4 flex justify-between items-center text-xl font-black">
                      <span className="uppercase text-[10px] tracking-widest">Total Líquido</span>
                      <span className="text-red-600">{formatCurrency(reportData.grandTotal)}</span>
                   </div>
                </div>
             </div>
             
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ticket Médio</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(reportData.avgTicket)}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase">Baseado em {filteredSales.length} comandas</p>
             </div>
          </div>
        );
      case 'PENDURAS':
        return (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-orange-50/50 dark:bg-orange-900/10 flex justify-between items-center">
                <div>
                   <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest">Relatório de Penduras Ativas</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Saldo acumulado de todos os períodos</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase">Total a Receber</p>
                   <p className="text-xl font-black text-orange-600">
                      {formatCurrency(reportData.activePenduras.reduce((acc, p) => acc + p.amount, 0))}
                   </p>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                   <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-widest text-[10px]">
                         <th className="px-8 py-5">Cliente</th>
                         <th className="px-8 py-5 text-right">Saldo Devedor</th>
                         <th className="px-8 py-5 text-right">Ação</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {reportData.activePenduras.map((pendura, idx) => (
                         <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-8 py-5 font-black text-slate-800 dark:text-white uppercase">{pendura.name}</td>
                            <td className="px-8 py-5 text-right font-black text-red-500">{formatCurrency(pendura.amount)}</td>
                            <td className="px-8 py-5 text-right">
                               <button 
                                  onClick={() => onQuitarPendura(pendura.name, pendura.amount)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                               >
                                  Quitar
                               </button>
                            </td>
                         </tr>
                      ))}
                      {reportData.activePenduras.length === 0 && (
                         <tr>
                            <td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold italic uppercase">Nenhum fiado registrado.</td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        );
      case 'EQUIPE':
        return (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Performance de Vendas por Colaborador</h3>
             <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={reportData.userChartData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 11}} />
                      <Bar dataKey="total" radius={[0, 10, 10, 0]} barSize={24}>
                         {reportData.userChartData.map((_, index) => (
                           <Cell key={index} fill={index === 0 ? '#ef4444' : '#475569'} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        );
      case 'OPERACIONAL':
        return (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Eficiência por Turno</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4">Turno/Data</th>
                      <th className="px-6 py-4">Operador</th>
                      <th className="px-6 py-4 text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {shifts.slice(-10).reverse().map(s => {
                      const sTotal = (sales || []).filter(sa => sa.shiftId === s.id).reduce((acc, sa) => acc + sa.total, 0);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-4 font-bold">{new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td className="px-6 py-4 uppercase font-black text-slate-400">@{s.openedBy}</td>
                          <td className="px-6 py-4 text-right font-black text-emerald-600">{formatCurrency(sTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        );
      case 'PRODUTOS':
        return (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Faturamento por Categoria de Produto</h3>
             <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={reportData.categoryData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 11}} />
                      <Bar dataKey="total" fill="#ef4444" radius={[0, 10, 10, 0]} barSize={24} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
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
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              {cat}
            </button>
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

      <div className="min-h-[500px]">
        {renderActiveReport()}
      </div>

      {activeCategory === 'FINANCEIRO' && (
        <div className="flex justify-center">
          <button onClick={() => setPreset('HOJE')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Zerar filtros e ver hoje</button>
        </div>
      )}
    </div>
  );
};

export default Reports;
