import React, { useState, useEffect } from 'react';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
  onResetAdminPassword: (firebasePass: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading, error, onResetAdminPassword }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  useEffect(() => {
    if (error) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      setPassword(''); // Limpa a senha por segurança e UX
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
      <div className={`max-w-md w-full p-1 bg-slate-900 rounded-[40px] shadow-2xl border border-slate-800 relative overflow-hidden transition-transform duration-300 ${isShaking ? 'animate-shake' : 'animate-in fade-in zoom-in duration-500'}`}>
        
        <div className="p-10 relative z-10">
          <div className="text-center mb-10">
            <span className="text-5xl font-normal text-white tracking-tighter leading-none font-barrio block mb-4">Botequista</span>
            <div className="h-1 w-12 bg-red-600 mx-auto rounded-full"></div>
            {isLoading && (
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4 animate-pulse">
                 Sincronizando banco local...
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
                autoComplete="username"
                className={`w-full px-6 py-4 rounded-2xl bg-slate-800 text-white font-black border-2 outline-none transition-all ${error ? 'border-red-500/50' : 'border-transparent focus:border-red-500'}`}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={`w-full pl-6 pr-14 py-4 rounded-2xl bg-slate-800 text-white font-black border-2 outline-none transition-all ${error ? 'border-red-500/50' : 'border-transparent focus:border-red-500'}`}
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-2xl animate-in slide-in-from-top-1">
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
              {isLoading && username.toLowerCase() !== 'admin' ? 'Aguarde...' : 'Entrar no Bar'}
            </button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-[9px] font-black text-slate-550 hover:text-white uppercase tracking-widest transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </div>
      </div>
      <ForgotPasswordModal 
        isOpen={isForgotOpen} 
        onClose={() => setIsForgotOpen(false)} 
        onResetAdminPassword={onResetAdminPassword} 
      />
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};

export default Login;