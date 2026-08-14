import React, { useState } from 'react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetAdminPassword: (firebasePass: string) => Promise<boolean>;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onResetAdminPassword
}) => {
  const [selectedUser, setSelectedUser] = useState<'admin' | 'colaborador'>('admin');
  const [masterKey, setMasterKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser !== 'admin') return;
    if (!masterKey) {
      setStatus('error');
      setErrorMessage('Por favor, digite a chave master.');
      return;
    }

    setStatus('loading');
    try {
      const success = await onResetAdminPassword(masterKey);
      if (success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage('Chave master incorreta ou erro de conexão.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Falha ao processar redefinição.');
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      {/* Modal Card */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Recuperação de Senha</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Recupere o acesso ao sistema</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {status === 'success' ? (
            <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
              <span className="text-5xl select-none">🎉</span>
              <h4 className="text-sm font-black text-emerald-600 uppercase tracking-wider">Redefinição Concluída!</h4>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4">
                A senha do usuário *admin* foi redefinida com sucesso para:
              </p>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 p-4 rounded-2xl mx-6">
                <span className="font-mono text-xl font-black text-emerald-600 tracking-wider">admin123</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Faça login usando o usuário "admin" com esta nova senha.
              </p>
              <button 
                type="button"
                onClick={onClose}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md mt-6"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Seletor de Tipo de Usuário */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quem é você?</label>
                <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <button 
                    type="button"
                    onClick={() => { setSelectedUser('admin'); setStatus('idle'); }}
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${selectedUser === 'admin' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
                  >
                    Administrador (Admin)
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setSelectedUser('colaborador'); setStatus('idle'); }}
                    className={`flex-1 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${selectedUser === 'colaborador' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
                  >
                    Colaborador / Operador
                  </button>
                </div>
              </div>

              {selectedUser === 'colaborador' ? (
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-3 animate-in fade-in duration-200">
                  <span className="text-2xl select-none">🔒</span>
                  <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">Acesso de Colaborador</h4>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-wider">
                    Se você esqueceu sua senha, por favor peça para o Administrador ou Gerente do bar redefinir suas credenciais na tela de *Usuários* dentro das configurações do Botequista.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Master do Firebase (VITE_FIREBASE_PASSWORD)</label>
                    <input 
                      type="password"
                      value={masterKey}
                      onChange={e => { setMasterKey(e.target.value); setStatus('idle'); }}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs outline-none focus:ring-2 focus:ring-slate-500"
                    />
                    <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest ml-1">
                      *Apenas o proprietário do bar possui acesso a esta chave.
                    </p>
                  </div>

                  {status === 'error' && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-4 rounded-xl text-center">
                      <p className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">{errorMessage}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {status === 'loading' ? 'Verificando...' : 'Redefinir Senha do Admin'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
