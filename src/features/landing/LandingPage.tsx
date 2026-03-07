import React, { useState } from 'react';

const whatsAppLink = "https://wa.me/5511966989160?text=Olá!%20Vi%20a%20landing%20page%20do%20Botequista%20e%20gostaria%20de%20ser%20um%20Beta%20Tester%20do%20sistema.";

export const LandingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-red-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute top-[-20%] w-[800px] h-[800px] bg-red-600/10 blur-[120px] rounded-full opacity-50 mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="flex justify-between items-center py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <circle r="190" cx="256" cy="256" fill="#94a3b8" />
              <circle r="180" cx="256" cy="256" fill="#cbd5e1" />
              <circle r="160" cx="256" cy="256" fill="#b91c1c" />
              <path fill="#ffffff"
                d="M-35 -70 H 25 C 55 -70 75 -50 75 -20 C 75 0 60 15 40 20 C 65 25 80 45 80 75 C 80 110 55 130 15 130 H -35 V -70 Z M 0 -40 V 10 H 25 C 40 10 45 0 45 -15 C 45 -30 40 -40 25 -40 H 0 Z M 0 40 V 100 H 30 C 50 100 50 90 50 70 C 50 50 45 40 30 40 H 0 Z"
                transform="translate(256 256) translate(-15 -10) scale(0.8)" />
            </svg>
            <span className="text-xl md:text-2xl font-black tracking-tighter uppercase font-barrio">Botequista</span>
          </div>
          <a
            href={whatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all border border-white/10 backdrop-blur-sm"
          >
            Seja Beta Tester
          </a>
        </header>

        {/* Hero Section */}
        <main className="pt-20 pb-16 md:pt-32 md:pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs md:text-sm font-bold uppercase tracking-widest mb-8 animate-pulse">
            🚀 Rodada Beta Aberta - Vagas Limitadas
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-8 bg-gradient-to-br from-white via-white to-slate-400 text-transparent bg-clip-text">
            Transforme seu celular no caixa do bar.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            Venda em 2 cliques, controle o fiado e feche o caixa sem erro — <span className="text-white font-bold border-b-2 border-red-500">mesmo se a internet cair.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4 sm:px-0">
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebd5b] text-white px-8 py-4 rounded-xl text-lg font-black uppercase tracking-wide transition-all shadow-[0_0_40px_-10px_#25D366] hover:shadow-[0_0_60px_-10px_#25D366] hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Quero o Botequista no Meu Bar
            </a>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all border border-slate-700 hover:border-slate-500"
            >
              Conheça Mais
            </button>
          </div>
        </main>

        {/* Key Differentiators Cards */}
        <section className="py-12 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-red-500/30 transition-colors">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center text-2xl mb-4">☁️</div>
              <h3 className="text-xl font-bold mb-2">Offline-First</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Vende sem Wi-Fi. O sistema salva local e sobe quando a rede volta.</p>
            </div>
            
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-red-500/30 transition-colors">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center text-2xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Treinamento Zero</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Tão fácil quanto mandar um Zap. Seu funcionário aprende em 5 min.</p>
            </div>
            
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-red-500/30 transition-colors">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center text-2xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">Conferência Cega</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Evite furos no caixa no final da noite. Contagem às cegas.</p>
            </div>
            
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-red-500/30 transition-colors">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center text-2xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-2">Mobile First</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Perfeito em telas pequenas, projetado para o garçom e para o dono no balcão.</p>
            </div>
          </div>
        </section>

        {/* Detailed Sections / Split Sections */}
        <div className="space-y-24 py-24">
          
          <section className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-3xl p-2 border border-white/10 shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-500">
              <img src="/landing_assets/assets/Screenshot_2026-03-03_21-28-22.png" alt="PDV Venda Expressa" className="rounded-2xl opacity-90 object-cover w-full" loading="lazy" />
            </div>
            <div className="flex-1">
              <span className="text-red-500 font-bold uppercase tracking-widest text-xs mb-3 block">Agilidade no Balcão</span>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Venda Expressa em Segundos</h2>
              <p className="text-slate-300 text-lg mb-6 leading-relaxed">Com o modo Expressa, você abre uma comanda instantânea e fecha o pedido em 2 cliques. Sem burocracia, sem cadastros lentos.</p>
            </div>
          </section>

          <section className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="flex-1 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-3xl p-2 border border-white/10 shadow-2xl -skew-y-1 hover:skew-y-0 transition-transform duration-500">
              <img src="/landing_assets/assets/Screenshot_2026-03-03_21-32-01.png" alt="Gestão de Penduras" className="rounded-2xl opacity-90 object-cover w-full" loading="lazy" />
            </div>
            <div className="flex-1">
              <span className="text-red-500 font-bold uppercase tracking-widest text-xs mb-3 block">Controle do Fiado</span>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Adeus ao Calote e ao Caderninho</h2>
              <p className="text-slate-300 text-lg mb-6 leading-relaxed">Carteira completa de devedores, com histórico de consumo. Quitação parcial ou total com apenas um clique.</p>
            </div>
          </section>

        </div>

        {/* Last CTA / Trust Section */}
        <section className="py-20 text-center bg-slate-900/30 rounded-3xl border border-white/5 mb-12">
          <h3 className="text-2xl md:text-3xl font-black text-white mb-4">Feito por quem entende de balcão.</h3>
          <p className="text-slate-400 italic text-lg max-w-2xl mx-auto mb-10">
            "Mais do que um sistema, o Botequista nasceu para acabar com os calotes, as perdas e a lentidão no atendimento."
          </p>
          <a
            href={whatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebd5b] text-white px-8 py-4 rounded-xl text-lg font-black uppercase tracking-wide transition-all shadow-lg hover:-translate-y-1"
          >
            Falar pelo WhatsApp
          </a>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-white/10 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Botequista. Todos os direitos reservados.</p>
        </footer>

      </div>

      {/* Modal Conheça Mais */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 zoom-in-95 duration-300">
            <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-white/10 p-5 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold">Por que o Botequista?</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 md:p-10 space-y-10 text-slate-300">
              
              <div>
                <h4 className="text-white text-xl font-black mb-4 flex items-center gap-2"><span className="text-2xl">⚡</span> A Venda Expressa e a Comanda</h4>
                <p className="leading-relaxed">O Botequista une o melhor dos dois mundos. Para quem bebe no balcão, a Venda Expressa fecha uma compra em 3 cliques. Para as mesas, as comandas são sincronizadas em tempo real entre todos os celulares da equipe, permitindo colaboração múltipla.</p>
              </div>

              <div>
                <h4 className="text-white text-xl font-black mb-4 flex items-center gap-2"><span className="text-2xl">🔐</span> Segurança Nível Empresa</h4>
                <p className="leading-relaxed mb-4">Você controla exatamente quem faz o quê no bar (RBAC). A Tesouraria requer validação e a Conferência Cega no fechamento de caixa impede vazamentos.</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <li className="flex gap-2"><span>✅</span> Ocultar relatórios da equipe</li>
                  <li className="flex gap-2"><span>✅</span> Bloquear cancelamentos</li>
                  <li className="flex gap-2"><span>✅</span> Registro de auditoria 100% gravado</li>
                  <li className="flex gap-2"><span>✅</span> Múltiplas Unidades Centralizadas</li>
                </ul>
              </div>

              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h4 className="text-white text-lg font-black mb-4">Comece grátis, sem amarras.</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:bg-[#1ebd5b] text-white text-center rounded-lg px-6 py-3 font-bold transition-all flex-1">
                    Quero Testar
                  </a>
                  <button onClick={() => setIsModalOpen(false)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-6 py-3 font-bold transition-all flex-1">
                    Voltar
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
