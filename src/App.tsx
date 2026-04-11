import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, PRODUCT_ID_DEBT_SETTLEMENT, formatCurrency } from './types';

// Shared Components
import Sidebar from './shared/ui/Sidebar';
import Dashboard from './features/dashboard/Dashboard';
import POS from './features/pos/POS';
import ProductList from './features/products/ProductList';
import SalesHistory from './features/dashboard/SalesHistory';
import Reports from './features/reports/Reports';
import UserManagement from './features/auth/UserManagement';
import ShiftControl from './features/finance/ShiftControl';
import CashManagement from './features/finance/CashManagement';
import Inventory from './features/inventory/Inventory';
import Settings from './features/settings/Settings';
import Help from './features/help/Help';
import Login from './features/auth/Login';
import FeedbackModal from './shared/ui/FeedbackModal';
import ConfirmationModal from './shared/ui/ConfirmationModal';
import LoadingScreen from './shared/ui/LoadingScreen';

// New Modular Components & Hooks
import { FirebaseGuard } from './shared/ui/FirebaseGuard';
import { UnitSelector } from './features/auth/UnitSelector';
import { AppHeader } from './shared/ui/AppHeader';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useAppStore } from './hooks/useAppStore';
import { LandingPage } from './features/landing/LandingPage';
import { LandingPage2 } from './features/landing/LandingPage2';
import FranchiseDashboard from './features/dashboard/FranchiseDashboard';

