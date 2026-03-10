import React, { useState } from 'react';

const whatsAppLink = "https://wa.me/5511966989160?text=Olá!%20Vi%20a%20landing%20page%20do%20Botequista%20e%20gostaria%20de%20ser%20um%20Beta%20Tester%20do%20sistema.";

export const LandingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNerdModalOpen, setIsNerdModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-red-500/30 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-red-600/10 blur-[120px] rounded-full opacity-40 mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full opacity-30 mix-blend-screen" />
      </div>

      <div className="relative z-10">
        
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="relative">
                   <div className="absolute inset-0 bg-red-600 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                   <svg className="w-10 h-10 relative" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                    <circle r="190" cx="256" cy="256" fill="#1e293b" />
                    <circle r="180" cx="256" cy="256" fill="#334155" />
                    <circle r="160" cx="256" cy="256" fill="#ef4444" />
                    <path fill="#ffffff"
                      d="M-35 -70 H 25 C 55 -70 75 -50 75 -20 C 75 0 60 15 40 20 C 65 25 80 45 80 75 C 80 110 55 130 15 130 H -35 V -70 Z M 0 -40 V 10 H 25 C 40 10 45 0 45 -15 C 45 -30 40 -40 25 -40 H 0 Z M 0 40 V 100 H 30 C 50 100 50 90 50 70 C 50 50 45 40 30 40 H 0 Z"
                      transform="translate(256 256) translate(-15 -10) scale(0.8)" />
                  </svg>
                </div>
                <span className="text-2xl font-black tracking-tighter uppercase font-barrio bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Botequista</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <a 
                  href="https://www.instagram.com/obotequista/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-pink-500 transition-colors"
                  title="Siga no Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.848 0-3.204.012-3.584.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <button onClick={() => setIsNerdModalOpen(true)} className="text-slate-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors">Para Nerds 🤓</button>
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-slate-950 px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-tight hover:bg-red-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
                >
                  Garantir Vaga Beta
                </a>
              </div>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white p-2 hover:bg-white/5 rounded-lg transition-colors relative z-[60]"
              >
                {isMenuOpen ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          <div className={`fixed inset-0 z-50 md:hidden bg-[#020617]/95 backdrop-blur-2xl transition-all duration-500 ease-in-out ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex flex-col items-center justify-center h-full gap-8 p-4">
              <button 
                onClick={() => { setIsNerdModalOpen(true); setIsMenuOpen(false); }} 
                className="text-xl font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                PARA NERDS 🤓
              </button>
              <a 
                href="https://www.instagram.com/obotequista/" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="text-xl font-bold uppercase tracking-widest text-slate-400 hover:text-pink-500 transition-colors"
              >
                INSTAGRAM
              </a>
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="w-full max-w-xs bg-red-600 text-white px-8 py-4 rounded-2xl text-center text-lg font-black uppercase tracking-tight shadow-xl shadow-red-500/20 active:scale-95 transition-transform"
              >
                GARANTIR VAGA BETA
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-24 pb-32 px-4 text-center overflow-hidden">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs md:text-sm font-black uppercase tracking-[0.2em] mb-12 animate-bounce">
              🍺 O Único Sistema que Trata a Internet como opcional
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-10 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent italic">
              O BAR NÃO PODE <br/> <span className="text-red-600 not-italic">PARAR.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
              Venda em 2 cliques, controle o fiado e feche o caixa sem erro — <span className="text-white font-bold border-b-2 border-red-600">mesmo se o Wi-Fi cair no meio do rush.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-full sm:w-auto overflow-hidden bg-[#25D366] text-white px-10 py-5 rounded-2xl text-xl font-black uppercase tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_-15px_rgba(37,211,102,0.4)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Quero no meu bar
                </div>
              </a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto bg-slate-900 border border-slate-800 hover:border-slate-600 text-white px-10 py-5 rounded-2xl text-xl font-bold transition-all flex items-center justify-center gap-3 backdrop-blur-md"
              >
                Ver Detalhes
              </button>
            </div>

            <div className="mt-20 relative px-4">
              <div className="absolute inset-0 bg-red-600/20 blur-[100px] rounded-full scale-75"></div>
              <div className="relative bg-[#020617] p-2 rounded-[40px] border border-white/10 shadow-2xl overflow-hidden group">
                <img 
                  src="/landing_assets/assets/Screenshot_2026-03-03_21-28-22.png" 
                  alt="Interface Botequista" 
                  className="rounded-[32px] w-full h-auto object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-700" 
                />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020617] to-transparent"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-black mb-6 italic">O PESADELO DO DONO DE BAR ACABOU.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Desenvolvido ouvindo quem está atrás do balcão todas as noites.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-10 bg-white/5 border border-white/5 rounded-[40px] hover:bg-white/[0.08] hover:border-red-500/30 transition-all duration-500">
              <div className="w-16 h-16 bg-red-500 text-white rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-xl shadow-red-500/20 group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-2xl font-black mb-4 uppercase italic">Venda Expressa</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Balcão lotado? Abra uma comanda automática com 1 toque e receba na hora. Giro rápido, sem burocracia.</p>
            </div>
            
            <div className="group p-10 bg-white/5 border border-white/5 rounded-[40px] hover:bg-white/[0.08] hover:border-blue-500/30 transition-all duration-500">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">🔒</div>
              <h3 className="text-2xl font-black mb-4 uppercase italic">Conferência Cega</h3>
              <p className="text-slate-400 leading-relaxed font-medium">O operador conta o dinheiro sem saber quanto o sistema espera. Transparência total e fim do "ajuste manual" no caixa.</p>
            </div>

            <div className="group p-10 bg-white/5 border border-white/5 rounded-[40px] hover:bg-white/[0.08] hover:border-emerald-500/30 transition-all duration-500">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="text-2xl font-black mb-4 uppercase italic">Inteligência Financeira</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Relatórios de Curva ABC, Auditoria de Eventos e Gestão de Penduras. Saiba exatamente de onde vem e para onde vai seu dinheiro.</p>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-32 bg-white/[0.02] border-y border-white/5 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight italic">FEITO PARA O MUNDO <span className="text-red-600">REAL.</span></h2>
              <div className="space-y-6">
                 {[
                   { t: "Offline-First", d: "A internet caiu? O Botequista continua vendendo e sincroniza depois." },
                   { t: "Multi-Dispositivo", d: "Use no celular do garçom, no tablet do caixa e no PC do dono." },
                   { t: "Gestão de Fiado", d: "Carteira de penduras integrada. Acabe com o caderninho de papel." },
                   { t: "Acesso em Nuvem", d: "Veja o faturamento do bar de qualquer lugar do mundo." }
                 ].map((item, i) => (
                   <div key={i} className="flex gap-4 items-start group">
                     <div className="mt-1 w-6 h-6 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500 text-xs group-hover:bg-red-600 group-hover:text-white transition-all">✓</div>
                     <div>
                       <h4 className="text-xl font-bold text-white mb-1">{item.t}</h4>
                       <p className="text-slate-500">{item.d}</p>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="absolute -inset-10 bg-red-600/10 blur-[120px] rounded-full"></div>
               <div className="relative transform rotate-3 hover:rotate-0 transition-transform duration-700">
                 <img src="/landing_assets/assets/Screenshot_2026-03-03_21-32-01.png" alt="Dashboard" className="rounded-[40px] border border-white/10 shadow-2xl" />
               </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-40 px-4 text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-red-600 to-red-900 p-16 md:p-24 rounded-[60px] shadow-2xl shadow-red-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[400px] h-[400px] bg-white/10 blur-[80px] rounded-full"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-7xl font-black mb-10 leading-none italic uppercase">O balcão não espera. <br/> Seu lucro também não.</h2>
              <p className="text-white/80 text-xl mb-14 max-w-2xl mx-auto font-medium">Seja um dos primeiros a testar o Botequista e transforme a gestão do seu bar agora mesmo.</p>
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-red-600 px-12 py-6 rounded-2xl text-2xl font-black uppercase tracking-tight hover:scale-110 active:scale-95 transition-all shadow-2xl"
              >
                Começar agora
              </a>
            </div>
          </div>
          <button 
            onClick={() => setIsNerdModalOpen(true)}
            className="mt-20 text-slate-600 hover:text-slate-400 font-bold uppercase text-xs tracking-[0.4em] transition-colors"
          >
            Curioso sobre a tecnologia? Leia o log para Nerds.
          </button>
        </section>

        {/* Footer */}
        <footer className="py-20 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black tracking-tighter uppercase font-barrio text-white/40">Botequista</span>
            </div>
            <p className="text-slate-600 text-sm font-medium italic opacity-50">&copy; {new Date().getFullYear()} Botequista System. Feito com café e cerveja.</p>
            <div className="flex gap-8 text-xs font-black uppercase tracking-widest text-slate-600">
               <a href="https://www.instagram.com/obotequista/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">INSTAGRAM</a>
               <button onClick={() => setIsTermsModalOpen(true)} className="hover:text-red-500 transition-colors">TERMOS</button>
               <button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-red-500 transition-colors">PRIVACIDADE</button>
            </div>
          </div>
        </footer>

      </div>

      {/* Main Feature Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 font-sans">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#0f172a] border border-white/10 rounded-[60px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-[#1e293b] p-8 flex justify-between items-center">
              <h3 className="text-3xl font-black italic uppercase tracking-tight">O que você ganha</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                title="Fechar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <h4 className="text-red-500 text-sm font-black uppercase tracking-widest mb-4">Zero Papel</h4>
                  <p className="text-slate-300 text-lg leading-relaxed">Gerencie comandas digitais colaborativas. O que um garçom anota, o outro vê em segundos. Sem erros de leitura, sem perda de tickets.</p>
                </div>
                <div>
                  <h4 className="text-red-500 text-sm font-black uppercase tracking-widest mb-4">Hierarquia de Equipe</h4>
                  <p className="text-slate-300 text-lg leading-relaxed">Controle granular (RBAC). O gerente cancela, o operador só vende. Relatórios de performance individual para premiar quem produz mais.</p>
                </div>
                <div>
                  <h4 className="text-red-500 text-sm font-black uppercase tracking-widest mb-4">Cardápio Dinâmico</h4>
                  <p className="text-slate-300 text-lg leading-relaxed">Cadastre adicionais, pontos da carne e variações. O sistema guia o operador para que ele nunca esqueça de oferecer o extra.</p>
                </div>
                <div>
                  <h4 className="text-red-500 text-sm font-black uppercase tracking-widest mb-4">Segurança Multinível</h4>
                  <p className="text-slate-300 text-lg leading-relaxed">Seu banco de dados é sincronizado na nuvem em tempo real, mas também fica salvo no chip do seu dispositivo. Dados blindados.</p>
                </div>
              </div>
              <div className="pt-8 border-t border-white/5 text-center">
                <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#25D366] text-white px-10 py-5 rounded-2xl text-xl font-black uppercase tracking-wide hover:scale-105 transition-all">
                  Quero demonstração grátis
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nerd Modal */}
      {isNerdModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-md animate-in fade-in" onClick={() => setIsNerdModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-[32px] w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🤓</span>
                <h3 className="text-xl font-mono font-bold text-emerald-500">&gt; cat system_specs.log</h3>
              </div>
              <button 
                onClick={() => setIsNerdModalOpen(false)} 
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 font-mono text-sm leading-relaxed space-y-8 text-slate-300 no-scrollbar">
              <div className="space-y-4">
                <p className="text-emerald-500 font-bold">$ botequista --check-architecture</p>
                <ul className="space-y-2 border-l-2 border-slate-700 pl-6">
                  <li><span className="text-emerald-400">Core:</span> React 19 + TypeScript 5.8 (Strict Mode)</li>
                  <li><span className="text-emerald-400">Persistence:</span> Offline-First via IndexedDB (idb wrapper)</li>
                  <li><span className="text-emerald-400">Synchronization:</span> Custom `useSync` hook + Firebase Realtime DB</li>
                  <li><span className="text-emerald-400">Auth & Security:</span> Multi-unit RBAC (20+ permissions) + PBKDF2 Hashing</li>
                  <li><span className="text-emerald-400">Reliability:</span> Idempotency Gateway + Audit Timeline (7-day retention)</li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="text-emerald-500 font-bold">$ ls modules/technical_specs</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                  <div>
                    <h5 className="text-white font-bold mb-2 underline">Deduplicação Proativa</h5>
                    <p className="text-slate-400 text-[10px] uppercase tracking-tighter">Normalização de categorias via Trim + UpperCase no aggregate pipe.</p>
                  </div>
                  <div>
                    <h5 className="text-white font-bold mb-2 underline">Interface Determinística</h5>
                    <p className="text-slate-400 text-[10px] uppercase tracking-tighter">Blind Close Mechanism: input de gaveta desconectado do esperado via backend.</p>
                  </div>
                  <div>
                    <h5 className="text-white font-bold mb-2 underline">Sync Queue (FIFO)</h5>
                    <p className="text-slate-400 text-[10px] uppercase tracking-tighter">Fila de persistência com auto-retry e resolução de conflitos por timestamp LWW.</p>
                  </div>
                  <div>
                    <h5 className="text-white font-bold mb-2 underline">PWA Optimization</h5>
                    <p className="text-slate-400 text-[10px] uppercase tracking-tighter">Service Worker intercedendo em chamadas assets para garantir 100% uptime.</p>
                  </div>
                  <div>
                    <h5 className="text-white font-bold mb-2 underline">Optimistic UI</h5>
                    <p className="text-slate-400 text-[10px] uppercase tracking-tighter">Latência zero: feedbacks visuais imediatos antes da confirmação do servidor.</p>
                  </div>
                  <div>
                    <h5 className="text-white font-bold mb-2 underline">Web Serial API</h5>
                    <p className="text-slate-400 text-[10px] uppercase tracking-tighter">Driver nativo para impressoras térmicas ESC/POS sem necessidade de bridge externa.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-emerald-500 font-bold">$ botequista --status</p>
                <div className="flex items-center gap-4 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                   <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                   <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">System Ready: Production Build v4.0.0 Stable</p>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => setIsNerdModalOpen(false)}
                  className="w-full py-4 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all rounded-xl uppercase font-bold text-xs"
                >
                  Fechar Kernel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Terms Modal */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md" onClick={() => setIsTermsModalOpen(false)} />
          <div className="relative bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Termos de Uso</h3>
              <button onClick={() => setIsTermsModalOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto no-scrollbar text-slate-400 text-sm space-y-6 leading-relaxed">
              <p>Bem-vindo ao <strong>Botequista</strong>. Ao utilizar nosso sistema, você concorda com os seguintes termos:</p>
              
              <section className="space-y-2">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">1. Status de Versão Beta</h4>
                <p>O Botequista encontra-se em fase beta. Isso significa que, embora funcional, o sistema está em constante aprimoramento. O usuário aceita que podem ocorrer instabilidades pontuais e se compromete a reportar bugs encontrados.</p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">2. Propriedade dos Dados</h4>
                <p>Todos os dados de transações, produtos e comandas inseridos são de propriedade exclusiva do estabelecimento usuário. O Botequista atua apenas como processador e custodiante dessas informações.</p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">3. Uso Offline e Sincronização</h4>
                <p>A funcionalidade offline é um recurso de contingência. A sincronização final dos dados depende de uma conexão estável após o período de uso local. O sistema não se responsabiliza por perdas decorrentes de formatação de dispositivos antes da sincronização com a nuvem.</p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">4. Responsabilidade Fiscal</h4>
                <p>O Botequista é uma ferramenta de gestão operacional e financeira interna. A emissão de documentos fiscais e o cumprimento das obrigações tributárias locais permanecem sob total responsabilidade do estabelecimento.</p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md" onClick={() => setIsPrivacyModalOpen(false)} />
          <div className="relative bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Privacidade e Dados</h3>
              <button onClick={() => setIsPrivacyModalOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto no-scrollbar text-slate-400 text-sm space-y-6 leading-relaxed">
              <p>Sua privacidade é prioridade máxima no ecossistema <strong>Botequista</strong>. Nossa política está alinhada com a LGPD:</p>
              
              <section className="space-y-2">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">1. Coleta de Informações</h4>
                <p>Coletamos apenas o estritamente necessário para a operação do bar: dados cadastrais da empresa, e-mail para login, logs de auditoria de operações de caixa e estatísticas de vendas para geração de relatórios.</p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">2. Armazenamento Seguro</h4>
                <p>Os dados são armazenados de forma criptografada em servidores de classe mundial (Google Cloud/Firebase). Informações sensíveis como senhas nunca são armazenadas em texto plano (utilizamos hashing de mão única).</p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">3. Não Compartilhamento</h4>
                <p>O Botequista nunca venderá ou compartilhará seus dados de faturamento ou lista de clientes com terceiros. Seus dados são usados exclusivamente para a sua própria gestão e melhoria técnica do sistema.</p>
              </section>

              <section className="space-y-2">
                <h4 className="text-white font-bold uppercase text-xs tracking-widest">4. Direitos do Usuário</h4>
                <p>Você pode solicitar a exclusão total da sua conta e de todos os dados associados a qualquer momento, o que será processado em até 48 horas úteis, respeitando prazos legais de backup.</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
