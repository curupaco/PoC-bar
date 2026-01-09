
import React from 'react';
import { Sale, formatCurrency, User } from '../types';

interface SalesHistoryProps {
  sales: Sale[];
  onDeleteSale: (id: string) => void;
  users: User[];
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales = [], onDeleteSale, users }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
        <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm">Histórico Global de Vendas</h3>
        <span className="text-[10px] bg-red-600 text-white px-4 py-1 rounded-full font-black uppercase tracking-widest">
          {(sales || []).length} registros
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              <th className="px-8 py-5">Data/Hora</th>
              <th className="px-8 py-5">Mesa / Operador</th>
              <th className="px-8 py-5">Pagamento</th>
              <th className="px-8 py-5">Total</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(sales || []).map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-5 whitespace-nowrap">
                  <span className="block font-black text-slate-800 dark:text-slate-200">
                    {new Date(sale.timestamp).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">
                    {new Date(sale.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <span className="font-black text-slate-800 dark:text-white uppercase">
                    {sale.tabName || 'Venda Rápida'}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Operador:</span>
                    <span className="text-[9px] text-blue-500 font-black uppercase">@{users.find(u => u.id === sale.userId)?.username || 'Admin'}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${sale.paymentMethod === 'Pendura' ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                    {sale.paymentMethod}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(sale.total)}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteSale(String(sale.id)); }} 
                    className="text-red-500 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {(sales || []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic">
                  Nenhum registro no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesHistory;
