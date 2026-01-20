
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      // O App.tsx fará a verificação dupla (Hash ou Plain)
      onLogin(username, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 transition-colors duration-500">
      <div className="max-w-md w-full p-1 bg-slate-900 rounded-[40px] shadow-2xl border border-slate-800 relative overflow-hidden">
        
        {/* Decorações de Fundo */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="p-10 relative z-10">
          <div className="text-center">
            <span className="text-5xl font-normal text-white tracking-tighter leading-none font-barrio block mb-10">Botequista</span>
            
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-700/50">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 mb-4 animate-pulse">
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                 <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Sincronizando bar...</span>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
              <input
                autoFocus
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 text-white font-black border-2 border-transparent focus:border-red-500 outline-none transition-all"
                placeholder=""
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 text-white font-black border-2 border-transparent focus:border-red-500 outline-none transition-all"
                placeholder=""
              />
            </div>

            {error && (
              <p className="text-center text-[10px] font-black text-red-500 uppercase bg-red-900/10 py-3 rounded-xl border border-red-900/20">{error}</p>
            )}

            <button
              disabled={username.length < 3 || password.length < 3 || isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black shadow-lg shadow-red-500/30 transition-all uppercase text-xs tracking-[0.2em] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
            >
              Entrar no Sistema
            </button>
            
            <p className="text-[8px] text-center text-slate-500 font-bold uppercase mt-6 tracking-wider">
               Modo Escuro Ativo • Dados Sincronizados
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
