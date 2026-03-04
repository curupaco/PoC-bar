
import React from 'react';
import { AuditLog } from '../../../types';

interface AuditReportProps {
    auditLogs: AuditLog[];
}

const AuditReport: React.FC<AuditReportProps> = ({ auditLogs = [] }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-500">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Registro de Auditoria do Sistema (Últimos 7 dias)</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black tracking-widest text-[10px]">
                            <th className="px-10 py-6 whitespace-nowrap">Data / Hora</th>
                            <th className="px-10 py-6 whitespace-nowrap">Responsável</th>
                            <th className="px-10 py-6 whitespace-nowrap">Ação</th>
                            <th className="px-10 py-6">Detalhes da Operação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-10 py-6 whitespace-nowrap">
                                    <span className="block font-black text-slate-700 dark:text-slate-300">{new Date(log.timestamp).toLocaleDateString()}</span>
                                    <span className="text-[8px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </td>
                                <td className="px-10 py-6 whitespace-nowrap font-black text-slate-900 dark:text-white uppercase">@{log.username}</td>
                                <td className="px-10 py-6 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${log.action.includes('SALE') ? 'bg-emerald-100 text-emerald-600' :
                                            log.action.includes('SHIFT') ? 'bg-blue-100 text-blue-600' :
                                                log.action.includes('DELETE') ? 'bg-red-100 text-red-600' :
                                                    'bg-slate-100 text-slate-600'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-10 py-6 font-bold text-slate-500 max-w-md">{log.details}</td>
                            </tr>
                        ))}
                        {auditLogs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-10 py-24 text-center text-slate-400 font-bold uppercase opacity-30 italic">Sem registros de auditoria no momento.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditReport;
