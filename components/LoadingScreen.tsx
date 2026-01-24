
import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Preparando o barril..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Container da Caneca */}
      <div className="relative w-32 h-40 mb-8 scale-110">
        {/* SVG da Caneca (Contorno e Alça) */}
        <svg viewBox="0 0 100 120" className="w-full h-full fill-none stroke-white stroke-[4]" strokeLinecap="round" strokeLinejoin="round">
          {/* Alça */}
          <path d="M75 35 C 90 35, 95 45, 95 60 C 95 75, 90 85, 75 85" />
          {/* Corpo da Caneca */}
          <path d="M20 20 L75 20 L75 100 L20 100 Z" />
          {/* Linhas de brilho no vidro */}
          <path d="M30 30 L30 90" className="opacity-20" />
          <path d="M40 30 L40 90" className="opacity-20" />
          <path d="M50 30 L50 90" className="opacity-20" />
        </svg>

        {/* Efeito de Preenchimento (Cerveja) */}
        <div className="absolute bottom-[24px] left-[24px] right-[29px] overflow-hidden rounded-b-sm">
          <div className="bg-amber-500 w-full animate-beer-fill shadow-[0_-5px_15px_rgba(245,158,11,0.5)]">
            {/* Espuma */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-white flex justify-around items-end px-1">
               <div className="w-3 h-3 bg-white rounded-full -mb-1 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
               <div className="w-4 h-4 bg-white rounded-full -mb-1.5 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
               <div className="w-2 h-2 bg-white rounded-full -mb-0.5 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
               <div className="w-4 h-4 bg-white rounded-full -mb-1 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Texto de Feedback */}
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic animate-pulse">
          {message}
        </h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">
          Botequista Pro System
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes beer-fill {
          0% { height: 0%; }
          50% { height: 90%; }
          100% { height: 100%; }
        }
        .animate-beer-fill {
          animation: beer-fill 2s ease-in-out infinite alternate;
        }
      `}} />
    </div>
  );
};

export default LoadingScreen;
