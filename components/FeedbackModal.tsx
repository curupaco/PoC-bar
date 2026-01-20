
import React, { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [type, setType] = useState<'bug' | 'feature'>('bug');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setIsSending(true);
    setFeedbackStatus('idle');
    setErrorMessage('');

    // Detecção de ambiente local para evitar frustração durante testes sem 'vercel dev'
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout

    try {
      // Se for localhost e não estivermos rodando via Vercel CLI (porta padrão vite 5173), simulamos sucesso
      // Isso evita que você ache que o sistema travou quando está apenas testando o layout
      if (isLocalhost && window.location.port !== '3000') {
         console.warn("⚠️ Ambiente Local Detectado: Simulando envio para GitHub (API Route indisponível no Vite)");
         await new Promise(r => setTimeout(r, 1500)); // Fake delay
         setFeedbackStatus('success');
         setTimeout(() => {
            onClose();
            setFeedbackStatus('idle');
            setDescription('');
         }, 2000);
         setIsSending(false);
         clearTimeout(timeoutId);
         return;
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description, user: currentUser }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `Erro ${response.status}: Falha no servidor`);
      }
      
      setFeedbackStatus('success');
      setTimeout(() => {
        onClose();
        setFeedbackStatus('idle');
        setDescription('');
      }, 2000);
    } catch (error: any) {
      console.error("Feedback Error:", error);
      setFeedbackStatus('error');
      
      if (error.name === 'AbortError') {
        setErrorMessage("Tempo esgotado. Verifique sua conexão.");
      } else if (error.message && error.message.includes('Unexpected token')) {
        // Geralmente acontece quando a Vercel retorna HTML de erro (404/500) em vez de JSON
        setErrorMessage("Erro de comunicação com a API.");
      } else {
        setErrorMessage(error.message || "Falha ao conectar.");
      }
    } finally {
      setIsSending(false);
      clearTimeout(timeoutId);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-[10000] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
        
        <div className="flex justify-between items-start mb-6">
           <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Central de Feedback</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ajude a melhorar o Botequista</p>
           </div>
           <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">✕</button>
        </div>

        {feedbackStatus === 'success' ? (
           <div className="py-12 flex flex-col items-center text-center animate-in zoom-in">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h4 className="text-lg font-black uppercase text-emerald-600">Recebido!</h4>
              <p className="text-xs text-slate-500 font-bold uppercase mt-2">Sua solicitação já está no GitHub.</p>
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
               <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Descrição Detalhada</label>
               <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs min-h-[120px] outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-800 dark:text-slate-200"
                  placeholder={type === 'bug' ? "O que aconteceu? Onde clicou? Apareceu algum erro?" : "Descreva sua ideia incrível para o sistema..."}
               ></textarea>
            </div>

            {feedbackStatus === 'error' && (
              <div className="text-center bg-red-100 dark:bg-red-900/20 py-3 rounded-xl border border-red-200 dark:border-red-900/30">
                 <p className="text-[10px] font-black text-red-600 uppercase">Erro no envio</p>
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
                'Enviar Report'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
