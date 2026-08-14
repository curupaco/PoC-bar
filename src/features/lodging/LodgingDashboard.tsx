import React, { useState, useEffect, useMemo } from 'react';
import { RoomState, Tab, Unit, User, SaleItem, generateUniqueId, formatCurrency, RoomHistoryRecord } from '../../types';

interface LodgingDashboardProps {
  rooms: RoomState[];
  onUpdateRooms: (updater: any) => void;
  onUpdateRoom: (room: RoomState) => void;
  roomHistory?: RoomHistoryRecord[];
  onSaveRoomHistoryRecord?: (record: RoomHistoryRecord) => void;
  openTabs: Tab[];
  onSaveTab: (tab: Tab) => Promise<any>;
  activeUnit: Unit | undefined;
  currentUser: User;
  showToast: (msg: string, type?: 'info' | 'error') => void;
}

export const calculateBilledBlocks = (elapsed: number, increment: number, grace: number): number => {
  const fullBlocks = Math.floor(elapsed / increment);
  const remainder = elapsed % increment;
  let billedBlocks = fullBlocks;
  if (remainder > grace) {
    billedBlocks += 1;
  }
  return Math.max(1, billedBlocks);
};

const formatDuration = (ms: number) => {
  if (ms < 0) ms = 0;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const LodgingDashboard: React.FC<LodgingDashboardProps> = ({
  rooms,
  onUpdateRooms,
  onUpdateRoom,
  roomHistory = [],
  onSaveRoomHistoryRecord,
  openTabs,
  onSaveTab,
  activeUnit,
  currentUser,
  showToast
}) => {
  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'QUARTOS' | 'HISTORICO'>('QUARTOS');
  const [filter, setFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'CLEANING'>('ALL');
  
  // Modals state
  const [checkInModal, setCheckInModal] = useState<{ isOpen: boolean; room: RoomState | null }>({ isOpen: false, room: null });
  const [addTimeModal, setAddTimeModal] = useState<{ isOpen: boolean; room: RoomState | null }>({ isOpen: false, room: null });
  const [checkOutModal, setCheckOutModal] = useState<{ isOpen: boolean; room: RoomState | null }>({ isOpen: false, room: null });

  // Form states
  const [selectedTabId, setSelectedTabId] = useState<string>('');
  const [newTabName, setNewTabName] = useState<string>('');
  const [checkInType, setCheckInType] = useState<'FREE' | 'LIMIT'>('FREE');
  const [selectedPills, setSelectedPills] = useState<number>(1);
  const [checkInNotes, setCheckInNotes] = useState<string>('');

  const [addPillsCount, setAddPillsCount] = useState<number>(1);

  // Trigger tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const lodgingBillingIncrementMinutes = activeUnit?.lodgingBillingIncrementMinutes || 30;
  const roomPricePerIncrement = activeUnit?.roomPricePerIncrement || 30;
  const lodgingGracePeriodMinutes = activeUnit?.lodgingGracePeriodMinutes !== undefined ? activeUnit.lodgingGracePeriodMinutes : 5;
  const lodgingLimitWarningMinutes = activeUnit?.lodgingLimitWarningMinutes !== undefined ? activeUnit.lodgingLimitWarningMinutes : 10;
  const lodgingFreeWarningMinutes = activeUnit?.lodgingFreeWarningMinutes !== undefined ? activeUnit.lodgingFreeWarningMinutes : 5;

  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      if (filter === 'ALL') return true;
      return r.status === filter;
    });
  }, [rooms, filter]);

  const stats = useMemo(() => {
    return {
      total: rooms.length,
      available: rooms.filter(r => r.status === 'AVAILABLE').length,
      occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
      cleaning: rooms.filter(r => r.status === 'CLEANING').length,
    };
  }, [rooms]);

  const handleOpenCheckIn = (room: RoomState) => {
    setSelectedTabId('');
    setNewTabName('');
    setCheckInType('FREE');
    setSelectedPills(1);
    setCheckInNotes('');
    setCheckInModal({ isOpen: true, room });
  };

  const handleConfirmCheckIn = async () => {
    if (!checkInModal.room) return;
    const room = checkInModal.room;

    let targetTabId = selectedTabId;
    if (!targetTabId) {
      if (!newTabName.trim()) {
        showToast("Selecione uma comanda existente ou crie uma nova com um nome.", "error");
        return;
      }
      // Create new tab
      const newTab: Tab = {
        id: `tab-${generateUniqueId()}`,
        name: newTabName.trim(),
        items: [],
        openedAt: Date.now()
      };
      try {
        await onSaveTab(newTab);
        targetTabId = newTab.id;
      } catch (e) {
        showToast("Falha ao criar comanda.", "error");
        return;
      }
    }

    const timeLimitMinutes = checkInType === 'LIMIT' ? selectedPills * lodgingBillingIncrementMinutes : undefined;

    const updatedRoom: RoomState = {
      ...room,
      status: 'OCCUPIED',
      lastStatusChangedAt: Date.now(),
      openedAt: Date.now(),
      tabId: targetTabId,
      timeLimitMinutes,
      additionalMinutes: 0,
      notes: checkInNotes.trim() || undefined
    };

    onUpdateRoom(updatedRoom);
    setCheckInModal({ isOpen: false, room: null });
    showToast(`${room.name} ocupado com sucesso!`);
  };

  const handleOpenAddTime = (room: RoomState) => {
    setAddPillsCount(1);
    setAddTimeModal({ isOpen: true, room });
  };

  const handleConfirmAddTime = () => {
    if (!addTimeModal.room) return;
    const room = addTimeModal.room;
    const minutesToAdd = addPillsCount * lodgingBillingIncrementMinutes;
    
    const updatedRoom: RoomState = {
      ...room,
      additionalMinutes: (room.additionalMinutes || 0) + minutesToAdd
    };

    onUpdateRoom(updatedRoom);
    setAddTimeModal({ isOpen: false, room: null });
    showToast(`Adicionado +${minutesToAdd} min ao ${room.name}!`);
  };

  const handleOpenCheckOut = (room: RoomState) => {
    setCheckOutModal({ isOpen: true, room });
  };

  const handleConfirmCheckOut = async () => {
    if (!checkOutModal.room) return;
    const room = checkOutModal.room;

    if (!room.openedAt || !room.tabId) return;

    // Calculate billing details
    const elapsedMinutes = Math.max(1, Math.floor((Date.now() - room.openedAt) / 60000));
    const totalLimit = (room.timeLimitMinutes || 0) + (room.additionalMinutes || 0);

    let billedBlocks = 1;
    if (totalLimit > 0) {
      const limitBlocks = Math.ceil(totalLimit / lodgingBillingIncrementMinutes);
      if (elapsedMinutes <= totalLimit + lodgingGracePeriodMinutes) {
        billedBlocks = limitBlocks;
      } else {
        billedBlocks = calculateBilledBlocks(elapsedMinutes, lodgingBillingIncrementMinutes, lodgingGracePeriodMinutes);
      }
    } else {
      billedBlocks = calculateBilledBlocks(elapsedMinutes, lodgingBillingIncrementMinutes, lodgingGracePeriodMinutes);
    }

    const finalPrice = billedBlocks * roomPricePerIncrement;

    const targetTab = openTabs.find(t => t.id === room.tabId);
    
    // Registrar início de histórico de limpeza
    const newHistoryRecord: RoomHistoryRecord = {
      id: `history-${generateUniqueId()}`,
      roomId: room.id,
      roomName: room.name,
      tabId: room.tabId,
      tabName: targetTab?.name || 'Comanda Sem Nome',
      openedAt: room.openedAt,
      closedAt: Date.now(),
      stayDurationMinutes: elapsedMinutes,
      stayAmount: finalPrice,
      cleaningStartedAt: Date.now(),
      cleaningFinishedAt: 0,
      cleaningDurationMinutes: 0,
      userId: currentUser.id,
      unitId: activeUnit?.id || 'GLOBAL'
    };

    if (onSaveRoomHistoryRecord) {
      onSaveRoomHistoryRecord(newHistoryRecord);
    }

    // Lançar cobrança na comanda
    if (targetTab) {
      const chargeItem: SaleItem = {
        id: `item-${generateUniqueId()}`,
        productId: 'lodging_stay_service',
        productName: `Estadia - ${room.name}`,
        quantity: 1,
        unitPrice: finalPrice,
        totalPrice: finalPrice,
        productionStatus: 'READY'
      };

      const updatedTab: Tab = {
        ...targetTab,
        items: [...targetTab.items, chargeItem],
        lastItemAddedAt: Date.now()
      };

      try {
        await onSaveTab(updatedTab);
        showToast("Cobrança de estadia lançada na comanda!");
      } catch (e) {
        showToast("Falha ao lançar cobrança na comanda.", "error");
        return;
      }
    } else {
      showToast("Comanda vinculada não encontrada, mas o quarto foi liberado.", "error");
    }

    // Set room to cleaning
    const updatedRoom: RoomState = {
      ...room,
      status: 'CLEANING',
      lastStatusChangedAt: Date.now(),
      openedAt: undefined,
      tabId: undefined,
      timeLimitMinutes: undefined,
      additionalMinutes: undefined,
      notes: undefined
    };

    onUpdateRoom(updatedRoom);
    setCheckOutModal({ isOpen: false, room: null });
  };

  const handleFinishCleaning = (room: RoomState) => {
    // Buscar o histórico inacabado para este quarto
    const unfinishedRecord = roomHistory.find(h => h.roomId === room.id && h.cleaningFinishedAt === 0);
    if (unfinishedRecord && onSaveRoomHistoryRecord) {
      const finishedRecord: RoomHistoryRecord = {
        ...unfinishedRecord,
        cleaningFinishedAt: Date.now(),
        cleaningDurationMinutes: Math.max(1, Math.floor((Date.now() - unfinishedRecord.cleaningStartedAt) / 60000))
      };
      onSaveRoomHistoryRecord(finishedRecord);
    }

    const updatedRoom: RoomState = {
      ...room,
      status: 'AVAILABLE',
      lastStatusChangedAt: Date.now(),
      openedAt: undefined,
      tabId: undefined,
      timeLimitMinutes: undefined,
      additionalMinutes: undefined,
      notes: undefined
    };
    onUpdateRoom(updatedRoom);
    showToast(`${room.name} limpo e disponível!`);
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header com Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Painel de Hospedaria</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status e faturamento de quartos em tempo real</p>
        </div>

        {/* Abas Principais */}
        <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
          <button
            onClick={() => setActiveTab('QUARTOS')}
            className={`px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'QUARTOS' ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'}`}
          >
            Quartos
          </button>
          <button
            onClick={() => setActiveTab('HISTORICO')}
            className={`px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'HISTORICO' ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'}`}
          >
            Histórico ({roomHistory.length})
          </button>
        </div>
      </div>

      {activeTab === 'QUARTOS' ? (
        <>
          {/* Estatísticas Rápidas */}
          <div className="flex flex-wrap gap-3 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Filtrar por Status:</span>
            <button 
              onClick={() => setFilter('ALL')} 
              className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${filter === 'ALL' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700'}`}
            >
              Todos ({stats.total})
            </button>
            <button 
              onClick={() => setFilter('AVAILABLE')} 
              className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-1.5 ${filter === 'AVAILABLE' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 hover:bg-emerald-100'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Disponível ({stats.available})
            </button>
            <button 
              onClick={() => setFilter('OCCUPIED')} 
              className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-1.5 ${filter === 'OCCUPIED' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 hover:bg-indigo-100'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Ocupado ({stats.occupied})
            </button>
            <button 
              onClick={() => setFilter('CLEANING')} 
              className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-1.5 ${filter === 'CLEANING' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500 hover:bg-amber-100'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Limpeza ({stats.cleaning})
            </button>
          </div>

          {/* Grid de Quartos */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-20 text-center shadow-sm">
          <p className="text-sm font-black uppercase text-slate-400 tracking-[0.2em]">Nenhum quarto encontrado</p>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-2">Ative ou ajuste a quantidade nas configurações</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map(room => {
            const isOccupied = room.status === 'OCCUPIED';
            const isCleaning = room.status === 'CLEANING';
            const isAvailable = room.status === 'AVAILABLE';

            // Calculate timing for occupied rooms
            let elapsedMinutes = 0;
            let totalLimitMinutes = 0;
            let timeLeftMs = 0;
            let isOvertime = false;
            let isEndingSoon = false;
            let progress = 0;
            let currentBilledPrice = 0;
            let currentBilledPills = 1;
            let timeToNextPillMin = 0;
            let warnNextPill = false;

            if (isOccupied && room.openedAt) {
              elapsedMinutes = Math.max(1, Math.floor((Date.now() - room.openedAt) / 60000));
              totalLimitMinutes = (room.timeLimitMinutes || 0) + (room.additionalMinutes || 0);

              if (totalLimitMinutes > 0) {
                const totalLimitMs = totalLimitMinutes * 60000;
                timeLeftMs = (room.openedAt + totalLimitMs) - Date.now();
                isOvertime = timeLeftMs <= 0;
                isEndingSoon = !isOvertime && timeLeftMs <= lodgingLimitWarningMinutes * 60000; // Warning minutes or less
                progress = Math.min(100, ( (Date.now() - room.openedAt) / totalLimitMs ) * 100);

                // For limits, if overtime, we add excess to the price calculation
                if (isOvertime) {
                  currentBilledPills = calculateBilledBlocks(elapsedMinutes, lodgingBillingIncrementMinutes, lodgingGracePeriodMinutes);
                } else {
                  currentBilledPills = Math.ceil(totalLimitMinutes / lodgingBillingIncrementMinutes);
                }
              } else {
                // Free time calculation
                currentBilledPills = calculateBilledBlocks(elapsedMinutes, lodgingBillingIncrementMinutes, lodgingGracePeriodMinutes);
                
                const timeInCurrentPill = elapsedMinutes % lodgingBillingIncrementMinutes;
                timeToNextPillMin = lodgingBillingIncrementMinutes - timeInCurrentPill;
                
                // Warn X minutes before charging next pill
                warnNextPill = timeToNextPillMin <= lodgingFreeWarningMinutes && timeInCurrentPill > lodgingGracePeriodMinutes;
              }

              currentBilledPrice = currentBilledPills * roomPricePerIncrement;
            }

            // Cleaning elapsed time
            let cleaningDurationStr = '';
            if (isCleaning && room.lastStatusChangedAt) {
              cleaningDurationStr = formatDuration(Date.now() - room.lastStatusChangedAt);
            }

            // Dynamic border and background animations
            let cardClass = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm";
            if (isOccupied) {
              if (isOvertime) {
                cardClass = "bg-red-50/50 dark:bg-red-950/20 border-red-500 shadow-lg shadow-red-500/5 animate-pulse";
              } else if (isEndingSoon || warnNextPill) {
                cardClass = "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 shadow-lg shadow-amber-500/5";
              } else {
                cardClass = "bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-500 shadow-sm";
              }
            } else if (isCleaning) {
              cardClass = "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800 opacity-90";
            }

            return (
              <div key={room.id} className={`rounded-[32px] p-6 flex flex-col justify-between transition-all duration-300 ${cardClass} relative overflow-hidden group hover:scale-[1.01] hover:shadow-md`}>
                <div>
                  {/* Status header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black uppercase text-base text-slate-800 dark:text-white tracking-tight">{room.name}</h4>
                      {isOccupied && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {openTabs.find(t => t.id === room.tabId)?.name || 'Comanda Sem Nome'}
                        </p>
                      )}
                    </div>
                    
                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      isAvailable ? 'bg-emerald-100 text-emerald-700' :
                      isOccupied ? (isOvertime ? 'bg-red-100 text-red-700' : (isEndingSoon || warnNextPill ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700')) :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {isAvailable ? 'Livre' : isOccupied ? 'Ocupado' : 'Limpeza'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-4 my-2 min-h-[100px] flex flex-col justify-center">
                    {isAvailable && (
                      <div className="text-center py-4">
                        <span className="text-3xl select-none">🔑</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Pronto para Hospedar</p>
                      </div>
                    )}

                    {isOccupied && room.openedAt && (
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entrada</p>
                            <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              {new Date(room.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Decorrido</p>
                            <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              {formatDuration(Date.now() - room.openedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar or Countdown for limits */}
                        {totalLimitMinutes > 0 ? (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                              <span className="text-slate-400">Limite: {totalLimitMinutes} min</span>
                              <span className={isOvertime ? 'text-red-500' : 'text-slate-400'}>
                                {isOvertime ? `Excedido: ${formatDuration(Math.abs(timeLeftMs))}` : `Faltam: ${formatDuration(timeLeftMs)}`}
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${isOvertime ? 'bg-red-500' : isEndingSoon ? 'bg-amber-500 animate-pulse' : 'bg-indigo-600'}`} 
                                style={{ width: `${progress}%` }} 
                              />
                            </div>
                          </div>
                        ) : (
                          // Tempo Livre Info
                          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                            <span className="text-slate-400">Tempo Livre</span>
                            {warnNextPill ? (
                              <span className="text-amber-500 animate-pulse">Próx. pílula em {timeToNextPillMin} min</span>
                            ) : (
                              <span className="text-slate-400">Próx. pílula em {timeToNextPillMin} min</span>
                            )}
                          </div>
                        )}

                        {/* Faturamento Parcial */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acumulado ({currentBilledPills} {currentBilledPills === 1 ? 'bloco' : 'blocos'})</span>
                          <span className="text-sm font-black text-slate-800 dark:text-white italic">R$ {currentBilledPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {isCleaning && (
                      <div className="text-center py-4 space-y-2">
                        <span className="text-3xl select-none animate-spin inline-block">🧹</span>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Higienização em Andamento</p>
                          <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-1">{cleaningDurationStr}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  {isAvailable && (
                    <button 
                      onClick={() => handleOpenCheckIn(room)}
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md"
                    >
                      Check-in
                    </button>
                  )}

                  {isOccupied && (
                    <>
                      <button 
                        onClick={() => handleOpenAddTime(room)}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        + Tempo
                      </button>
                      <button 
                        onClick={() => handleOpenCheckOut(room)}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
                      >
                        Check-out
                      </button>
                    </>
                  )}

                  {isCleaning && (
                    <button 
                      onClick={() => handleFinishCleaning(room)}
                      className="w-full bg-amber-500 text-slate-950 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 active:scale-95 transition-all shadow-md"
                    >
                      Liberar Quarto
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      ) : (
        /* Aba de Histórico */
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <div>
            <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight italic">Registros de Hospedagem & Limpeza</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Histórico completo de estadias passadas e tempos de arrumação</p>
          </div>

          {roomHistory.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
              <span className="text-4xl select-none">📋</span>
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest mt-4">Nenhum registro no histórico</p>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">Realize check-outs e finalizações de limpeza para ver os dados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 font-sans">Quarto</th>
                    <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 font-sans">Comanda</th>
                    <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 font-sans">Período de Hospedagem</th>
                    <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center font-sans">Duração Estadia</th>
                    <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right font-sans">Valor Pago</th>
                    <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center font-sans">Duração Limpeza</th>
                    <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 font-sans">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {[...roomHistory].sort((a, b) => b.closedAt - a.closedAt).map((record) => {
                    const cleaningDone = record.cleaningFinishedAt > 0;
                    
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="py-4 text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{record.roomName}</td>
                        <td className="py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{record.tabName}</td>
                        <td className="py-4 text-xs text-slate-600 dark:text-slate-400 font-mono">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {new Date(record.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {" às "}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {new Date(record.closedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                            {new Date(record.closedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="py-4 text-xs font-mono font-bold text-center text-slate-700 dark:text-slate-300">
                          {record.stayDurationMinutes} min
                        </td>
                        <td className="py-4 text-xs font-mono font-black text-right text-slate-800 dark:text-white">
                          {formatCurrency(record.stayAmount)}
                        </td>
                        <td className="py-4 text-xs font-mono font-bold text-center text-slate-700 dark:text-slate-300">
                          {cleaningDone ? `${record.cleaningDurationMinutes} min` : (
                            <span className="text-amber-500 animate-pulse font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                              Em limpeza
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${cleaningDone ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {cleaningDone ? 'Finalizado' : 'Faxina'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CHECK-IN */}
      {checkInModal.isOpen && checkInModal.room && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" onClick={() => setCheckInModal({ isOpen: false, room: null })} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Check-in {checkInModal.room.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Selecione o cliente e tipo de estadia</p>
              </div>
              <button onClick={() => setCheckInModal({ isOpen: false, room: null })} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold hover:bg-red-500 hover:text-white transition-all">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Comanda Picker */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular Comanda Existente</label>
                <select 
                  value={selectedTabId} 
                  onChange={e => {
                    setSelectedTabId(e.target.value);
                    if (e.target.value) setNewTabName('');
                  }}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Criar Nova Comanda (digite abaixo) --</option>
                  {openTabs.map(tab => (
                    <option key={tab.id} value={tab.id}>{tab.name}</option>
                  ))}
                </select>
              </div>

              {!selectedTabId && (
                <div className="space-y-2 animate-in fade-in">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Nova Comanda</label>
                  <input 
                    type="text" 
                    value={newTabName}
                    onChange={e => setNewTabName(e.target.value)}
                    placeholder="Ex: Quarto 5 - Carlos"
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Mode Select */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Cobrança</label>
                <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <button 
                    onClick={() => setCheckInType('FREE')}
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${checkInType === 'FREE' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
                  >
                    Tempo Livre
                  </button>
                  <button 
                    onClick={() => setCheckInType('LIMIT')}
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${checkInType === 'LIMIT' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
                  >
                    Pacote Fechado
                  </button>
                </div>
              </div>

              {/* Pill Count for Limit mode */}
              {checkInType === 'LIMIT' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pacote de Estadia</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(pills => (
                      <button
                        key={pills}
                        type="button"
                        onClick={() => setSelectedPills(pills)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedPills === pills ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 border-transparent dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
                      >
                        <p className="font-black text-[10px] uppercase tracking-wider">{pills} {pills === 1 ? 'Pílula' : 'Pílulas'}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{pills * lodgingBillingIncrementMinutes} min • R$ {(pills * roomPricePerIncrement).toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações (Opcional)</label>
                <textarea 
                  value={checkInNotes}
                  onChange={e => setCheckInNotes(e.target.value)}
                  placeholder="Ex: Hóspede solicitou toalha extra"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium text-xs outline-none focus:ring-2 focus:ring-emerald-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button 
                onClick={() => setCheckInModal({ isOpen: false, room: null })}
                className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmCheckIn}
                className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 shadow-lg transition-all"
              >
                Confirmar Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD TIME */}
      {addTimeModal.isOpen && addTimeModal.room && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" onClick={() => setAddTimeModal({ isOpen: false, room: null })} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Adicionar Tempo - {addTimeModal.room.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Estenda o limite da estadia</p>
              </div>
              <button onClick={() => setAddTimeModal({ isOpen: false, room: null })} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold hover:bg-red-500 hover:text-white transition-all">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione a quantidade de blocos</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(pills => (
                  <button
                    key={pills}
                    type="button"
                    onClick={() => setAddPillsCount(pills)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${addPillsCount === pills ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400' : 'bg-slate-50 border-transparent dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
                  >
                    <p className="font-black text-sm">+{pills}</p>
                    <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">+{pills * lodgingBillingIncrementMinutes} min</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button 
                onClick={() => setAddTimeModal({ isOpen: false, room: null })}
                className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmAddTime}
                className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-lg transition-all"
              >
                Adicionar Tempo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHECK-OUT / COBRANÇA */}
      {checkOutModal.isOpen && checkOutModal.room && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" onClick={() => setCheckOutModal({ isOpen: false, room: null })} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Check-out {checkOutModal.room.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Confirmação de liberação e faturamento</p>
              </div>
              <button onClick={() => setCheckOutModal({ isOpen: false, room: null })} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold hover:bg-red-500 hover:text-white transition-all">✕</button>
            </div>

            {checkOutModal.room.openedAt && (
              <div className="p-6 space-y-6">
                {/* Stay Summary Card */}
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-850 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comanda Vinculada</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      {openTabs.find(t => t.id === checkOutModal.room.tabId)?.name || 'Desconhecida'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário de Entrada</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {new Date(checkOutModal.room.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário de Saída</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duração Total</span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {Math.max(1, Math.floor((Date.now() - checkOutModal.room.openedAt) / 60000))} minutos
                    </span>
                  </div>
                </div>

                {/* Calculation Breakdown */}
                {(() => {
                  const elapsed = Math.max(1, Math.floor((Date.now() - checkOutModal.room.openedAt) / 60000));
                  const totalLimit = (checkOutModal.room.timeLimitMinutes || 0) + (checkOutModal.room.additionalMinutes || 0);

                  let billedBlocks = 1;
                  let formulaDesc = '';
                  let graceApplied = false;

                  if (totalLimit > 0) {
                    const limitBlocks = Math.ceil(totalLimit / lodgingBillingIncrementMinutes);
                    if (elapsed <= totalLimit + lodgingGracePeriodMinutes) {
                      billedBlocks = limitBlocks;
                      formulaDesc = `Pacote fechado de ${totalLimit} min.`;
                      if (elapsed > totalLimit) graceApplied = true;
                    } else {
                      billedBlocks = calculateBilledBlocks(elapsed, lodgingBillingIncrementMinutes, lodgingGracePeriodMinutes);
                      formulaDesc = `Excedeu limite de ${totalLimit} min. Cobrança total por pílula decorrida.`;
                      const remainder = elapsed % lodgingBillingIncrementMinutes;
                      if (remainder > 0 && remainder <= lodgingGracePeriodMinutes) graceApplied = true;
                    }
                  } else {
                    billedBlocks = calculateBilledBlocks(elapsed, lodgingBillingIncrementMinutes, lodgingGracePeriodMinutes);
                    formulaDesc = `Tempo livre.`;
                    const remainder = elapsed % lodgingBillingIncrementMinutes;
                    if (remainder > 0 && remainder <= lodgingGracePeriodMinutes) graceApplied = true;
                  }

                  const finalPrice = billedBlocks * roomPricePerIncrement;

                  return (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-500/20 rounded-2xl space-y-1">
                        <h4 className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Detalhamento do Cálculo</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                          {formulaDesc} Venda em pílulas de {lodgingBillingIncrementMinutes} min a R$ {roomPricePerIncrement.toFixed(2)} cada.
                          {graceApplied && (
                            <span className="block mt-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              ✓ Tolerância de {lodgingGracePeriodMinutes} min aplicada (tempo excedente perdoado!).
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor da Estadia</p>
                          <p className="text-[9px] text-slate-400 font-bold">{billedBlocks} {billedBlocks === 1 ? 'pílula cobrada' : 'pílulas cobradas'}</p>
                        </div>
                        <span className="text-2xl font-black italic">R$ {finalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button 
                onClick={() => setCheckOutModal({ isOpen: false, room: null })}
                className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmCheckOut}
                className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-lg transition-all"
              >
                Cobrar & Limpeza
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LodgingDashboard;
