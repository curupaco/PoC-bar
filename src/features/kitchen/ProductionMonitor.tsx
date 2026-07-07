import React, { useState, useMemo, useEffect } from 'react';
import { Tab, SaleItem, Sale, Product } from '../../types';
import { safeLocalStorage } from '../../utils/storage';

const playKitchenBell = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Oscilador para o ding agudo metálico
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // Nota B5
    
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.3);
  } catch (err) {
    console.warn("Falha ao reproduzir som da cozinha:", err);
  }
};

interface ProductionMonitorProps {
  openTabs: Tab[];
  onUpdateTabItem: (tabId: string, item: SaleItem) => Promise<void>;
  sales?: Sale[];
  products?: Product[];
}

export const ProductionMonitor: React.FC<ProductionMonitorProps> = ({
  openTabs = [],
  onUpdateTabItem,
  sales = [],
  products = []
}) => {
  const [filter, setFilter] = useState<'PENDING' | 'READY'>('PENDING');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = safeLocalStorage.getItem('kitchen_sound_enabled');
    return saved !== 'false';
  });
  const [, setTick] = useState(0);

  // Calcula total de itens pendentes ativos
  const pendingCount = useMemo(() => {
    let count = 0;
    openTabs.forEach(tab => {
      const itemsList = Array.isArray(tab.items) 
        ? tab.items 
        : (Object.values(tab.items || {}) as SaleItem[]);
      count += itemsList.filter(item => item.productionStatus === 'PENDING').length;
    });
    return count;
  }, [openTabs]);

  const prevPendingCountRef = React.useRef(pendingCount);

  // Efeito reativo para tocar o sino de comanda quando novo pedido entra na fila
  useEffect(() => {
    if (soundEnabled && pendingCount > prevPendingCountRef.current) {
      playKitchenBell();
    }
    prevPendingCountRef.current = pendingCount;
  }, [pendingCount, soundEnabled]);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Helpers to calculate elapsed time nicely
  const getElapsedMinutes = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    return Math.floor(diffMs / 60000);
  };

  const formatElapsedTime = (timestamp: number) => {
    const minutes = getElapsedMinutes(timestamp);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    return `${hours}h ${remMin}m`;
  };

  // Extract and group active kitchen items
  const tickets = useMemo(() => {
    const result: Array<{
      tabId: string;
      tabName: string;
      openedAt: number;
      lastItemAddedAt?: number;
      items: SaleItem[];
      isClosedSale?: boolean;
    }> = [];

    // 1. Obter itens do monitor reativo nas comandas abertas
    openTabs.forEach(tab => {
      const itemsList = Array.isArray(tab.items) 
        ? tab.items 
        : (Object.values(tab.items || {}) as SaleItem[]);

      // Filter items matching the active tab view (PENDING or READY)
      const matchingItems = itemsList.filter(item => item.productionStatus === filter);

      if (matchingItems.length > 0) {
        result.push({
          tabId: tab.id,
          tabName: tab.name,
          openedAt: tab.openedAt,
          lastItemAddedAt: tab.lastItemAddedAt,
          items: matchingItems,
          isClosedSale: false
        });
      }
    });

    // 2. Se a aba for PRONTOS, incluir também as vendas finalizadas recentemente (últimas 2h, máx 15)
    if (filter === 'READY' && sales.length > 0 && products.length > 0) {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      const kitchenProductIds = new Set(
        products.filter(p => p.toKitchen).map(p => p.id)
      );

      const recentSales = sales
        .filter(sale => !sale.deleted && sale.timestamp >= twoHoursAgo)
        .sort((a, b) => b.timestamp - a.timestamp) // Mais recentes primeiro
        .slice(0, 15);

      recentSales.forEach(sale => {
        const itemsList = sale.items || [];
        const matchingItems = itemsList.filter(item => 
          item.productionStatus === 'READY' || kitchenProductIds.has(item.productId)
        );

        if (matchingItems.length > 0) {
          result.push({
            tabId: sale.id,
            tabName: sale.tabName || `VENDA #${sale.id.slice(-4)}`,
            openedAt: sale.timestamp,
            lastItemAddedAt: sale.timestamp,
            items: matchingItems,
            isClosedSale: true
          });
        }
      });
    }

    // Fila de preparo (PENDING) = FIFO (mais antigos primeiro)
    // Fila de entregues (READY) = LIFO (mais recentes no topo)
    return result.sort((a, b) => {
      const timeA = a.lastItemAddedAt || a.openedAt;
      const timeB = b.lastItemAddedAt || b.openedAt;
      return filter === 'PENDING' ? timeA - timeB : timeB - timeA;
    });
  }, [openTabs, filter, sales, products]);

  // Consolidate totals to display in the header (e.g. 5x Coxinha, 3x Batata Frita)
  const consolidatedPending = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; modifier?: string }> = {};
    
    openTabs.forEach(tab => {
      const itemsList = Array.isArray(tab.items) 
        ? tab.items 
        : (Object.values(tab.items || {}) as SaleItem[]);

      itemsList.filter(i => i.productionStatus === 'PENDING').forEach(item => {
        const key = item.productId + (item.modifier ? `-${item.modifier.name}-${item.modifier.comment || ''}` : '');
        if (counts[key]) {
          counts[key].qty += item.quantity;
        } else {
          counts[key] = {
            name: item.productName,
            qty: item.quantity,
            modifier: item.modifier 
              ? [item.modifier.name, item.modifier.comment].filter(Boolean).join(' - ')
              : undefined
          };
        }
      });
    });

    return Object.values(counts).sort((a, b) => b.qty - a.qty);
  }, [openTabs]);

  const handleMarkItemStatus = async (tabId: string, item: SaleItem, nextStatus: 'PENDING' | 'READY') => {
    const updated: SaleItem = {
      ...item,
      productionStatus: nextStatus
    };
    if (onUpdateTabItem) {
      await onUpdateTabItem(tabId, updated);
    }
  };

  const handleMarkAllTicketReady = async (tabId: string, items: SaleItem[]) => {
    if (!onUpdateTabItem) return;
    // Sequential await to update all items safely
    for (const item of items) {
      await onUpdateTabItem(tabId, { ...item, productionStatus: 'READY' });
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-32 flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* 1. HEADER MONITOR */}
      <div className="bg-slate-900 text-white rounded-[40px] p-6 md:p-8 border border-slate-800 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <span className="bg-red-600/20 text-red-500 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest leading-none border border-red-500/20">
            Tempo Real
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic mt-3 flex items-center gap-3">
            <span>🍳</span> Monitor de Produção
          </h2>
          <p className="text-xs text-slate-400 font-semibold tracking-wide mt-1">
            Controle de pedidos e produção de pratos da cozinha
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto w-full sm:w-auto">
          {/* Controle de Som de Notificação */}
          <button
            onClick={() => {
              const newVal = !soundEnabled;
              setSoundEnabled(newVal);
              safeLocalStorage.setItem('kitchen_sound_enabled', String(newVal));
              if (newVal) {
                // Toca sino rápido de confirmação ao ativar
                try {
                  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                  if (AudioContextClass) {
                    const ctx = new AudioContextClass();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1200, ctx.currentTime);
                    gain.gain.setValueAtTime(0.2, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.4);
                  }
                } catch (e) {}
              }
            }}
            className={`px-4 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 border flex-1 sm:flex-none ${
              soundEnabled 
                ? 'bg-slate-800 text-emerald-400 border-emerald-500/20 hover:bg-slate-800/80' 
                : 'bg-slate-800 text-slate-500 border-slate-700/50 hover:bg-slate-800/80'
            }`}
            title={soundEnabled ? "Silenciar notificações sonoras" : "Ativar notificações sonoras"}
            type="button"
          >
            <span>{soundEnabled ? '🔊' : '🔇'}</span>
            <span>{soundEnabled ? 'Sons Ativos' : 'Mudo'}</span>
          </button>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-950 p-2 rounded-2xl border border-slate-800 flex-[2] sm:flex-none">
            <button
              onClick={() => setFilter('PENDING')}
              className={`flex-1 sm:flex-none px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${
                filter === 'PENDING'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
              type="button"
            >
              <span>Fila</span>
              {consolidatedPending.length > 0 && (
                <span className="bg-white text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md min-w-[16px] text-center">
                  {consolidatedPending.reduce((acc, c) => acc + c.qty, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('READY')}
              className={`flex-1 sm:flex-none px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${
                filter === 'READY'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
              type="button"
            >
              <span>Prontos</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CONSOLIDATED SUMMARY (PENDING VIEW ONLY) */}
      {filter === 'PENDING' && consolidatedPending.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[30px] shadow-sm">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
            <span>📊</span> Totais Consolidados a Fazer
          </h3>
          <div className="flex flex-wrap gap-3">
            {consolidatedPending.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 px-5 py-3 rounded-2xl flex items-center gap-3"
              >
                <span className="bg-amber-600 text-white text-sm font-black w-7 h-7 rounded-xl flex items-center justify-center">
                  {item.qty}x
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 leading-tight">
                    {item.name}
                  </span>
                  {item.modifier && (
                    <span className="text-[8px] font-bold text-amber-600 uppercase">
                      ({item.modifier})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TICKETS LIST GRID */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] opacity-60">
          <div className="w-40 h-40 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-8 shadow-inner">
            <span className="text-6xl">{filter === 'PENDING' ? '🦗' : '📭'}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter italic">
            {filter === 'PENDING' ? 'Cozinha sem pedidos!' : 'Nenhum pedido entregue hoje.'}
          </h3>
          <p className="text-xs font-bold text-slate-400 mt-2 tracking-wide uppercase">
            {filter === 'PENDING' ? 'Tudo em dia na produção.' : 'Os pratos prontos sumiram.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tickets.map(ticket => {
            const timeSinceLastItem = ticket.lastItemAddedAt 
              ? getElapsedMinutes(ticket.lastItemAddedAt) 
              : getElapsedMinutes(ticket.openedAt);
            
            // Highly contrasting colors based on wait time to warn the chef
            const timerColorClass = timeSinceLastItem >= 20 
              ? 'bg-red-500 text-white animate-pulse' 
              : timeSinceLastItem >= 10 
                ? 'bg-amber-500 text-slate-950 font-black' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

            return (
              <div 
                key={ticket.tabId} 
                className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[35px] shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-red-500/20 hover:shadow-xl relative"
              >
                {/* Barra de Progresso de Atraso (Heatmap de Urgência) */}
                {filter === 'PENDING' && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800/60">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        timeSinceLastItem >= 20 ? 'bg-red-500 animate-pulse' :
                        timeSinceLastItem >= 10 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min((timeSinceLastItem / 20) * 100, 100)}%` }}
                    />
                  </div>
                )}

                {/* Ticket Header */}
                <div className="pt-7 pb-6 px-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="min-w-0 pr-3">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Comanda</span>
                    <h4 className="text-lg font-black uppercase italic truncate tracking-tight text-slate-800 dark:text-white leading-none mt-1">
                      {ticket.tabName}
                    </h4>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${timerColorClass}`}>
                    🕒 {formatElapsedTime(ticket.lastItemAddedAt || ticket.openedAt)}
                  </div>
                </div>

                {/* Ticket Items List */}
                <div className="flex-1 p-6 space-y-4 min-h-[160px]">
                  {ticket.items.map(item => (
                    <div 
                      key={item.id} 
                      className="flex justify-between items-start gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 dark:text-red-400 font-black text-sm shrink-0">
                            {item.quantity}x
                          </span>
                          <span className="font-black text-xs uppercase text-slate-800 dark:text-slate-200 tracking-tight leading-tight pr-1">
                            {item.productName}
                          </span>
                        </div>
                        {item.modifier && (
                          <div className="mt-1 pl-7">
                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wide">
                              {[item.modifier.name, item.modifier.comment].filter(Boolean).join(' - ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button for Individual Item */}
                      {filter === 'PENDING' ? (
                        <button
                          onClick={() => handleMarkItemStatus(ticket.tabId, item, 'READY')}
                          className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center justify-center active:scale-95 transition-all shrink-0"
                          title="Pronto"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      ) : ticket.isClosedSale ? (
                        <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-[8px] font-black uppercase tracking-widest border border-slate-200/50 dark:border-slate-800 shrink-0 select-none">
                          Fechada 🔒
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkItemStatus(ticket.tabId, item, 'PENDING')}
                          className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all shrink-0 text-slate-600 dark:text-slate-300"
                          title="Voltar para a fila"
                        >
                          Desfazer
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ticket Footer Action */}
                {filter === 'PENDING' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleMarkAllTicketReady(ticket.tabId, ticket.items)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pronto Todos ({ticket.items.length})
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductionMonitor;
