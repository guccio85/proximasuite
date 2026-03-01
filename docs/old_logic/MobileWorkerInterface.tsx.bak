

import React, { useState, useRef, useMemo } from 'react';
import { WorkOrder, WorkerAvailability, WorkLog, Language, WorkerPasswords, TimeLog, Department, MobilePermissions } from '../types';
import { User, Clock, Camera, ChevronLeft, LogOut, Search, Loader2, Lock, FileText, Eye, X, History, Check } from 'lucide-react';

interface MobileWorkerInterfaceProps {
  workers: string[];
  orders: WorkOrder[];
  availabilities: WorkerAvailability[];
  workLogs: WorkLog[];
  workerPasswords?: WorkerPasswords;
  onSaveWorkLog: (log: WorkLog) => void;
  onSaveOrderPhoto?: (orderId: string, photoBase64: string) => void;
  language?: Language;
  // NEW PROPS
  departments?: Department[];
  mobilePermissions?: MobilePermissions;
}

// Fallback if settings not loaded yet
const DEFAULT_DEPTS = [
    { id: 'KBW', name: 'KBW', activities: [] },
    { id: 'PLW', name: 'PLW', activities: [] },
    { id: 'MONTAGE', name: 'MONTAGE', activities: [] }
];

export const MobileWorkerInterface: React.FC<MobileWorkerInterfaceProps> = ({ 
  workers, orders, availabilities, workLogs, workerPasswords = {}, onSaveWorkLog, onSaveOrderPhoto, language = 'nl',
  departments = DEFAULT_DEPTS, mobilePermissions = { showClientName: true, allowPhotoUpload: true, allowDrawingsView: true }
}) => {
  // PWA: Check for existing session token (24 hour validity)
  const getInitialLoginState = () => {
    const savedWorker = localStorage.getItem('snep_mobile_worker');
    const savedTimestamp = localStorage.getItem('snep_mobile_login_timestamp');
    
    if (savedWorker && savedTimestamp) {
      const loginTime = parseInt(savedTimestamp, 10);
      const now = Date.now();
      const hoursElapsed = (now - loginTime) / (1000 * 60 * 60);
      
      // Auto-login if session is still valid (less than 24 hours)
      if (hoursElapsed < 24) {
        return { worker: savedWorker, step: 'logged-in' as const };
      }
    }
    return { worker: null, step: 'select' as const };
  };

  const initialState = getInitialLoginState();
  
  const [selectedWorker, setSelectedWorker] = useState<string | null>(initialState.worker);
  const [loginStep, setLoginStep] = useState<'select' | 'password' | 'logged-in'>(initialState.step);
  const [tempWorker, setTempWorker] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hourInputs, setHourInputs] = useState<Record<string, string>>({}); // Changed to dynamic record
  const [description, setDescription] = useState('');

  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
        nl: { mobile_title: "SNEP Mobiel", select_name: "Selecteer uw naam", enter_password: "Wachtwoord", back: "Terug", login_btn: "Inloggen", search_placeholder: "Zoek order...", logout: "Uitloggen", project_label: "Project", add_photo: "FOTO TOEVOEGEN", view_drawings: "TEKENINGEN", log_hours_title: "Uren Schrijven", total_label: "TOTAAL", save_btn: "OPSLAAN", my_history: "MIJN HISTORIE", no_logs: "Geen uren gevonden.", saved_msg: "Gegevens opgeslagen!", wrong_password: "Wachtwoord onjuist", hidden: "***" },
        en: { mobile_title: "SNEP Mobile", select_name: "Select name", enter_password: "Password", back: "Back", login_btn: "Login", search_placeholder: "Search...", logout: "Logout", project_label: "Project", add_photo: "ADD PHOTO", view_drawings: "DRAWINGS", log_hours_title: "Log Hours", total_label: "TOTAL", save_btn: "SAVE", my_history: "MY HISTORY", no_logs: "No logs found.", saved_msg: "Data saved!", wrong_password: "Incorrect password", hidden: "***" },
        it: { mobile_title: "SNEP Mobile", select_name: "Scegli il tuo nome", enter_password: "Password", back: "Indietro", login_btn: "Accedi", search_placeholder: "Cerca ordine...", logout: "Esci", project_label: "Progetto", add_photo: "AGGIUNGI FOTO", view_drawings: "DISEGNI", log_hours_title: "Registra Ore", total_label: "TOTALE", save_btn: "SALVA", my_history: "MIE ORE", no_logs: "Nessun log trovato.", saved_msg: "Dati salvati!", wrong_password: "Password errata", hidden: "***" }
    };
    return dict[language]?.[key] || key;
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault(); if (!tempWorker) return;
    if (!workerPasswords[tempWorker] || passwordInput === workerPasswords[tempWorker]) { 
        setSelectedWorker(tempWorker); 
        localStorage.setItem('snep_mobile_worker', tempWorker);
        // PWA: Save login timestamp for 24-hour auto-login
        localStorage.setItem('snep_mobile_login_timestamp', Date.now().toString());
        setLoginStep('logged-in');
        setTempWorker(null); 
    } else setLoginError(t('wrong_password'));
  };

  const calculateTotalHours = () => { let total = 0; Object.values(hourInputs).forEach(v => { const n = parseFloat(v as string); if (!isNaN(n)) total += n; }); return total; };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault(); 
    const total = calculateTotalHours(); 
    if (!selectedWorker || !selectedOrder || total <= 0) return;
    
    // Create separate logs for each category if multiple are filled
    Object.entries(hourInputs).forEach(([catId, val]) => {
        const hours = parseFloat(val as string);
        if (hours > 0) {
            onSaveWorkLog({ 
                id: Math.random().toString(36).substr(2,9), 
                orderId: selectedOrder.id, 
                worker: selectedWorker, 
                date: new Date().toISOString().split('T')[0], 
                hours: hours, 
                note: description, 
                timestamp: Date.now(),
                category: catId 
            });
        }
    });

    alert(t('saved_msg')); 
    setHourInputs({}); 
    setDescription('');
  };

  const myLogsForOrder = useMemo(() => {
      if (!selectedOrder || !selectedWorker) return [];
      return (selectedOrder.timeLogs || []).filter(l => l.worker === selectedWorker).sort((a,b) => b.timestamp - a.timestamp);
  }, [selectedOrder, selectedWorker]);

  if (!selectedWorker) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
            {loginStep === 'select' ? (
                <div className="text-center">
                    <h1 className="text-xl font-bold mb-4">{t('mobile_title')}</h1>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {workers.map(w => (<button key={w} onClick={() => { setTempWorker(w); setLoginStep('password'); }} className="w-full p-4 bg-gray-50 border rounded-xl font-bold text-left flex items-center gap-3">{w}</button>))}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleVerifyPassword} className="space-y-4">
                    <button type="button" onClick={() => setLoginStep('select')} className="text-blue-600 text-xs font-bold flex items-center gap-1"><ChevronLeft size={16}/> {t('back')}</button>
                    <h2 className="font-bold text-center">{tempWorker}</h2>
                    <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-4 border rounded-xl text-center text-2xl tracking-widest" placeholder="••••" autoFocus />
                    {loginError && <p className="text-red-600 text-xs font-bold text-center">{loginError}</p>}
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg">{t('login_btn')}</button>
                </form>
            )}
        </div>
      </div>
    );
  }

  if (selectedOrder) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-slate-900 text-white p-4 sticky top-0 z-30 flex items-center gap-4">
                <button onClick={() => setSelectedOrder(null)}><ChevronLeft size={28} /></button>
                <div className="overflow-hidden">
                    <h2 className="font-black text-xl truncate">{selectedOrder.orderNumber}</h2>
                    {/* Admin Permission Check: Hide Client Name */}
                    <p className="text-xs text-blue-200 truncate">
                        {mobilePermissions.showClientName ? selectedOrder.opdrachtgever : t('hidden')}
                    </p>
                </div>
            </header>
            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="font-bold mb-3 flex items-center gap-2"><Clock size={20} className="text-orange-500"/> {t('log_hours_title')}</h3>
                    <form onSubmit={handleSaveLog} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Dynamic Departments from Settings */}
                            {departments.map(cat => (
                                <div key={cat.id} className="bg-gray-50 p-2 rounded-lg border text-center">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase truncate" title={cat.name}>{cat.name}</label>
                                    <input 
                                        type="number" step="0.5" 
                                        value={hourInputs[cat.id] || ''} 
                                        onChange={e => setHourInputs({...hourInputs, [cat.id]: e.target.value})} 
                                        className="w-full p-2 bg-white rounded text-center font-bold" 
                                    />
                                </div>
                            ))}
                        </div>
                        <input value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-white border rounded-xl text-sm" placeholder="Notitie..." />
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95">{t('save_btn')}</button>
                    </form>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-slate-700 uppercase tracking-widest text-[10px]"><History size={16}/> {t('my_history')}</h3>
                    <div className="space-y-2">
                        {myLogsForOrder.length === 0 ? <p className="text-xs text-gray-400 italic text-center py-4">{t('no_logs')}</p> : myLogsForOrder.map(log => (
                            <div key={log.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-100">
                                <div><p className="text-xs font-bold text-gray-800">{new Date(log.timestamp).toLocaleDateString(language)}</p><p className="text-[10px] text-gray-500 truncate max-w-[180px]">{log.note || '-'}</p></div>
                                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-black text-sm">{log.hours}h</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-8">
                    {/* Admin Permission Check: Allow Drawings View */}
                    {mobilePermissions.allowDrawingsView && (
                         <button className="bg-white border-2 border-blue-500 text-blue-600 font-bold p-4 rounded-2xl flex flex-col items-center gap-2"><FileText size={24}/> {t('view_drawings')}</button>
                    )}
                    {/* Admin Permission Check: Allow Photo Upload */}
                    {mobilePermissions.allowPhotoUpload && (
                        <button className="bg-blue-600 text-white font-bold p-4 rounded-2xl flex flex-col items-center gap-2"><Camera size={24}/> {t('add_photo')}</button>
                    )}
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white p-4 sticky top-0 z-30 border-b flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black">{selectedWorker.substring(0,2).toUpperCase()}</div><h1 className="font-bold">{selectedWorker}</h1></div>
        <button onClick={() => { setSelectedWorker(null); setLoginStep('select'); localStorage.removeItem('snep_mobile_worker'); localStorage.removeItem('snep_mobile_login_timestamp'); }} className="text-red-500 text-xs font-bold uppercase">{t('logout')}</button>
      </header>
      <div className="p-4 sticky top-[72px] bg-white border-b"><div className="relative"><Search className="absolute left-3 top-3 text-gray-400" size={20}/><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('search_placeholder')} className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl outline-none" /></div></div>
      <div className="flex-1 p-4 space-y-3 pb-10">
          {orders.filter(o => o.orderNumber.includes(searchTerm) || o.opdrachtgever.toLowerCase().includes(searchTerm.toLowerCase())).map(o => (
              <div key={o.id} onClick={() => setSelectedOrder(o)} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 active:bg-gray-50">
                  <h3 className="font-black text-2xl text-blue-900">{o.orderNumber}</h3>
                  {/* Admin Permission Check */}
                  <p className="font-bold text-gray-800">{mobilePermissions.showClientName ? o.opdrachtgever : t('hidden')}</p>
                  <p className="text-xs text-gray-400 truncate">{o.projectRef || '-'}</p>
              </div>
          ))}
      </div>
    </div>
  );
};
