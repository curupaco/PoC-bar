
import React from 'react';
import { Sale, formatCurrency } from '../types';

interface SalesHistoryProps {
  sales: Sale[];
  onDeleteSale: (id: string) => void;
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales, onDeleteSale }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
        <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Histórico de Fechamentos</h3>
        <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full font-bold">
          {sales.length} registros
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              <th className="px-6 py-4">Data/Hora</th>
              <th className="px-6 py-4">Mesa/Cliente</th>
              <th className="px-6 py-4">Itens</th>
              <th className="px-6 py-4">Pagamento</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="block font-bold text-slate-700 dark:text-slate-200">
                    {new Date(sale.timestamp).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {new Date(sale.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-black text-slate-800 dark:text-white uppercase text-xs">
                    {sale.tabName || 'Venda Rápida'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-[10px] text-slate-500 max-w-[200px] truncate">
                    {sale.items.map(i => {
                      const qtyStr = i.quantity >= 1 && Number.isInteger(i.quantity) ? `${i.quantity}un` : `${(i.quantity * 1000).toFixed(0)}g`;
                      return `${qtyStr} ${i.productName}`;
                    }).join(', ')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 uppercase">
                    {sale.paymentMethod}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-black text-red-600 dark:text-red-400">
                    {formatCurrency(sale.total)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onDeleteSale(sale.id)} 
                    className="text-red-500 hover:text-red-700 font-black p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="Excluir Venda"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                  Nenhuma venda registrada ainda.
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
