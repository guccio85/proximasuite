
import React from 'react';
import { SystemCheck } from '../types';
import { CheckCircle, XCircle, FolderOpen, HardDrive } from 'lucide-react';

interface SystemStatusProps {
  checks: SystemCheck[];
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ checks }) => {
  // Filtra solo le cartelle desktop rilevanti (se uno ha Desktop non ha Scrivania e viceversa solitamente, ma mostriamo tutto per chiarezza)
  const relevantChecks = checks; 

  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
      <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
        <h3 className="font-bold text-blue-900 flex items-center gap-2">
            <HardDrive size={18} />
            Systeem Installatie Status (Pictogram Bestand)
        </h3>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Linux Check</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                    <th className="px-4 py-2">Locatie</th>
                    <th className="px-4 py-2">Pad</th>
                    <th className="px-4 py-2 text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                {relevantChecks.map((check) => (
                    <tr key={check.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                            <FolderOpen size={16} className="text-gray-400"/>
                            {check.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-[300px]" title={check.path}>
                            {check.path}
                        </td>
                        <td className="px-4 py-3 text-center">
                            {check.exists ? (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                    <CheckCircle size={14} /> GEVONDEN
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full opacity-60">
                                    <XCircle size={14} /> MIS
                                </span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-400 italic">
        * Deze tabel toont waar de snelkoppelingen zich bevinden.
      </div>
    </div>
  );
};
