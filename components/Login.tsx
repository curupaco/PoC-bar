
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (password: string) => void;
  isLoading: boolean;
  error: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onLogin(password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>

        <div className="text-center relative z-10">
          <span className="text-5xl font-normal text-slate-800 dark:text-white tracking-tighter leading-none font-barrio block mb-2">Botequista</span>
          <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-8">Acesso ao Sistema</p>
          
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Senha Mestra / Chave de Acesso</label>
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-black border-2 border-transparent focus:border-red-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>

          {error && (
            <p className="text-center text-xs font-black text-red-500 uppercase animate-bounce">{error}</p>
          )}

          <button
            disabled={isLoading || !password}
            className={`w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black shadow-lg shadow-red-500/30 transition-all uppercase text-xs tracking-[0.2em] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Validando Chave...
              </>
            ) : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
