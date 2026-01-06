
import React from 'react';
import { Sale } from '../types';

interface SalesHistoryProps {
  sales: Sale[];
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Histórico Completo</h3>
        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full font-bold">
          {sales.length} registros
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs uppercase font-bold tracking-wider">
              <th className="px-6 py-4">Data/Hora</th>
              <th className="px-6 py-4">Itens</th>
              <th className="px-6 py-4">Pagamento</th>
              <th className="px-6 py-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <td className="px-6 py-4">
                  <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {new Date(sale.timestamp).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="block text-xs text-slate-400 dark:text-slate-500">
                    {new Date(sale.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                    sale.paymentMethod === 'Pendura' 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' 
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {sale.paymentMethod}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    R$ {sale.total.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400 dark:text-slate-600">
                  Nenhuma venda realizada ainda.
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
