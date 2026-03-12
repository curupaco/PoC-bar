import React, { useState, useRef } from 'react';
import { User, UserPermission, Unit } from '../../types';
import { hashPassword } from '../../services/cryptoService';
import { validateItemName } from '../../utils/wordValidator';

interface UserManagementProps {
  users: User[];
  units?: Unit[]; // Opcional para manter compatibilidade se units não carregar
  onUpdateUsers: (users: User[], changedItem?: User) => void;
}

interface PermissionGroup {
  title: string;
  color: string;
  permissions: { id: UserPermission; label: string; desc: string }[];
}

const PERMISSION_STRUCTURE: PermissionGroup[] = [
  {
    title: 'Módulos de Acesso (Sidebar)',
    color: 'blue',
    permissions: [
      { id: 'pos', label: 'Vendas (PDV)', desc: 'Visualiza o terminal de vendas e mesas.' },
      { id: 'shifts_admin', label: 'Módulo de Turnos', desc: 'Acesso à tela de controle de jornada.' },
      { id: 'cash_admin', label: 'Tesouraria', desc: 'Visualiza saldos e caixas do sistema.' },
      { id: 'dashboard', label: 'Painel Geral', desc: 'Visualiza indicadores e gráficos de performance.' },
      { id: 'history', label: 'Histórico', desc: 'Acesso à lista de vendas realizadas.' },
      { id: 'reports', label: 'Relatórios', desc: 'Acesso às métricas financeiras detalhadas.' },
      { id: 'products', label: 'Cardápio', desc: 'Visualiza a lista de produtos cadastrados.' },
      { id: 'users_admin', label: 'Gestão de Equipe', desc: 'Gerencia usuários e permissões.' },
      { id: 'settings', label: 'Ajustes', desc: 'Acesso às configurações técnicas do sistema.' },
      { id: 'help_view', label: 'Manual do Bar', desc: 'Acesso ao guia operacional.' },
    ]
  },
  {
    title: 'Operações e Fluxo de Caixa',
    color: 'emerald',
    permissions: [
      { id: 'open_shift', label: 'Abrir Turno', desc: 'Permite iniciar a operação do dia.' },
      { id: 'close_shift', label: 'Fechar Turno', desc: 'Permite encerrar o caixa e conferir valores.' },
      { id: 'clear_fiado', label: 'Baixa em Fiados', desc: 'Permite registrar o recebimento de dívidas.' },
    ]
  },
  {
    title: 'Autoridade de Inventário',
    color: 'orange',
    permissions: [
      { id: 'edit_product', label: 'Editar Cardápio', desc: 'Pode alterar nomes e preços de itens.' },
      { id: 'delete_product', label: 'Excluir Itens', desc: 'Pode remover produtos do sistema.' },
    ]
  },
  {
    title: 'Segurança e Auditoria Crítica',
    color: 'red',
    permissions: [
      { id: 'delete_sale', label: 'Anular Vendas', desc: 'Pode cancelar registros de faturamento.' },
      { id: 'export_report', label: 'Exportar Dados', desc: 'Permite salvar relatórios em PNG/PDF.' },
      { id: 'manage_units', label: 'Gestão de Franquia', desc: 'Cria e edita unidades/bares da rede.' },
      { id: 'manage_backup', label: 'Gestão de Backup', desc: 'Acesso a backups externos (GitHub).' },
      { id: 'full_reset', label: 'Reset de Fábrica', desc: 'APAGA TODOS OS DADOS DO SISTEMA.' },
    ]
  }
];

