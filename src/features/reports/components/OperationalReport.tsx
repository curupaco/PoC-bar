
import React from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Theme } from '../../../types';

interface OperationalReportProps {
  reportData: any;
  theme?: Theme;
}

const OperationalReport: React.FC<OperationalReportProps> = ({ reportData, theme }) => {
  const peakHour = reportData.hourlyMap.reduce((prev: any, current: any) => (prev.count > current.count) ? prev : current);
  const isDark = theme === 'dark';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 italic text-center">Fluxo Horário (Volume de Vendas)</h3>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.hourlyMap}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: '900'}} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ backgroundColor: (isDark ? '#020617' : '#fff'), border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '900', color: (isDark ? '#fff' : '#000') }} />
                <Bar dataKey="count" name="VENDAS" radius={[8, 8, 0, 0]}>
                  {reportData.hourlyMap.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.count === peakHour.count && entry.count > 0 ? '#ef4444' : (isDark ? '#1e293b' : '#e2e8f0')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-center space-y-6 shadow-sm">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Pico de Atendimento</p>
        <p className="text-8xl font-black text-red-600 tracking-tighter italic">{peakHour.hour}</p>
        <div className="h-px bg-slate-100 dark:bg-slate-800 mx-auto w-1/2"></div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">Recorde no período: {peakHour.count} comandas/hora</p>
      </div>
    </div>
  );
};

export default OperationalReport;
