import React, { useState } from 'react';
import Modal from '../../shared/ui/Modal';
import Button from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recuperação de Senha"
      subtitle="Recupere o acesso ao sistema"
      maxWidth="md"
    >
      {status === 'success' ? (
        <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
          <span className="text-5xl select-none">🎉</span>
          <h4 className="text-sm font-black text-emerald-600 uppercase tracking-wider">Redefinição Concluída!</h4>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            A senha do usuário *admin* foi redefinida com sucesso para:
          </p>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 p-4 rounded-2xl">
            <span className="font-mono text-xl font-black text-emerald-600 tracking-wider">admin123</span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Faça login usando o usuário "admin" com esta nova senha.
          </p>
          <Button 
            onClick={onClose}
            variant="dark"
            size="lg"
            fullWidth
            className="mt-4"
          >
            Voltar ao Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seletor de Tipo de Usuário */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Quem é você?</label>
            <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Button 
                type="button"
                onClick={() => { setSelectedUser('admin'); setStatus('idle'); }}
                variant={selectedUser === 'admin' ? 'dark' : 'ghost'}
                size="sm"
                fullWidth
                rounded="xl"
              >
                🛠️ Admin Master
              </Button>
              <Button 
                type="button"
                onClick={() => { setSelectedUser('colaborador'); setStatus('idle'); }}
                variant={selectedUser === 'colaborador' ? 'dark' : 'ghost'}
                size="sm"
                fullWidth
                rounded="xl"
              >
                👤 Colaborador
              </Button>
            </div>
          </div>

          {selectedUser === 'admin' ? (
            <div className="space-y-4">
              <Input
                label="Chave Master do Projeto"
                type="password"
                value={masterKey}
                onChange={e => { setMasterKey(e.target.value); setStatus('idle'); }}
                placeholder="Insira a VITE_FIREBASE_API_KEY..."
                helperText="Dica: É a chave VITE_FIREBASE_API_KEY do seu projeto."
                error={status === 'error' ? errorMessage : undefined}
              />

              <Button 
                type="submit"
                isLoading={status === 'loading'}
                variant="primary"
                size="lg"
                fullWidth
              >
                Redefinir Senha do Admin
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl p-6 space-y-3">
              <span className="text-3xl select-none">🔑</span>
              <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Acesso de Colaborador</h4>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                As senhas de garçons e caixas são gerenciadas diretamente pelo **Administrador Master**.
              </p>
              <p className="text-[10px] font-medium text-slate-400">
                Peça ao gerente ou admin para redefinir sua senha no menu "Gestão de Equipe".
              </p>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;