export const App: React.FC = () => {
  // 1. App Hooks
  const { theme, setTheme } = useTheme();
  
  // To avoid prop drilling showToast everywhere, we define it here
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'info' | 'error' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const [activeView, setActiveView] = useState<View>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [shortcutCheckout, setShortcutCheckout] = useState<{ name: string; amount: number } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Modal de Confirmação Global
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void;
    isDanger?: boolean; confirmLabel?: string; cancelLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  // 2. Data Store & Auth
  const { currentUser, setCurrentUser, currentUserRef, loginError, handleLogin, logout, syncCurrentUser } = useAuth();
  const store = useAppStore({ currentUser, currentUserRef, showToast });

  useEffect(() => {
    syncCurrentUser(store.users);
  }, [store.users, syncCurrentUser]);
  
  const activeUnitName = useMemo(() => 
    store.units.find(u => u.id === store.validatedActiveUnitId)?.name || 'Bar',
  [store.units, store.validatedActiveUnitId]);

  const isShiftOpen = useMemo(() => 
    Array.isArray(store.shifts) && store.shifts.some(s => s.status === 'open'), 
  [store.shifts]);

  const totalPendura = useMemo(() => {
    return store.sales.reduce((acc, s) => {
      if (s.deleted) return acc;
      let debit = 0;
      if (s.paymentMethod === 'Pendura') debit = s.total;
      if (s.payments) { const pPart = s.payments.find(p => p.method === 'Pendura'); if (pPart) debit = pPart.amount; }
      if (s.items?.some(i => i.productId === PRODUCT_ID_DEBT_SETTLEMENT)) debit -= s.total;
      return acc + debit;
    }, 0);
  }, [store.sales]);

  // Handlers
  const requestLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Vai abandonar o barco?',
      message: 'O bar vai sentir sua falta. Tem certeza que quer sair agora?',
      onConfirm: () => {
        store.handleSwitchUnit();
        logout();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmLabel: 'Passar a Régua',
      cancelLabel: 'Pedir a Saideira',
      isDanger: true
    });
  };

  // Guardas de Roteamento/Estado
  if (window.location.pathname.startsWith('/landing2')) return <LandingPage2 />;
  if (window.location.pathname.startsWith('/landing')) return <LandingPage />;
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return <FirebaseGuard />;
  if (!currentUser) return <Login onLogin={(u, p) => handleLogin(u, p, store.users)} isLoading={store.dbStatus === 'loading' && store.users.length === 0} error={loginError} />;
  
  if (!store.validatedActiveUnitId) {
    return (
      <UnitSelector 
        visibleUnits={store.visibleUnits} 
        franchises={store.franchises}
        onSelectUnit={(id) => { store.setRawActiveUnitId(id); store.setDbStatus('loading'); }} 
        requestLogout={requestLogout}
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
      />
    );
  }

  if (store.dbStatus === 'loading' && store.products.length === 0) return <LoadingScreen message="Conectando ao Bar..." />;

  const renderActiveView = () => {
    switch (activeView) {
      case 'pos': return <POS products={store.products} modifierGroups={store.modifierGroups} categoryModifiers={store.categoryModifiers} openTabs={store.openTabs} onSaveTab={store.handleSaveTab} onUpdateTabItem={store.handleUpdateTabItem} onDeleteTab={store.handleDeleteTab} onCompleteSale={store.handleCompleteSale} activeShift={store.shifts.find(s => s.status === 'open')} onViewChange={setActiveView} penduraThreshold={store.penduraThreshold} longDurationThreshold={store.longDurationThreshold} dbStatus={store.dbStatus} shortcutCheckout={shortcutCheckout} onClearShortcut={() => setShortcutCheckout(null)} stockTransactions={store.stockTransactions} />;
      case 'products': return <ProductList products={store.products} setProducts={store.handleUpdateProducts} modifierGroups={store.modifierGroups} setModifierGroups={store.setModifierGroups} categoryModifiers={store.categoryModifiers} setCategoryModifiers={store.handleUpdateCategoryModifiers} categories={store.categories} setCategories={store.setCategories} openTabs={store.openTabs} onSaveTab={store.handleSaveTab} currentUser={currentUser} />;
      case 'shifts': return <ShiftControl shifts={store.shifts} onUpdateShifts={store.handleUpdateShifts} currentUser={currentUser} sales={store.sales} activeTabsCount={store.openTabs.length} />;
      case 'cash': return <CashManagement shifts={store.shifts} onUpdateShifts={store.handleUpdateShifts} sales={store.sales} currentUser={currentUser} onViewChange={setActiveView} />;
      case 'users': return <UserManagement users={store.users} units={store.units} onUpdateUsers={store.handleUpdateUsers} />;
      case 'franchise_dashboard': return <FranchiseDashboard units={store.units} franchises={store.franchises} currentUser={currentUser} syncConfig={store.syncConfig} />;
      case 'dashboard': return <Dashboard sales={store.sales} products={store.products} users={store.users} theme={theme} />;
      case 'history': return <SalesHistory sales={store.sales} onDeleteSale={(id) => { const s = store.sales.find(x => x.id === id); if (s) { const ns = { ...s, deleted: true, deletedAt: Date.now(), deletedBy: currentUser.id }; store.persist('sales', ns, id); store.setSales(prev => { const next = prev.map(x => x.id === id ? ns : x); store.saveLocalCache('sales', next); return next; }); store.addAuditLog('SALE_DELETE', `Venda anulada ID: ${id}`); } }} users={store.users} currentUser={currentUser} activeUnitId={store.validatedActiveUnitId} syncConfig={store.syncConfig} />;
      case 'reports': return <Reports sales={store.sales} products={store.products} users={store.users} shifts={store.shifts} auditLogs={store.auditLogs} stockTransactions={store.stockTransactions} currentUser={currentUser} onQuitarPendura={(name, amt) => { setShortcutCheckout({ name, amount: amt }); setActiveView('pos'); }} penduraThreshold={store.penduraThreshold} activeUnitId={store.validatedActiveUnitId} syncConfig={store.syncConfig} theme={theme} />;
      case 'inventory': return <Inventory products={store.products} stockTransactions={store.stockTransactions} onUpdateStock={store.handleUpdateStock} currentUser={currentUser} activeUnitId={store.validatedActiveUnitId} />;
      case 'settings': return <Settings products={store.products} sales={store.sales} openTabs={store.openTabs} users={store.users} shifts={store.shifts} units={store.units} onUpdateUnits={store.handleUpdateUnits} onImport={store.handleDataManagement} dbStatus={store.dbStatus} currentUser={currentUser} penduraThreshold={store.penduraThreshold} setPenduraThreshold={store.setPenduraThreshold} longDurationThreshold={store.longDurationThreshold} setLongDurationThreshold={store.setLongDurationThreshold} />;
      case 'help': return <Help />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden">
      <Sidebar 
        activeView={activeView} onViewChange={setActiveView} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} 
        currentUser={currentUser} onLogout={requestLogout} onSwitchUnit={store.handleSwitchUnit} isShiftOpen={isShiftOpen} 
        activeTabsCount={store.openTabs.length} totalPendura={totalPendura} penduraThreshold={store.penduraThreshold} 
        isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        dbStatus={store.dbStatus} isOnline={navigator.onLine} theme={theme} 
      />

      <main className={`flex-1 flex flex-col min-w-0 h-full relative overflow-hidden transition-all ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <AppHeader 
          setIsSidebarOpen={setIsSidebarOpen} activeUnitName={activeUnitName} visibleUnits={store.visibleUnits} 
          handleSwitchUnit={store.handleSwitchUnit} setStatusModalOpen={setStatusModalOpen} 
          dbStatus={store.dbStatus} serverHealth={store.serverHealth} theme={theme} setTheme={setTheme} 
          setFeedbackOpen={setFeedbackOpen} 
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-10 w-full max-w-[1750px] mx-auto">
          {renderActiveView()}
        </div>

        {statusModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setStatusModalOpen(false)} />
            <div className="bg-white dark:bg-slate-900 w-full max-sm:rounded-[40px] sm:max-w-sm sm:rounded-[40px] p-10 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-center">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-8 italic tracking-tighter leading-none">Diagnóstico de Saúde</h3>
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Servidor Botequista</p>
                  <span className={`w-3 h-3 rounded-full ${store.serverHealth === 'ok' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Banco de Dados</p>
                  <span className={`w-3 h-3 rounded-full ${store.dbStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rede Local</p>
                  <span className={`w-3 h-3 rounded-full ${navigator.onLine ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                </div>
              </div>
              {store.lastSyncTime && <p className="mt-8 text-[9px] font-black text-slate-400 uppercase italic">Última Resposta: {new Date(store.lastSyncTime).toLocaleTimeString()}</p>}
              <button onClick={() => setStatusModalOpen(false)} className="mt-8 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Fechar Diagnóstico</button>
            </div>
          </div>
        )}
      </main>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} currentUser={currentUser?.username || ''} activeView={activeView} />

      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[9999] px-8 py-4 rounded-full font-black uppercase text-[10px] shadow-2xl animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
          {toast.type === 'error' && <span className="mr-2">⚠️</span>}
          {toast.msg}
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message}
        onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger} confirmLabel={confirmModal.confirmLabel} cancelLabel={confirmModal.cancelLabel}
      />
    </div>
  );
};
