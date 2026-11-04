import React, { useState, useEffect, useMemo } from 'react';
import { redeService, RedeSalesResponse, RedeTransaction } from '../../services/redeService';
import { formatCurrency, Sale, PaymentMethod } from '../../types';

interface RedeConciliationProps {
  sales?: Sale[];
  activeShiftStartTime?: number;
}

export const RedeConciliation: React.FC<RedeConciliationProps> = ({ sales = [] }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RedeSalesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros de Data (padrão últimos 20 dias conforme recomendação da Rede)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const twentyDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 20);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState(twentyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [pv, setPv] = useState('13381369');
  const [filterModality, setFilterModality] = useState<string>('ALL');

  const fetchRedeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await redeService.getSales(startDate, endDate, pv);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar API da Rede');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedeData();
  }, [startDate, endDate]);

  // Vendas em cartão registradas no Botequista para comparação
  const botequistaCardTotals = useMemo(() => {
    let credit = 0;
    let debit = 0;

    sales.forEach(s => {
      if (s.deleted) return;
      if (s.payments) {
        s.payments.forEach(p => {
          if (p.method === PaymentMethod.CREDITO) credit += p.amount;
          if (p.method === PaymentMethod.DEBITO) debit += p.amount;
        });
      } else {
        if (s.paymentMethod === PaymentMethod.CREDITO) credit += s.total;
        if (s.paymentMethod === PaymentMethod.DEBITO) debit += s.total;
      }
    });

    return { credit, debit, total: credit + debit };
  }, [sales]);

  // Métricas apuradas da Rede
  const redeMetrics = useMemo(() => {
    if (!data) return { gross: 0, net: 0, mdr: 0, credit: 0, debit: 0, count: 0 };
    let credit = 0;
    let debit = 0;

    data.transactions.forEach(t => {
      if (t.status === 'APPROVED') {
        if (t.modality.type === 'DEBIT') debit += t.amount;
        else credit += t.amount;
      }
    });

    return {
      gross: data.totalAmount,
      net: data.totalNetAmount,
      mdr: data.totalMdrFee,
      credit,
      debit,
      count: data.transactions.length,
    };
  }, [data]);

  // Diferença de conciliação
  const diffCards = botequistaCardTotals.total > 0
    ? redeMetrics.gross - botequistaCardTotals.total
    : 0;

  // Transações filtradas
  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    if (filterModality === 'ALL') return data.transactions;
    return data.transactions.filter(t => t.modality.type === filterModality);
  }, [data, filterModality]);

  return (
    <div className="space-y-6">
      {/* Top Bar com Status da Integração */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl shadow-inner">
            💳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-black text-lg tracking-tight">Conciliação Rede (Itaú)</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ● Conectado (Sandbox)
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Extrato bancário, taxas de operadora (MDR) e conciliação automática com o caixa do balcão.
            </p>
          </div>
        </div>

        {/* Controles de Filtro e Sincronização */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <span className="text-slate-400">PV:</span>
            <input
              type="text"
              value={pv}
              onChange={(e) => setPv(e.target.value)}
              className="bg-transparent text-white font-mono w-24 text-xs focus:outline-none"
              title="Ponto de Venda / Estabelecimento"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <span className="text-slate-400">De:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none"
            />
            <span className="text-slate-400">Até:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={fetchRedeData}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-600/20"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Atualizar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Cards de Métricas e Comparativo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Bruto */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Vendas na Maquininha</span>
            <span className="text-slate-500">Bruto</span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCurrency(redeMetrics.gross)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{redeMetrics.count} transações capturadas</span>
            <span className="text-orange-400 font-semibold">100% aprovadas</span>
          </div>
        </div>

        {/* Card 2: Taxas MDR */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Taxa Retida (MDR)</span>
            <span className="text-red-400 font-semibold">Custo</span>
          </div>
          <div className="text-2xl font-black text-red-400 tracking-tight">
            {formatCurrency(redeMetrics.mdr)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {redeMetrics.gross > 0
              ? `${((redeMetrics.mdr / redeMetrics.gross) * 100).toFixed(2)}% de taxa média praticada`
              : 'Sem taxa no período'}
          </div>
        </div>

        {/* Card 3: Líquido a Receber */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Líquido na Conta</span>
            <span className="text-emerald-400 font-semibold">Recebível</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {formatCurrency(redeMetrics.net)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Previsão líquida depositada no banco
          </div>
        </div>

        {/* Card 4: Termômetro de Conciliação com o Botequista */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Auditoria com Balcão</span>
            <span>⚖️</span>
          </div>
          {botequistaCardTotals.total > 0 ? (
            <>
              <div className="text-lg font-black text-white tracking-tight">
                {Math.abs(diffCards) < 1 ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <span>✓</span> 100% Conciliado
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <span>⚠️</span> Dif: {formatCurrency(Math.abs(diffCards))}
                  </span>
                )}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Lançado no Botequista: {formatCurrency(botequistaCardTotals.total)}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-slate-300">
                {formatCurrency(redeMetrics.credit)} Crédito • {formatCurrency(redeMetrics.debit)} Débito
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Extrato oficial sincronizado com a Rede
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lista de Transações da Maquininha */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
              <span>Transações Capturadas nas Maquininhas</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300">
                {filteredTransactions.length} comprovantes
              </span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Extrato completo com autorização, NSU, bandeira e taxa retida pela operadora.
            </p>
          </div>

          {/* Filtro por Modalidade */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/5 self-start">
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'CREDIT', label: 'Crédito' },
              { id: 'DEBIT', label: 'Débito' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setFilterModality(m.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterModality === m.id
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de Transações */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Bandeira / Cartão</th>
                <th className="py-3 px-4">Modalidade</th>
                <th className="py-3 px-4">NSU / Autorização</th>
                <th className="py-3 px-4 text-right">Valor Bruto</th>
                <th className="py-3 px-4 text-right">Taxa (MDR)</th>
                <th className="py-3 px-4 text-right">Valor Líquido</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhuma transação encontrada para o período selecionado.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => (
                  <tr key={`${t.nsu}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-white">{t.saleDate}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.saleHour}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{t.brandName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.cardNumber}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.modality.type === 'DEBIT'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {t.modality.type === 'DEBIT' ? 'DÉBITO' : 'CRÉDITO'}
                        {t.installmentQuantity && t.installmentQuantity > 1 ? ` (${t.installmentQuantity}x)` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                      <div>NSU: {t.nsu}</div>
                      <div className="text-[10px] text-slate-500">Aut: {t.authorizationCode || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-white">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap text-red-400 font-mono">
                      -{formatCurrency(t.discountAmount || t.mdrFee)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-emerald-400">
                      {formatCurrency(t.netAmount)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {t.status === 'APPROVED' ? 'APROVADO' : t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

