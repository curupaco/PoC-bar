
import React, { useState } from 'react';
import { User, UserPermission } from '../types';
import { hashPassword } from '../services/cryptoService';

interface UserManagementProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const ALL_PERMISSIONS: { id: UserPermission, label: string }[] = [
  { id: 'dashboard', label: 'Painel Geral' },
  { id: 'pos', label: 'PDV (Vendas)' },
  { id: 'products', label: 'Gerenciar Cardápio' },
  { id: 'history', label: 'Histórico' },
  { id: 'reports', label: 'Relatórios' },
  { id: 'shifts_admin', label: 'Gestão de Turnos' },
  { id: 'cash_admin', label: 'Controle de Caixa' },
  { id: 'users_admin', label: 'Gestão de Equipe' },
  { id: 'settings', label: 'Ajustes e Regras' },
  { id: 'open_shift', label: 'Abrir Turno' },
  { id: 'close_shift', label: 'Fechar Turno' },
  { id: 'delete_sale', label: 'Excluir Venda' },
  { id: 'delete_product', label: 'Excluir Produto' },
  { id: 'edit_product', label: 'Editar Produto' },
  { id: 'export_report', label: 'Salvar Relatórios' },
  { id: 'clear_fiado', label: 'Quitar Fiados' },
  { id: 'full_reset', label: 'Reset do Sistema' },
  { id: 'manage_backup', label: 'Gerenciar Nuvem' },
  { id: 'help_view', label: 'Ver Manual' },
];

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUsers }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<UserPermission[]>([]);
  
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setDisplayName('');
    setSelectedPerms(['dashboard', 'pos', 'help_view']);
    setEditingUser(null);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!username || !password || !displayName) return;
    
    // Hash da senha se ela foi alterada (ou nova)
    // Se for edição e a senha for igual a existente, mantemos (para não re-hashar um hash)
    let finalPassword = password;
    if (editingUser && editingUser.password === password) {
      finalPassword = password;
    } else {
      finalPassword = hashPassword(password);
    }
    
    const newUser: User = {
      id: editingUser?.id || `user-${Date.now()}`,
      username,
      password: finalPassword,
      displayName,
      permissions: selectedPerms
    };

    if (editingUser) {
      onUpdateUsers(users.map(u => u.id === editingUser.id ? newUser : u));
    } else {
      onUpdateUsers([...users, newUser]);
    }
    resetForm();
  };

  const togglePerm = (perm: UserPermission) => {
    setSelectedPerms(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Equipe e Permissões</h2>
        <button onClick={() => setIsAdding(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-black transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest">
          Adicionar Usuário
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-red-500 shadow-2xl animate-in slide-in-from-top-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase mb-6">{editingUser ? 'Editar Usuário' : 'Novo Colaborador'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Exibição</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Acessos Permitidos (Granular)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {ALL_PERMISSIONS.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => togglePerm(p.id)}
                  className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${selectedPerms.includes(p.id) ? 'bg-red-600 border-red-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={handleSave} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-red-700">Salvar Alterações</button>
            <button onClick={resetForm} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        {users.map(user => (
          <div key={user.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-black uppercase">
                 {user.username.slice(0, 2).toUpperCase()}
               </div>
               <div>
                  <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm">{user.displayName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Login: @{user.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[9px] font-black text-slate-500 uppercase">Senha:</span>
                     <span className="text-[10px] font-mono tracking-tighter">
                        {visiblePasswords[user.id] ? (user.password.length > 20 ? '[CRIPTOGRAFADA]' : user.password) : '••••••••'}
                     </span>
                     <button onClick={() => togglePasswordVisibility(user.id)} className="text-[9px] text-blue-500 hover:text-blue-600 uppercase font-black">
                        {visiblePasswords[user.id] ? '[Ocultar]' : '[Ver]'}
                     </button>
                  </div>
               </div>
            </div>
            <div className="flex gap-2">
               <button 
                title="Editar Usuário"
                onClick={() => {
                  setEditingUser(user);
                  setUsername(user.username);
                  setPassword(user.password);
                  setDisplayName(user.displayName);
                  setSelectedPerms(user.permissions);
                  setIsAdding(true);
                }}
                className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
               </button>
               {user.username !== 'admin' && user.id !== 'admin' && (
                 <button onClick={() => onUpdateUsers(users.filter(u => u.id !== user.id))} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 </button>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
