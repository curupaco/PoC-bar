
import React, { useState, useEffect } from 'react';
import { View } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  activeView: View;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, currentUser, activeView }) => {
  const [type, setType] = useState<'bug' | 'feature'>('bug');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFeedbackStatus('idle');
      setDescription('');
      setErrorMessage('');
      setIsSending(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setIsSending(true);
    setFeedbackStatus('idle');
    setErrorMessage('');

    // Detecção Mobile vs Desktop baseada no viewport
    const deviceType = window.innerWidth < 768 ? '📱 Mobile' : '💻 Desktop';

    // Timeout de 10 segundos para não travar a UI se o servidor demorar
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Detecção de ambiente local para evitar erro 404 no Vite puro
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const isVitePort = typeof window !== 'undefined' && window.location.port !== '3000';

      if (isLocalhost && isVitePort) {
         console.warn("⚠️ Ambiente Local (Vite): API Route '/api/feedback' indisponível. Simulando sucesso.");
         await new Promise(r => setTimeout(r, 1000));
         setFeedbackStatus('success');
         setTimeout(onClose, 2000);
         return;
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          description, 
          user: currentUser,
          view: activeView.toUpperCase(),
          device: deviceType
        }),
        signal: controller.signal
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error(`Erro do Servidor (Status ${response.status}). Verifique os logs.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Erro ${response.status}`);
      }
      
      setFeedbackStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error("Feedback Error:", error);
      setFeedbackStatus('error');
      
      if (error.name === 'AbortError') {
        setErrorMessage("O servidor demorou muito para responder.");
      } else {
        setErrorMessage(error.message || "Falha ao conectar.");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-[10000] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
        
        <div className="flex justify-between items-start mb-6">
           <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Central de Feedback</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Reporte erros ou sugira melhorias</p>
           </div>
           <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">✕</button>
        </div>

        {feedbackStatus === 'success' ? (
           <div className="py-12 flex flex-col items-center text-center animate-in zoom-in">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h4 className="text-lg font-black uppercase text-emerald-600">Recebido!</h4>
              <p className="text-xs text-slate-500 font-bold uppercase mt-2">Issue criada no GitHub com sucesso.</p>
           </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setType('bug')}
                 className={`p-4 rounded-2xl border-2 font-black uppercase text-xs flex flex-col items-center gap-2 transition-all ${type === 'bug' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                 <span className="text-xl">🐞</span>
                 Reportar Erro
               </button>
               <button 
                 onClick={() => setType('feature')}
                 className={`p-4 rounded-2xl border-2 font-black uppercase text-xs flex flex-col items-center gap-2 transition-all ${type === 'feature' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                 <span className="text-xl">💡</span>
                 Nova Ideia
               </button>
            </div>

            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Descrição</label>
               <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs min-h-[120px] outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-800 dark:text-slate-200"
                  placeholder={type === 'bug' ? "O que aconteceu? Onde clicou? Descreva o erro..." : "Qual funcionalidade tornaria o bar mais eficiente?"}
               ></textarea>
            </div>

            {feedbackStatus === 'error' && (
              <div className="text-center bg-red-100 dark:bg-red-900/20 py-3 rounded-xl border border-red-200 dark:border-red-900/30 animate-in shake">
                 <p className="text-[10px] font-black text-red-600 uppercase">Falha no Envio</p>
                 <p className="text-[9px] text-red-500 font-bold uppercase mt-1">{errorMessage}</p>
              </div>
            )}

            <button 
              onClick={handleSubmit} 
              disabled={isSending || !description.trim()}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Enviando...
                </>
              ) : (
                'Enviar Feedback'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