const UserManagement: React.FC<UserManagementProps> = ({ users, units = [], onUpdateUsers }) => {
  const topRef = useRef<HTMLDivElement>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<UserPermission[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setDisplayName('');
    setSelectedPerms(['pos', 'dashboard', 'help_view']);
    setSelectedUnits([]);
    setEditingUser(null);
    setIsAdding(false);
    setError(null);
  };

  const handleSave = () => {
    setError(null);
    if (!username || !password || !displayName) {
        setError("Preencha todos os campos.");
        return;
    }

    const uError = validateItemName(username.toUpperCase());
    if (uError) { setError(`Login inválido: ${uError}`); return; }

    const dError = validateItemName(displayName.toUpperCase());
    if (dError) { setError(`Nome exibição inválido: ${dError}`); return; }
    
    const finalPassword = editingUser && editingUser.password === password 
      ? password 
      : hashPassword(password);
    
    // GARANTIA: allowedUnits limpo de valores falsy e forçado para array
    const finalUnits = selectedUnits.filter(Boolean);

    const newUser: User = {
      id: editingUser?.id || `user-${Date.now()}`,
      username: username.toLowerCase().trim(),
      password: finalPassword,
      displayName: displayName.trim(),
      permissions: selectedPerms,
      allowedUnits: finalUnits
    };

    // CORREÇÃO ITEM 1: Passa o 'newUser' como segundo argumento para persistência atômica
    const newList = editingUser ? users.map(u => u.id === editingUser.id ? newUser : u) : [...users, newUser];
    onUpdateUsers(newList, newUser);
    resetForm();
  };

  const togglePerm = (perm: UserPermission) => {
    setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  const toggleUnit = (unitId: string) => {
    const idStr = String(unitId);
    setSelectedUnits(prev => {
        const set = new Set(prev.map(String));
        if (set.has(idStr)) set.delete(idStr);
        else set.add(idStr);
        return Array.from(set);
    });
  };

  const activeUnits = units.filter(u => u.isActive);

  return (
    <div ref={topRef} className="max-w-7xl mx-auto space-y-8 pb-32">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Gestão de Equipe</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Níveis de Autoridade e RBAC System</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-red-500/20 active:scale-95 text-xs uppercase tracking-[0.2em]">
            Cadastrar Colaborador
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border-4 border-red-500 shadow-2xl overflow-hidden animate-in slide-in-from-top-6 duration-500">
          <div className="p-8 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white">
              {editingUser ? 'Ajustar Privilégios' : 'Novo Perfil Operacional'}
            </h3>
            <button onClick={resetForm} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold hover:bg-red-500 hover:text-white transition-all">✕</button>
          </div>

          <div className="p-10 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ID de Login</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-red-500 outline-none font-black text-sm uppercase transition-all" placeholder="ex: pedro.caixa" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-red-500 outline-none font-black transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome no Cupom</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-red-500 outline-none font-black transition-all" placeholder="ex: Pedro Santos" />
              </div>
            </div>

            {/* SELEÇÃO DE UNIDADES (Multibar) */}
            {activeUnits.length > 0 && username !== 'admin' && (
              <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Acesso às Unidades</span>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                 </div>
                 <div className="flex flex-wrap gap-3 justify-center bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    {activeUnits.map(unit => {
                       const idStr = String(unit.id);
                       const isSelected = selectedUnits.includes(idStr);
                       return (
                         <button 
                            key={unit.id}
                            onClick={() => toggleUnit(unit.id)}
                            className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 transition-all ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}
                         >
                            {unit.name} {isSelected && '✓'}
                         </button>
                       );
                    })}
                    {selectedUnits.length === 0 && (
                        <p className="w-full text-center text-[10px] font-bold text-red-500 uppercase">⚠ Nenhuma unidade selecionada (O usuário não poderá acessar nada)</p>
                    )}
                 </div>
              </div>
            )}

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Matriz de Responsabilidades</span>
                 <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                {PERMISSION_STRUCTURE.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-6">
                    <h4 className={`text-[11px] font-black uppercase tracking-widest border-l-4 pl-3 italic
                      ${group.color === 'blue' ? 'text-blue-500 border-blue-500' : 
                        group.color === 'emerald' ? 'text-emerald-500 border-emerald-500' : 
                        group.color === 'orange' ? 'text-orange-500 border-orange-500' : 'text-red-500 border-red-500'}`}>
                      {group.title}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {group.permissions.map(p => (
                        <button 
                          key={p.id} 
                          onClick={() => togglePerm(p.id)}
                          className={`group w-full p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex items-center justify-between
                            ${selectedPerms.includes(p.id) 
                              ? 'bg-slate-50 dark:bg-slate-900 border-slate-900 dark:border-white shadow-md' 
                              : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100'}`}
                        >
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-tight ${selectedPerms.includes(p.id) ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{p.label}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5 leading-none">{p.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all 
                            ${selectedPerms.includes(p.id) ? 'bg-red-600 border-red-600 scale-110 shadow-lg' : 'border-slate-200 dark:border-slate-700'}`}>
                            {selectedPerms.includes(p.id) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <p className="text-center text-[10px] font-black text-red-500 uppercase">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-8">
              <button onClick={handleSave} className="flex-1 bg-red-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-red-600/30 hover:bg-red-700 active:scale-95 transition-all">Salvar Perfil Operacional</button>
              <button onClick={resetForm} className="px-12 bg-slate-100 dark:bg-slate-800 text-slate-500 py-6 rounded-3xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Descartar</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => {
          // Normaliza visualização das unidades permitidas (caso venha do DB como objeto)
          let userAllowed: string[] = [];
          if (Array.isArray(user.allowedUnits)) {
             userAllowed = user.allowedUnits.map(String);
          } else if (user.allowedUnits && typeof user.allowedUnits === 'object') {
             userAllowed = Object.values(user.allowedUnits).map(String);
          }

          return (
          <div key={user.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-red-500/20 transition-all flex flex-col justify-between h-64">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-slate-100 dark:bg-slate-950 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-red-600 font-black text-lg transition-colors border border-slate-200 dark:border-slate-800">
                   {user.username.slice(0, 2).toUpperCase()}
                 </div>
                 <div>
                    <h4 className="font-black text-slate-800 dark:text-white uppercase text-base tracking-tighter italic">{user.displayName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Login: @{user.username}</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => {
                    setEditingUser(user);
                    setUsername(user.username);
                    setPassword(user.password);
                    setDisplayName(user.displayName);
                    setSelectedPerms(user.permissions);
                    setSelectedUnits(userAllowed); // Usa a versão normalizada
                    setIsAdding(true);
                    setTimeout(() => {
                      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                 }} className="p-3 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 transition-all">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 </button>
                 {user.username !== 'admin' && (
                   <button onClick={() => confirm(`EXCLUIR ${user.displayName.toUpperCase()}?`) && onUpdateUsers(users.filter(u => u.id !== user.id))} className="p-3 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 transition-all">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                 )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Senha</span>
                 <span className="text-[10px] font-mono text-slate-500 truncate flex-1">{visiblePasswords[user.id] ? user.password : '••••••••'}</span>
                 <button onClick={() => setVisiblePasswords(p => ({...p, [user.id]: !p[user.id]}))} className="text-[8px] font-black text-blue-500 uppercase">{visiblePasswords[user.id] ? 'Ocultar' : 'Revelar'}</button>
              </div>
              <div className="flex flex-wrap gap-1">
                 {user.username === 'admin' ? (
                   <span className="text-[7px] font-black uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded">ACESSO TOTAL</span>
                 ) : (
                   <>
                      {userAllowed.length > 0 ? (
                        <span className="text-[7px] font-black uppercase bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded">{userAllowed.length} UNIDADES</span>
                      ) : (
                        <span className="text-[7px] font-black uppercase bg-slate-100 text-slate-400 px-2 py-0.5 rounded">SEM ACESSO</span>
                      )}
                      <span className="text-[7px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-400">{user.permissions.length} PERMISSÕES</span>
                   </>
                 )}
              </div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
};

export default UserManagement;