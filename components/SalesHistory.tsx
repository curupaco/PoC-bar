import React, { useState, useMemo, useEffect } from 'react';
import { Sale, formatCurrency, User, PaymentMethod } from '../types';
import { getFirebaseToken } from '../services/firebaseService';

interface SalesHistoryProps {
  sales: Sale[];
  onDeleteSale: (id: string) => void;
  users: User[];
  currentUser: User;
  activeUnitId?: string | null;
  syncConfig?: { url: string; key: string; email: string; pass: string };
}

const ITEMS_PER_PAGE = 20;
const MAX_REMOTE_CACHE = 100; // FIX 5: Limite de cache remoto

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales = [], onDeleteSale, users, currentUser, activeUnitId, syncConfig }) => {
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPendura, setFilterPendura] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Estados para Busca Híbrida
  const [remoteResults, setRemoteResults] = useState<Sale[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);

  const canDelete = currentUser.username === 'admin' || currentUser.permissions.includes('delete_sale');

  // FIX 5: Limpeza e Limite de Memória na Busca Híbrida
  const handleRemoteSearch = async () => {
     if (!searchTerm.trim() || !activeUnitId || !syncConfig) return;
     
     setIsSearchingRemote(true);
     try {
        const token = await getFirebaseToken(syncConfig.email, syncConfig.pass, syncConfig.key);
        
        const res = await fetch(`/api/search?unitId=${activeUnitId}&term=${encodeURIComponent(searchTerm)}`, {
           headers: {
              'x-fb-url': syncConfig.url,
              'x-fb-token': token || ''
           }
        });
        
        if (res.ok) {
           const results: Sale[] = await res.json();
           // Aplica limite de cache para segurança de RAM
           setRemoteResults(results.slice(0, MAX_REMOTE_CACHE));
           if (results.length === 0) setErrorToast("NENHUM RESULTADO NA NUVEM.");
        } else {
           setErrorToast("ERRO NA BUSCA ONLINE.");
        }
     } catch (e) {
        setErrorToast("FALHA DE CONEXÃO.");
     } finally {
        setIsSearchingRemote(false);
        setTimeout(() => setErrorToast(null), 3000);
     }
  };

  // Limpa resultados remotos quando o termo de busca é alterado ou esvaziado
  useEffect(() => {
     if (!searchTerm) {
        setRemoteResults([]);
     }
  }, [searchTerm]);

  const filteredSales = useMemo(() => {
    // FIX 3: PRIORIDADE DE DADOS NA BUSCA HÍBRIDA
    // Invertemos a ordem do merge: remoteResults entram primeiro, sales (locais) entram depois.
    // Assim, se o mesmo ID existir em ambos, a versão de 'sales' (que pode ter sofrido anulação local recente)
    // sobrescreverá a versão da nuvem no Map.
    const merged = [...remoteResults, ...sales];
    const uniqueSales = Array.from(new Map(merged.map(item => [item.id, item])).values());

    // Ordena decrescente por timestamp (mais recente primeiro)
    uniqueSales.sort((a, b) => b.timestamp - a.timestamp);

    return uniqueSales.filter(s => {
      if (s.deleted && !showDeleted) return false; 
      
      const matchSearch = (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.tabName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchPendura = filterPendura ? (s.paymentMethod === PaymentMethod.PENDURA || s.items?.some(i => i.productId === 'quitacao')) : true;
      return matchSearch && matchPendura;
    });
  }, [sales, remoteResults, searchTerm, filterPendura, showDeleted]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSales.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSales, currentPage]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);

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

  const changePage = (p: number) => {
    setCurrentPage(p);
    document.getElementById('history-table-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative space-y-6">
      {errorToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4">
           {errorToast}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl relative z-[410] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
             <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      {/* FILTROS E BUSCA */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full flex items-center gap-2">
           <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                  type="text" 
                  placeholder="BUSCAR POR CLIENTE OU MESA..." 
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  onKeyDown={e => e.key === 'Enter' && handleRemoteSearch()}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-none outline-none font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-red-500 transition-all shadow-inner"
              />
           </div>
           {searchTerm.length > 2 && (
              <button 
                 onClick={handleRemoteSearch} 
                 disabled={isSearchingRemote}
                 className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
              >
                 {isSearchingRemote ? 'Buscando...' : 'Buscar na Nuvem'}
              </button>
           )}
        </div>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button onClick={() => { setFilterPendura(!filterPendura); setCurrentPage(1); }} className={`flex-1 xl:flex-none px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${filterPendura ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {filterPendura ? 'Apenas Fiados' : 'Todos os Tipos'}
          </button>
          <button onClick={() => { setShowDeleted(!showDeleted); setCurrentPage(1); }} className={`flex-1 xl:flex-none px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${showDeleted ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {showDeleted ? 'Com Anuladas' : 'Apenas Ativas'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden" id="history-table-top">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm italic">Fluxo de Caixa Operacional</h3>
          <div className="flex gap-2">
            {remoteResults.length > 0 && (
               <span className="text-[10px] bg-blue-100 text-blue-600 px-4 py-1 rounded-full font-black uppercase tracking-widest">
                  + {remoteResults.length} resultados da nuvem
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
              {paginatedSales.map((sale) => (
                <tr key={sale.id} className={`optimize-render hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${sale.deleted ? 'opacity-40 grayscale italic bg-slate-50/50 dark:bg-slate-900/50' : ''}`}>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="block font-black text-slate-800 dark:text-slate-200">{new Date(sale.timestamp).toLocaleDateString('pt-BR')}</span>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(sale.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 dark:text-white uppercase">{sale.customerName ? sale.customerName : (sale.tabName || 'Venda Rápida')}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Local: {sale.tabName || 'Balcão'}</span>
                        {sale.deleted && <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 rounded font-black uppercase">Por: @{getUsernameById(sale.deletedBy)}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${sale.deleted ? 'bg-slate-100 text-slate-400 border-slate-200' : sale.paymentMethod === 'Pendura' ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                      {sale.deleted ? 'ANULADA' : (sale.items?.some(i => i.productId === 'quitacao') ? 'QUITAÇÃO FIADO' : sale.paymentMethod)}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`font-black text-sm ${sale.deleted ? 'text-slate-400 line-through' : sale.items?.some(i => i.productId === 'quitacao') ? 'text-blue-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatCurrency(sale.total)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {!sale.deleted ? (
                      <button disabled={!canDelete} onClick={(e) => { e.stopPropagation(); handleDelete(String(sale.id)); }} className="text-red-500 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-20">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    ) : (
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest pr-2">{sale.deletedAt ? new Date(sale.deletedAt).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) : '-'}</div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic opacity-30">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => changePage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl disabled:opacity-50 font-black text-xs uppercase">Anterior</button>
          <span className="flex items-center px-4 font-black text-xs text-slate-500">Página {currentPage} de {totalPages}</span>
          <button onClick={() => changePage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl disabled:opacity-50 font-black text-xs uppercase">Próxima</button>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;