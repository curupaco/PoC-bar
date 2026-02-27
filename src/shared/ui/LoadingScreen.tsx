import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const BottleCapIcon = ({ className = "w-32 h-32" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sombra de elevação Material */}
    <circle cx="50" cy="52" r="46" fill="black" fillOpacity="0.1" />
    
    {/* Borda Crimpada (21 Dentes reais) */}
    <path 
      d="M50 4L54.1 8.8L60.3 7.6L63.2 13.1L69.4 13.2L71.1 19.3L77 20.7L77.4 26.9L82.1 29.6L81.2 35.8L84.8 39.8L82.6 45.6L85 51.3L81.6 56.4L82.6 62.6L78.1 66.5L78.1 72.7L72.4 75.3L70.6 81.3L64.8 82.5L61.7 87.9L55.5 87.6L51.3 92.2L46 90.1L40.9 93.3L36.2 89.2L30.1 90.7L26.7 85.5L20.5 85.1L18.4 79.1L12.9 77.1L12.1 70.9L7.2 67.5L7.8 61.3L4 57.1L6.1 51.4L4 45.6L7.2 40.5L6 34.3L10.3 30.2L10.4 24L15.6 21.2L17.2 15.2L23 13.7L25.9 8.2L32.1 8.2L36 3L42.2 4.4L47.3 1.2L50 4Z" 
      fill="#94a3b8" 
    />
    
    {/* Superfície Principal Elevada */}
    <circle cx="50" cy="50" r="39" fill="#cbd5e1" />
    <circle cx="50" cy="50" r="36" fill="#b91c1c" />
    
    {/* Gradiente sutil de luz (Material Overlay) */}
    <circle cx="50" cy="50" r="36" fill="white" fillOpacity="0.05" />

    {/* Letra B - Estilo Brand Bold */}
    <path 
      d="M38 32H54C58 32 61 34 61 38.5C61 41.5 59.5 43.5 57 44.5C60.5 45.5 62.5 48 62.5 52C62.5 57 59 60 54 60H38V32ZM46 38V44H53C54.5 44 55.5 43 55.5 41C55.5 39 54.5 38 53 38H46ZM46 49V55H54C55.5 55 56.5 54 56.5 52C56.5 50 55.5 49 54 49H46Z" 
      fill="white" 
    />
  </svg>
);

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Preparando o barril..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8 animate-bounce duration-[2000ms]">
        <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-150"></div>
        <BottleCapIcon className="w-32 h-32 relative z-10 drop-shadow-2xl" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic animate-pulse">
          {message}
        </h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">
          Botequista Pro System
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;