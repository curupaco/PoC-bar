
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
    if (!username.trim() || !password.trim()) return;
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
      <div className="max-w-md w-full p-1 bg-slate-900 rounded-[40px] shadow-2xl border border-slate-800 relative overflow-hidden animate-in fade-in zoom-in duration-500">
        
        <div className="p-10 relative z-10">
          <div className="text-center mb-10">
            <span className="text-5xl font-normal text-white tracking-tighter leading-none font-barrio block mb-4">Botequista</span>
            <div className="h-1 w-12 bg-red-600 mx-auto rounded-full"></div>
            {isLoading && (
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4 animate-pulse">
                 Sincronizando...
               </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
              <input
                autoFocus
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-800 text-white font-black border-2 border-transparent focus:border-red-500 outline-none transition-all"
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-800 text-white font-black border-2 border-transparent focus:border-red-500 outline-none transition-all"
                placeholder=""
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-2xl animate-in shake duration-300">
                <p className="text-center text-[10px] font-black text-red-500 uppercase tracking-widest">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading && username.toLowerCase() !== 'admin'}
              className={`w-full py-5 rounded-2xl font-black shadow-lg transition-all uppercase text-xs tracking-[0.2em] active:scale-95 ${
                isLoading && username.toLowerCase() !== 'admin'
                  ? 'bg-slate-800 text-slate-500 cursor-wait'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30'
              }`}
            >
              {isLoading && username.toLowerCase() !== 'admin' ? 'Conectando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
