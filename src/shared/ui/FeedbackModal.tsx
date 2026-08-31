import React, { useState, useEffect } from 'react';
import { View } from '../../types';
import Modal from './Modal';
import Button from './Button';
import { Textarea } from './Input';

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

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setIsSending(true);
    setFeedbackStatus('idle');
    setErrorMessage('');

    const deviceType = window.innerWidth < 768 ? '📱 Mobile' : '💻 Desktop';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Central de Feedback"
      subtitle="Reporte erros ou sugira melhorias"
      maxWidth="md"
    >
      {feedbackStatus === 'success' ? (
        <div className="py-12 flex flex-col items-center text-center animate-in zoom-in">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-lg font-black uppercase text-emerald-600">Recebido!</h4>
          <p className="text-xs text-slate-500 font-bold uppercase mt-2">Issue criada no GitHub com sucesso.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => setType('bug')}
              className={`p-4 rounded-2xl border-2 font-black uppercase text-xs flex flex-col items-center gap-2 transition-all ${type === 'bug' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="text-xl">🐞</span>
              Reportar Erro
            </button>
            <button 
              type="button"
              onClick={() => setType('feature')}
              className={`p-4 rounded-2xl border-2 font-black uppercase text-xs flex flex-col items-center gap-2 transition-all ${type === 'feature' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="text-xl">💡</span>
              Nova Ideia
            </button>
          </div>

          <Textarea 
            label="Descrição"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder={type === 'bug' ? "O que aconteceu? Onde clicou? Descreva o erro..." : "Qual funcionalidade tornaria o bar mais eficiente?"}
          />

          {feedbackStatus === 'error' && (
            <div className="text-center bg-red-100 dark:bg-red-900/20 py-3 rounded-xl border border-red-200 dark:border-red-900/30 animate-in shake">
              <p className="text-[10px] font-black text-red-600 uppercase">Falha no Envio</p>
              <p className="text-[9px] text-red-500 font-bold uppercase mt-1">{errorMessage}</p>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            isLoading={isSending}
            disabled={!description.trim()}
            variant="dark"
            size="lg"
            fullWidth
          >
            Enviar Feedback
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default FeedbackModal;
