
import React, { useState, useMemo, useEffect } from 'react';
import { Sale, formatCurrency, User, PaymentMethod } from '../../types';
import { getFirebaseToken } from '../../services/firebaseService';

interface SalesHistoryProps {
  sales: Sale[];
  onDeleteSale: (id: string) => void;
  users: User[];
  currentUser: User;
  activeUnitId?: string | null;
  syncConfig?: { url: string; key: string; email: string; pass: string };
}

const ITEMS_PER_PAGE = 15; // Reduzido para maior fluidez mobile

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales = [], onDeleteSale, users, currentUser, activeUnitId, syncConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPendura, setFilterPendura] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [remoteResults, setRemoteResults] = useState<Sale[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const canDelete = currentUser.username === 'admin' || currentUser.permissions.includes('delete_sale');

  const handleRemoteSearch = async () => {
     if (!searchTerm.trim() || !activeUnitId || !syncConfig) return;
     setIsSearchingRemote(true);
     try {
        const token = await getFirebaseToken(syncConfig.email, syncConfig.pass, syncConfig.key);
        const res = await fetch(`/api/search?unitId=${activeUnitId}&term=${encodeURIComponent(searchTerm)}`, {
           headers: { 'x-fb-url': syncConfig.url, 'x-fb-token': token || '' }
        });
        if (res.ok) {
           const results = await res.json();
           setRemoteResults(results);
        }
     } catch (e) {
        console.warn("Falha na busca remota.");
     } finally {
        setIsSearchingRemote(false);
     }
  };

  useEffect(() => { if (!searchTerm) setRemoteResults([]); }, [searchTerm]);

  const filteredSales = useMemo(() => {
    // Merge eficiente: Local (recém editado/excluído) ganha prioridade sobre Remoto
    const mergedMap = new Map();
    remoteResults.forEach(s => mergedMap.set(s.id, s));
    sales.forEach(s => mergedMap.set(s.id, s));

    const all = Array.from(mergedMap.values())
      .sort((a, b) => b.timestamp - a.timestamp);

    return all.filter(s => {
      if (s.deleted && !showDeleted) return false; 
      const matchSearch = (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.tabName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchPendura = filterPendura ? (s.paymentMethod === PaymentMethod.PENDURA || s.items?.some(i => i.productId === 'quitacao')) : true;
      return matchSearch && matchPendura;
    });
  }, [sales, remoteResults, searchTerm, filterPendura, showDeleted]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSales.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSales, currentPage]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-4 italic">Anular Venda?</h3>
             <p className="text-sm text-slate-500 mb-10 leading-relaxed px-2">Esta operação ficará registrada no log de auditoria para o gerente.</p>
             <div className="flex flex-col gap-3">
                <button onClick={() => { onDeleteSale(deleteConfirmId); setDeleteConfirmId(null); }} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Confirmar Anulação</button>
                <button onClick={() => setDeleteConfirmId(null)} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400">Voltar</button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full flex items-center gap-2">
           <input type="text" placeholder="BUSCAR POR CLIENTE, MESA OU ID..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} onKeyDown={e => e.key === 'Enter' && handleRemoteSearch()} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none outline-none font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-red-500 shadow-inner" />
           {searchTerm.length > 2 && <button onClick={handleRemoteSearch} disabled={isSearchingRemote} className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">{isSearchingRemote ? '...' : 'Nuvem'}</button>}
        </div>
        <div className="flex gap-2 w-full xl:w-auto">
          <button onClick={() => {setFilterPendura(!filterPendura); setCurrentPage(1);}} className={`flex-1 xl:flex-none px-6 py-4 rounded-2xl font-black uppercase text-[10px] transition-all ${filterPendura ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>Fiados</button>
          <button onClick={() => {setShowDeleted(!showDeleted); setCurrentPage(1);}} className={`flex-1 xl:flex-none px-6 py-4 rounded-2xl font-black uppercase text-[10px] transition-all ${showDeleted ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>Inativas</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-black">
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Mesa/Cliente</th>
                <th className="px-8 py-5">Pagamento</th>
                <th className="px-8 py-5">Total</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedSales.map((sale) => (
                <tr key={sale.id} className={`optimize-render hover:bg-slate-50 dark:hover:bg-slate-800/30 ${sale.deleted ? 'opacity-40 grayscale bg-slate-50/50' : ''}`}>
                  <td className="px-8 py-5">
                    <span className="block font-black text-slate-800 dark:text-slate-200">{new Date(sale.timestamp).toLocaleDateString()}</span>
                    <span className="block text-[8px] text-slate-400 font-bold">{new Date(sale.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-black text-slate-800 dark:text-white uppercase truncate block max-w-[150px]">{sale.customerName || sale.tabName || 'Rápida'}</span>
                    <span className="text-[8px] text-slate-400 uppercase font-black">{sale.id.slice(-8)}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${sale.paymentMethod === 'Pendura' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-slate-100 text-slate-500'}`}>{sale.deleted ? 'Anulada' : sale.paymentMethod}</span>
                  </td>
                  <td className="px-8 py-5 font-black text-emerald-600">{formatCurrency(sale.total)}</td>
                  <td className="px-8 py-5 text-right">
                    {!sale.deleted && canDelete && <button onClick={() => setDeleteConfirmId(sale.id)} className="text-red-500 hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 text-[10px] font-black uppercase disabled:opacity-30">Ant</button>
          <span className="text-[10px] font-black uppercase text-slate-400">Pág {currentPage} de {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 text-[10px] font-black uppercase disabled:opacity-30">Próx</button>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
