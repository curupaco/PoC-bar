
import React, { useState, useMemo } from 'react';
import { Sale, formatCurrency, User, PaymentMethod } from '../types';

interface SalesHistoryProps {
  sales: Sale[];
  onDeleteSale: (id: string) => void;
  users: User[];
  currentUser: User;
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales = [], onDeleteSale, users, currentUser }) => {
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPendura, setFilterPendura] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canDelete = currentUser.username === 'admin' || currentUser.permissions.includes('delete_sale');

  const filteredSales = useMemo(() => {
    return (sales || []).filter(s => {
      // INÍCIO DA ALTERAÇÃO: Filtro inteligente para incluir/excluir anuladas baseado no toggle de supervisão
      if (s.deleted && !showDeleted) return false; 
      
      const matchSearch = (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.tabName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchPendura = filterPendura ? (s.paymentMethod === PaymentMethod.PENDURA || s.items?.some(i => i.productId === 'quitacao')) : true;
      return matchSearch && matchPendura;
    });
  }, [sales, searchTerm, filterPendura, showDeleted]);

  const handleDelete = (id: string) => {
    if (!canDelete) {
        setErrorToast("VOCÊ NÃO TEM PERMISSÃO PARA EXCLUIR VENDAS.");
        setTimeout(() => setErrorToast(null), 3000);
        return;
    }
    setDeleteConfirmId(id);
  };

  const getUsernameById = (id?: string) => {
    if (!id) return 'SISTEMA';
    return users.find(u => u.id === id)?.username || id;
  };

  return (
    <div className="relative space-y-6">
      {errorToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4">
           {errorToast}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Venda */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl relative z-[410] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
             </div>
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-4 tracking-tighter leading-none italic">Anular Operação?</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed px-2">
               Este registro será anulado dos relatórios financeiros, mas os dados de auditoria serão preservados para o gestor.
             </p>
             <div className="flex flex-col gap-3">
                <button onClick={() => { onDeleteSale(deleteConfirmId); setDeleteConfirmId(null); }} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Confirmar Anulação</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           <input 
              type="text" 
              placeholder="BUSCAR POR CLIENTE OU MESA..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none outline-none font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-red-500 transition-all shadow-inner"
           />
        </div>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button 
            onClick={() => setFilterPendura(!filterPendura)}
            className={`flex-1 xl:flex-none px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${filterPendura ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
          >
            {filterPendura ? 'Apenas Fiados' : 'Todos os Tipos'}
          </button>
          <button 
            onClick={() => setShowDeleted(!showDeleted)}
            className={`flex-1 xl:flex-none px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${showDeleted ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
          >
            {showDeleted ? 'Com Anuladas' : 'Apenas Ativas'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm italic">Fluxo de Caixa Operacional</h3>
          <div className="flex gap-2">
            {showDeleted && (
              <span className="text-[10px] bg-slate-800 text-white px-4 py-1 rounded-full font-black uppercase tracking-widest">
                Exibindo Lixeira
              </span>
            )}
            <span className="text-[10px] bg-red-600 text-white px-4 py-1 rounded-full font-black uppercase tracking-widest shadow-md">
              {filteredSales.length} registros
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest">
                <th className="px-8 py-5">Data/Hora</th>
                <th className="px-8 py-5">Identificação</th>
                <th className="px-8 py-5">Pagamento</th>
                <th className="px-8 py-5">Total</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${sale.deleted ? 'opacity-40 grayscale italic bg-slate-50/50 dark:bg-slate-900/50' : ''}`}>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="block font-black text-slate-800 dark:text-slate-200">
                      {new Date(sale.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(sale.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 dark:text-white uppercase">
                        {sale.customerName ? sale.customerName : (sale.tabName || 'Venda Rápida')}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Local: {sale.tabName || 'Balcão'}</span>
                        {sale.deleted && (
                          <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 rounded font-black uppercase">
                            Por: @{getUsernameById(sale.deletedBy)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${
                      sale.deleted 
                        ? 'bg-slate-100 text-slate-400 border-slate-200' 
                        : sale.paymentMethod === 'Pendura' 
                          ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      {sale.deleted ? 'ANULADA' : (sale.items?.some(i => i.productId === 'quitacao') ? 'QUITAÇÃO FIADO' : sale.paymentMethod)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`font-black text-sm ${
                      sale.deleted 
                        ? 'text-slate-400 line-through' 
                        : sale.items?.some(i => i.productId === 'quitacao') 
                          ? 'text-blue-600' 
                          : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {formatCurrency(sale.total)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {!sale.deleted ? (
                      <button 
                        disabled={!canDelete}
                        onClick={(e) => { e.stopPropagation(); handleDelete(String(sale.id)); }} 
                        className="text-red-500 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-20"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    ) : (
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest pr-2">
                        {sale.deletedAt ? new Date(sale.deletedAt).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) : '-'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic opacity-30">
                    Nenhum registro encontrado para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;
