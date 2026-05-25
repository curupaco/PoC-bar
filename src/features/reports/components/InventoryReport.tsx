import React, { useMemo, useState } from 'react';
import { Product, Sale, StockTransaction, User, formatCurrency, Theme } from '../../../types';

interface InventoryReportProps {
  stockTransactions: StockTransaction[];
  products: Product[];
  sales: Sale[];
  theme?: Theme;
  startDate?: string;
  endDate?: string;
  users?: User[];
  currentUser?: User | null;
}

const InventoryReport: React.FC<InventoryReportProps> = ({ 
  stockTransactions = [], 
  products = [], 
  sales = [], 
  theme,
  startDate,
  endDate,
  users = [],
  currentUser
}) => {
  const hasFinancialCostsPermission = !currentUser || 
    currentUser.username === 'admin' || 
    currentUser.permissions.includes('view_financial_costs') || 
    currentUser.permissions.includes('dashboard') || 
    currentUser.permissions.includes('reports');

  const [reportTab, setReportTab] = useState<'PROFIT' | 'LOSS'>(() => hasFinancialCostsPermission ? 'PROFIT' : 'LOSS');

  // Saldos de estoque consolidados acumulativos (representam o estoque atual, portanto usam toda a base de transações)
  const balances = useMemo(() => {
    const b: Record<string, number> = {};
    stockTransactions.forEach(t => {
      b[t.productId] = (b[t.productId] || 0) + t.quantity;
    });
    return b;
  }, [stockTransactions]);

  // Filtragem temporal das transações para fluxos no período ativo nos relatórios
  const filteredTransactions = useMemo(() => {
    if (!startDate || !endDate) return stockTransactions;
    
    const safeParse = (dateStr: string, hour: number, min: number, sec: number) => {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day, hour, min, sec).getTime();
    };

    const startTs = safeParse(startDate, 0, 0, 0);
    const endTs = safeParse(endDate, 23, 59, 59);

    return stockTransactions.filter(t => t.timestamp >= startTs && t.timestamp <= endTs);
  }, [stockTransactions, startDate, endDate]);

  // Estatísticas de vendas e rentabilidade
  const profitStats = useMemo(() => {
    const stats: Record<string, { name: string, qty: number, revenue: number, cost: number, profit: number }> = {};
    
    sales.forEach(s => {
      if (s.items) {
        s.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          const costPrice = product?.lastCostPrice || 0;
          
          if (!stats[item.productId]) {
            stats[item.productId] = { 
                name: item.productName, 
                qty: 0, 
                revenue: 0, 
                cost: 0, 
                profit: 0 
            };
          }
          
          stats[item.productId].qty += item.quantity;
          stats[item.productId].revenue += item.totalPrice;
          stats[item.productId].cost += costPrice * item.quantity;
          stats[item.productId].profit += item.totalPrice - (costPrice * item.quantity);
        });
      }
    });

    return Object.values(stats).sort((a, b) => b.profit - a.profit);
  }, [sales, products]);

  const totalProfit = profitStats.reduce((acc, s) => acc + s.profit, 0);
  const totalRevenue = profitStats.reduce((acc, s) => acc + s.revenue, 0);
  const totalCost = profitStats.reduce((acc, s) => acc + s.cost, 0);

  const stockValue = products.reduce((acc, p) => {
    const balance = balances[p.id] || 0;
    if (balance <= 0) return acc;
    return acc + (balance * (p.lastCostPrice || 0));
  }, 0);

  // Estatísticas de perdas e desperdícios no período selecionado
  const lossStats = useMemo(() => {
    let totalLossQty = 0;
    let totalLossCost = 0;
    
    const lossesByReason: Record<string, { qty: number, cost: number }> = {
      'Quebra': { qty: 0, cost: 0 },
      'Vencimento': { qty: 0, cost: 0 },
      'Consumo Equipe': { qty: 0, cost: 0 },
      'Erro de Preparo': { qty: 0, cost: 0 },
    };
    
    const lossesByProduct: Record<string, { id: string, name: string, category: string, qty: number, cost: number, mainReason: string, reasons: Record<string, number> }> = {};

    const lossTransactions = filteredTransactions.filter(t => t.type === 'LOSS');

    lossTransactions.forEach(t => {
      const product = products.find(p => p.id === t.productId);
      const costPrice = t.price !== undefined ? t.price : (product?.lastCostPrice || 0);
      const qty = Math.abs(t.quantity);
      const cost = qty * costPrice;

      totalLossQty += qty;
      totalLossCost += cost;

      const reason = t.reason || 'Quebra';
      if (!lossesByReason[reason]) {
        lossesByReason[reason] = { qty: 0, cost: 0 };
      }
      lossesByReason[reason].qty += qty;
      lossesByReason[reason].cost += cost;

      if (!lossesByProduct[t.productId]) {
        lossesByProduct[t.productId] = {
          id: t.productId,
          name: product?.name || 'Item Removido',
          category: product?.category || 'Geral',
          qty: 0,
          cost: 0,
          mainReason: '',
          reasons: {}
        };
      }
      lossesByProduct[t.productId].qty += qty;
      lossesByProduct[t.productId].cost += cost;
      lossesByProduct[t.productId].reasons[reason] = (lossesByProduct[t.productId].reasons[reason] || 0) + qty;
    });

    // Determina o motivo principal de descarte de cada produto
    Object.values(lossesByProduct).forEach(p => {
      let maxQty = 0;
      let main = 'Outro';
      Object.entries(p.reasons).forEach(([r, q]) => {
        if (q > maxQty) {
          maxQty = q;
          main = r;
        }
      });
      p.mainReason = main;
    });

    const sortedProducts = Object.values(lossesByProduct).sort((a, b) => b.cost - a.cost);

    // Encontrar o maior ralo de perdas por motivo
    let worstReason = 'Nenhum';
    let maxReasonCost = -1;
    Object.entries(lossesByReason).forEach(([reason, data]) => {
      if (data.cost > maxReasonCost) {
        maxReasonCost = data.cost;
        worstReason = reason;
      }
    });

    return {
      totalLossQty,
      totalLossCost,
      lossesByReason,
      lossesByProduct: sortedProducts,
      lossTransactions: lossTransactions.sort((a, b) => b.timestamp - a.timestamp),
      worstReason: maxReasonCost > 0 ? worstReason : 'Nenhum'
    };
  }, [filteredTransactions, products]);

  // Cores harmoniosas associadas aos motivos de perdas
  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'Quebra': return { bg: 'bg-rose-500', from: 'from-rose-500 to-rose-600 shadow-rose-500/20', text: 'text-rose-600 dark:text-rose-400' };
      case 'Vencimento': return { bg: 'bg-amber-500', from: 'from-amber-500 to-amber-600 shadow-amber-500/20', text: 'text-amber-600 dark:text-amber-400' };
      case 'Consumo Equipe': return { bg: 'bg-indigo-500', from: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' };
      case 'Erro de Preparo': return { bg: 'bg-slate-500', from: 'from-slate-500 to-slate-600 shadow-slate-500/20', text: 'text-slate-600 dark:text-slate-400' };
      default: return { bg: 'bg-slate-400', from: 'from-slate-400 to-slate-500', text: 'text-slate-500' };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* NAVEGAÇÃO DE ABAS INTERNA */}
      {hasFinancialCostsPermission && (
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm max-w-md mx-auto">
          <button 
            onClick={() => setReportTab('PROFIT')} 
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              reportTab === 'PROFIT' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            📈 Rentabilidade & CMV
          </button>
          <button 
            onClick={() => setReportTab('LOSS')} 
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              reportTab === 'LOSS' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🚨 Perdas & Desperdício
          </button>
        </div>
      )}

      {reportTab === 'PROFIT' && hasFinancialCostsPermission ? (
        <>
          {/* TAB 1: RENTABILIDADE & CMV */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lucro Bruto Total</p>
              <p className={`text-2xl font-black italic tracking-tighter ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(totalProfit)}
              </p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">No período selecionado</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Margem Média</p>
              <p className="text-2xl font-black italic tracking-tighter text-slate-800 dark:text-white">
                {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Sobre as vendas</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor em Estoque</p>
              <p className="text-2xl font-black italic tracking-tighter text-indigo-500">
                {formatCurrency(stockValue)}
              </p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Custo total parado</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CPV Total</p>
              <p className="text-2xl font-black italic tracking-tighter text-slate-500">
                {formatCurrency(totalCost)}
              </p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Custo das mercadorias vendidas</p>
            </div>
          </div>

          {/* TABELA DE RENTABILIDADE POR PRODUTO */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Análise de Lucratividade por Produto</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Comparativo entre custo de entrada e preço de venda</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Produto</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Vendas</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Custo Un.</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Venda Un.</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Lucro Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {profitStats.map(s => {
                            const unitCost = s.qty > 0 ? s.cost / s.qty : 0;
                            const unitPrice = s.qty > 0 ? s.revenue / s.qty : 0;
                            return (
                                <tr key={s.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-8 py-4">
                                        <p className="text-xs font-black uppercase text-slate-800 dark:text-white">{s.name}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <p className="text-xs font-black text-slate-600 dark:text-slate-400">{s.qty}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-xs font-bold text-slate-400">{formatCurrency(unitCost)}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-xs font-bold text-slate-800 dark:text-white">{formatCurrency(unitPrice)}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className={`text-sm font-black italic tracking-tighter ${s.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(s.profit)}</p>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* TAB 2: PERDAS & DESPERDÍCIO */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-4 right-4 bg-red-100 dark:bg-red-950/30 p-2 rounded-xl text-red-500 text-xs">🚨</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo de Desperdício</p>
              <p className="text-2xl font-black italic tracking-tighter text-red-500">
                {formatCurrency(lossStats.totalLossCost)}
              </p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Prejuízo financeiro direto</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500 text-xs">📦</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantidade Descartada</p>
              <p className="text-2xl font-black italic tracking-tighter text-slate-800 dark:text-white">
                {lossStats.totalLossQty.toFixed(1)} <span className="text-[10px] font-bold text-slate-400">UN/KG</span>
              </p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Volume físico perdido</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-indigo-100 dark:bg-indigo-950/30 p-2 rounded-xl text-indigo-500 text-xs">📊</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto no CMV</p>
              <p className="text-2xl font-black italic tracking-tighter text-indigo-500">
                {totalCost > 0 ? ((lossStats.totalLossCost / totalCost) * 100).toFixed(1) : '0.0'}%
              </p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Sobre o CPV das vendas</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-amber-100 dark:bg-amber-950/30 p-2 rounded-xl text-amber-500 text-xs">⚠️</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Principal Motivo</p>
              <p className={`text-2xl font-black italic tracking-tighter uppercase ${lossStats.totalLossCost > 0 ? getReasonColor(lossStats.worstReason).text : 'text-slate-400'}`}>
                {lossStats.worstReason}
              </p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Maior canal de desperdício</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-300">
            {/* DISTRIBUIÇÃO POR MOTIVO */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-1">Desperdício por Canal</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Classificação de perdas por motivo registrado</p>

              {lossStats.totalLossCost === 0 ? (
                <div className="h-60 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl mb-3">🍃</span>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nenhuma perda registrada</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(lossStats.lossesByReason).map(([reason, dataVal]) => {
                    const data = dataVal as { qty: number; cost: number };
                    const pct = lossStats.totalLossCost > 0 ? (data.cost / lossStats.totalLossCost) * 100 : 0;
                    const colors = getReasonColor(reason);
                    
                    return (
                      <div key={reason} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors.bg} mr-2`}></span>
                            <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">{reason}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-800 dark:text-white mr-2">{formatCurrency(data.cost)}</span>
                            <span className="text-[9px] font-black uppercase text-slate-400">({pct.toFixed(0)}%)</span>
                          </div>
                        </div>
                        {/* Barra Progressiva CSS */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${colors.from} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RANKING DE PRODUTOS MAIS DESPERDIÇADOS */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm overflow-hidden flex flex-col">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic mb-1">Ranking de Desperdício</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Produtos que geraram maior custo de perdas</p>

              {lossStats.lossesByProduct.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                  <span className="text-4xl mb-3">✅</span>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estoque 100% íntegro no período</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-8">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/30 border-y border-slate-100 dark:border-slate-800">
                        <th className="px-8 py-3.5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Produto</th>
                        <th className="px-4 py-3.5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Motivo Principal</th>
                        <th className="px-4 py-3.5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Qtd Perdida</th>
                        <th className="px-8 py-3.5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Custo da Perda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {lossStats.lossesByProduct.slice(0, 5).map(p => {
                        const colors = getReasonColor(p.mainReason);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                            <td className="px-8 py-4">
                              <p className="text-xs font-black uppercase text-slate-800 dark:text-white truncate max-w-[150px]">{p.name}</p>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">{p.category}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${colors.bg} text-white`}>
                                {p.mainReason}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <p className="text-xs font-black text-slate-700 dark:text-slate-300">{p.qty.toFixed(1)}</p>
                            </td>
                            <td className="px-8 py-4 text-right">
                              <p className="text-sm font-black italic tracking-tighter text-red-500">{formatCurrency(p.cost)}</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* HISTÓRICO DE AUDITORIA DE PERDAS */}
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Log de Perdas Recentes</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registros individuais de perdas no período selecionado</p>
              </div>
              <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-full border border-red-200 dark:border-red-800 uppercase tracking-wider">
                Auditoria de Descarte
              </span>
            </div>
            <div className="overflow-x-auto">
              {lossStats.lossTransactions.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-black uppercase tracking-[0.2em] italic">
                  Sem lançamentos de perda cadastrados neste período
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Data / Hora</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Produto</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Operador</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Quantidade</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Motivo</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Prejuízo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lossStats.lossTransactions.slice(0, 15).map(t => {
                      const product = products.find(p => p.id === t.productId);
                      const operator = users.find(u => u.id === t.userId);
                      const costPrice = t.price !== undefined ? t.price : (product?.lastCostPrice || 0);
                      const cost = Math.abs(t.quantity) * costPrice;
                      const colors = getReasonColor(t.reason || 'Quebra');
                      
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-8 py-4">
                            <p className="text-xs font-bold text-slate-500 uppercase">
                              {new Date(t.timestamp).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-[9px] font-medium text-slate-400 mt-0.5">
                              {new Date(t.timestamp).toLocaleTimeString('pt-BR')}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-black uppercase text-slate-800 dark:text-white">{product?.name || 'Item Removido'}</p>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{product?.category || 'Geral'}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                              {operator?.displayName || 'Sistema'}
                            </p>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">@{operator?.username || 'system'}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs font-black text-slate-800 dark:text-white">{Math.abs(t.quantity).toFixed(1)} {product?.sellType === 'weight' ? 'kg' : 'un'}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${colors.bg} text-white`}>
                              {t.reason || 'Quebra'}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <p className="text-sm font-black italic tracking-tighter text-red-500">{formatCurrency(cost)}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Custo Unit: {formatCurrency(costPrice)}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryReport;
