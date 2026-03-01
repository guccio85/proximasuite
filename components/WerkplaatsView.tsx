
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WorkOrder, OrderStatus, Language, TimeLog, WorkLog, WorkerPasswords, Department, MobilePermissions } from '../types';
import { Search, Calendar, MapPin, Hash, User, RefreshCw, AlertCircle, CheckCircle, Clock, Info, Hammer, PaintBucket, Layers, Wrench, Truck, LogOut, Lock, ChevronLeft, Plus, Save, ArrowRight, Check, Trash2, Camera, FileText, Eye, X, Box } from 'lucide-react';

// Declare model-viewer web component for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        'auto-rotate'?: boolean | string;
        'camera-controls'?: boolean | string;
        ar?: boolean | string;
        style?: React.CSSProperties;
      };
    }
  }
}

interface WerkplaatsViewProps {
  orders: WorkOrder[];
  lastUpdated: Date;
  workers?: string[]; 
  workerPasswords?: WorkerPasswords; 
  onSaveOrder?: (order: WorkOrder) => void; 
  onDeleteLog?: (orderId: string, logId: string) => void;
  onSaveOrderPhoto?: (orderId: string, photo: Blob) => void;
  onFetchOrderDetail?: (orderId: string) => Promise<WorkOrder | null>;
  onSaveWorkLog?: (orderId: string, log: TimeLog) => void;
  language?: Language;
  departments?: Department[];
  mobilePermissions?: MobilePermissions;
  theme?: 'gold' | 'space';
}

export const WerkplaatsView: React.FC<WerkplaatsViewProps> = ({ 
    orders, lastUpdated, workers = [], workerPasswords = {}, onSaveOrder, onDeleteLog, onSaveOrderPhoto, onFetchOrderDetail, onSaveWorkLog, language = 'nl', departments = [], mobilePermissions, theme = 'gold'
}) => {
  // Internal language state — persisted in localStorage, initialized from prop or saved pref
  const [lang, setLang] = useState<Language>(() => {
    try { return (localStorage.getItem('snep_lang') as Language) || language; } catch { return language; }
  });
  useEffect(() => {
    try { localStorage.setItem('snep_lang', lang); } catch {};
  }, [lang]);

  // Theme persistence
  const [selectedTheme, setSelectedTheme] = useState<'gold' | 'space' | 'light'>(() => {
    const savedTheme = localStorage.getItem('werkplaats_theme');
    return (savedTheme as 'gold' | 'space' | 'light') || theme || 'gold';
  });

  useEffect(() => {
    localStorage.setItem('werkplaats_theme', selectedTheme);
  }, [selectedTheme]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  
  const [loggedInWorker, setLoggedInWorker] = useState<string | null>(() => {
    // PWA: Check for existing session (24-hour validity)
    try {
      const saved = localStorage.getItem('snep_werkplaats_worker');
      const ts = localStorage.getItem('snep_werkplaats_ts');
      if (saved && ts && (Date.now() - parseInt(ts, 10)) < 86400000) return saved;
    } catch {}
    return null;
  });
  const [loginStep, setLoginStep] = useState<'select' | 'password'>('select');
  const [selectedLoginWorker, setSelectedLoginWorker] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [selectedOrderForLog, setSelectedOrderForLog] = useState<WorkOrder | null>(null);
  const [logHours, setLogHours] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logNote, setLogNote] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState<Department | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const [reportReadyMode, setReportReadyMode] = useState(false);
  const [readyNote, setReadyNote] = useState('');

  // Media Viewer State
  const [viewingMedia, setViewingMedia] = useState<string | null>(null);
  const [viewingModel, setViewingModel] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ridimensiona e comprime un'immagine, ritorna un Blob pronto per l'upload
  const resizeAndCompressToBlob = (file: File, maxSize = 1200, quality = 0.78): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round((height / width) * maxSize); width = maxSize; }
          else { width = Math.round((width / height) * maxSize); height = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Legacy: ritorna base64 (mantenuto per compatibilità)
  const resizeAndCompress = (file: File, maxSize = 1200, quality = 0.78): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round((height / width) * maxSize); width = maxSize; }
          else { width = Math.round((width / height) * maxSize); height = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
        nl: { title: "Werkplaats Overzicht", search_placeholder: "Zoek op nummer...", updated: "Geüpdatet:", no_results: "Geen orders gevonden.", mat: "Mat", beh: "Beh", desc: "Omschrijving", plan: "Planning", login_title: "Werkplaats", select_name: "Selecteer uw naam", enter_pass: "Wachtwoord", login: "Inloggen", logout: "Uitloggen", back: "Terug", wrong_pass: "Wachtwoord onjuist", log_hours: "Uren Registreren", date: "Datum", hours: "Uren", note: "Notitie", save_log: "Opslaan", log_history: "Uren", total_hours: "Totaal", select_category: "Afdeling", select_activity: "Activiteit", report_ready: "GEREED", report_ready_desc: "Laat een bericht achter.", confirm_ready: "Bevestig", cancel: "Annuleren", delete_confirm: "Verwijderen?", hidden: "*** (Verborgen)", photos: "Foto's", drawings: "Tekeningen", uploadPhoto: "Foto Verzenden", no_photos: "Geen foto's.", no_drawings: "Geen tekeningen.", drawings_loaded: "Tekening", model_3d: "3D Model", view_3d: "3D Bekijken", no_model: "Geen 3D model." },
        en: { title: "Workshop Overview", search_placeholder: "Search...", updated: "Updated:", no_results: "No orders.", mat: "Mat", beh: "Trt", desc: "Desc", plan: "Plan", login_title: "Workshop", select_name: "Select name", enter_pass: "Password", login: "Login", logout: "Logout", back: "Back", wrong_pass: "Incorrect", log_hours: "Log Hours", date: "Date", hours: "Hrs", note: "Note", save_log: "Save", log_history: "Logs", total_hours: "Total", select_category: "Dept.", select_activity: "Activity", report_ready: "READY", report_ready_desc: "Leave a note.", confirm_ready: "Confirm", cancel: "Cancel", delete_confirm: "Delete?", hidden: "*** (Hidden)", photos: "Photos", drawings: "Drawings", uploadPhoto: "Send Photo", no_photos: "No photos.", no_drawings: "No drawings.", drawings_loaded: "Drawing", model_3d: "3D Model", view_3d: "View 3D", no_model: "No 3D model." },
        it: { title: "Officina", search_placeholder: "Cerca...", updated: "Aggiornato:", no_results: "Nessun ordine.", mat: "Mat", beh: "Tratt", desc: "Desc", plan: "Piano", login_title: "Login", select_name: "Seleziona nome", enter_pass: "Password", login: "Accedi", logout: "Esci", back: "Indietro", wrong_pass: "Errata", log_hours: "Ore", date: "Data", hours: "Ore", note: "Nota", save_log: "Salva", log_history: "Storico", total_hours: "Tot", select_category: "Reparto", select_activity: "Attività", report_ready: "PRONTO", report_ready_desc: "Lascia una nota.", confirm_ready: "Conferma", cancel: "Annulla", delete_confirm: "Eliminare?", hidden: "*** (Nascosto)", photos: "Foto", drawings: "Disegni", uploadPhoto: "Invia Foto", no_photos: "Nessuna foto.", no_drawings: "Nessun disegno.", drawings_loaded: "Disegno", model_3d: "Modello 3D", view_3d: "Vedi 3D", no_model: "Nessun modello 3D." },
        pl: { title: "Przegląd Warsztatu", search_placeholder: "Szukaj numeru...", updated: "Zaktualizowano:", no_results: "Brak zleceń.", mat: "Mat", beh: "Obr", desc: "Opis", plan: "Plan", login_title: "Warsztat", select_name: "Wybierz imię", enter_pass: "Hasło", login: "Zaloguj", logout: "Wyloguj", back: "Powrót", wrong_pass: "Błędne hasło", log_hours: "Rejestruj Godziny", date: "Data", hours: "Godz", note: "Uwaga", save_log: "Zapisz", log_history: "Historia", total_hours: "Łącznie", select_category: "Dział", select_activity: "Aktywność", report_ready: "GOTOWE", report_ready_desc: "Zostaw wiadomość.", confirm_ready: "Potwierdź", cancel: "Anuluj", delete_confirm: "Usunąć?", hidden: "*** (Ukryte)", photos: "Zdjęcia", drawings: "Rysunki", uploadPhoto: "Wyślij Zdjęcie", no_photos: "Brak zdjęć.", no_drawings: "Brak rysunków.", drawings_loaded: "Rysunek", model_3d: "Model 3D", view_3d: "Zobacz 3D", no_model: "Brak modelu 3D." }
    };
    return dict[lang]?.[key] || key;
  };

  const handleWorkerSelect = (worker: string) => {
      setSelectedLoginWorker(worker); setLoginStep('password'); setLoginError(''); setPasswordInput('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault(); if (!selectedLoginWorker) return;
      const storedPass = workerPasswords[selectedLoginWorker];
      if (storedPass && passwordInput !== storedPass) { setLoginError(t('wrong_pass')); return; }
      setLoggedInWorker(selectedLoginWorker);
      try {
          localStorage.setItem('snep_werkplaats_worker', selectedLoginWorker);
          localStorage.setItem('snep_werkplaats_ts', Date.now().toString());
      } catch {}
  };

  const handleLogout = () => {
      setLoggedInWorker(null); setLoginStep('select'); setSelectedOrderForLog(null); resetLogForm();
      try { localStorage.removeItem('snep_werkplaats_worker'); localStorage.removeItem('snep_werkplaats_ts'); } catch {}
  };

  const resetLogForm = () => {
      setLogHours(''); setLogNote(''); setSelectedCategory(null); setSelectedActivity(null); setReportReadyMode(false); setReadyNote('');
  };

  const handleSaveLog = () => {
      if (!selectedOrderForLog || !onSaveOrder || !loggedInWorker) return;
      if (!logHours || parseFloat(logHours) <= 0) return;

      const newLog: TimeLog = {
          id: Math.random().toString(36).substr(2, 9), worker: loggedInWorker, date: logDate, hours: parseFloat(logHours), note: logNote, timestamp: Date.now(), category: selectedCategory?.id || 'ALGEMEEN', activity: selectedActivity || undefined
      };
      const updatedOrder = { ...selectedOrderForLog, timeLogs: [...(selectedOrderForLog.timeLogs || []), newLog] };
      onSaveOrder(updatedOrder);
      // Also persist to work_logs table so daily report can read it
      onSaveWorkLog?.(selectedOrderForLog.id, newLog);
      resetLogForm();
      setSelectedOrderForLog(updatedOrder); 
  };

  const handleDeleteLogItem = (logId: string) => {
      if (confirm(t('delete_confirm')) && selectedOrderForLog && onDeleteLog) {
          onDeleteLog(selectedOrderForLog.id, logId);
          setSelectedOrderForLog(prev => prev ? ({ ...prev, timeLogs: prev.timeLogs?.filter(l => l.id !== logId) }) : null);
      }
  };

  const handleReportReady = () => {
      if (!selectedOrderForLog || !onSaveOrder) return;
      const updatedOrder = { ...selectedOrderForLog, readyForArchive: true, archiveNote: readyNote ? `${readyNote} (${loggedInWorker})` : `Gereed: ${loggedInWorker}` };
      onSaveOrder(updatedOrder);
      resetLogForm();
      setSelectedOrderForLog(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedOrderForLog || !onSaveOrderPhoto) return;
      try {
          const blob = await resizeAndCompressToBlob(file);
          // Optimistic local preview via object URL (replaced by real URL after upload sync)
          const localPreviewUrl = URL.createObjectURL(blob);
          setSelectedOrderForLog(prev => prev ? ({ ...prev, photos: [...(prev.photos || []), localPreviewUrl] }) : null);
          onSaveOrderPhoto(selectedOrderForLog.id, blob);
      } catch {
          // Fallback: convert to blob via FileReader + fetch
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result && selectedOrderForLog && onSaveOrderPhoto) {
                  fetch(ev.target.result as string).then(r => r.blob()).then(b => {
                      onSaveOrderPhoto(selectedOrderForLog!.id, b);
                  });
              }
          };
          reader.readAsDataURL(file);
      }
      // Reset input per permettere il caricamento della stessa foto
      e.target.value = '';
  };

  // Per-worker permissions — MobilePermissions is Record<workerName, WorkerMobilePermissions>
  const workerPerms = loggedInWorker ? mobilePermissions?.[loggedInWorker] : undefined;

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
        if (filterStatus !== 'ALL') { if (filterStatus === 'ACTIVE' && order.status === OrderStatus.COMPLETED) return false; }
        const term = searchTerm.toLowerCase();
        return (order.orderNumber.toLowerCase().includes(term) || order.opdrachtgever.toLowerCase().includes(term) || (order.projectRef && order.projectRef.toLowerCase().includes(term)));
    }).sort((a, b) => { const dA = a.scheduledDate || '9999'; const dB = b.scheduledDate || '9999'; return dA.localeCompare(dB); });
  }, [orders, searchTerm, filterStatus]);

  const formatDate = (dateStr?: string) => {
      if (!dateStr) return '-';
      try { return new Intl.DateTimeFormat(language === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(dateStr)); } catch { return dateStr; }
  };

  // --- LOGIN SCREEN (THEMED) ---
  if (!loggedInWorker) {
      return (
          <div className={`min-h-screen ${
            selectedTheme === 'gold' ? 'bg-[#0a0a0a]' : 
            selectedTheme === 'space' ? 'bg-[#020617]' :
            'bg-slate-50'
          } flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden`}>
              <div className={`absolute top-[-20%] left-[-20%] w-96 h-96 ${
                selectedTheme === 'gold' ? 'bg-[#d4af37]/10' : 
                selectedTheme === 'space' ? 'bg-[#00f2fe]/10' :
                'bg-blue-100/20'
              } rounded-full blur-[120px] pointer-events-none`}></div>
              
              {/* THEME TOGGLE BUTTON */}
              <button 
                  onClick={() => setSelectedTheme(selectedTheme === 'gold' ? 'space' : selectedTheme === 'space' ? 'light' : 'gold')}
                  className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors z-10 ${
                    selectedTheme === 'gold' ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37]/30' : 
                    selectedTheme === 'space' ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/50 hover:bg-[#00f2fe]/30' :
                    'bg-blue-200 text-blue-700 border border-blue-400 hover:bg-blue-300'
                  }`}
              >
                  {selectedTheme === 'gold' ? '✨ Space' : selectedTheme === 'space' ? '☀️ Light' : '⭐ Gold'}
              </button>
              
              <div className={`${selectedTheme === 'light' ? 'bg-white border-blue-200 shadow-[0_20px_60px_rgba(0,0,0,0.1)]' : 'bg-[#141414]/90 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'} backdrop-blur-2xl border ${selectedTheme === 'gold' ? 'border-[#d4af37]/30' : selectedTheme === 'space' ? 'border-[#00f2fe]/30' : 'border-blue-200'} p-8 rounded-[2rem] w-full max-w-sm relative z-10`}>
                  <div className="text-center mb-8">
                      <div className={`w-16 h-16 bg-gradient-to-br ${selectedTheme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] shadow-[0_0_20px_rgba(212,175,55,0.4)] text-[#0a0a0a]' : selectedTheme === 'space' ? 'from-[#00f2fe] to-[#4facfe] shadow-[0_0_20px_rgba(0,242,254,0.4)] text-[#020617]' : 'from-blue-500 to-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] text-white'} rounded-2xl flex items-center justify-center mx-auto mb-5`}><User size={32} /></div>
                      <h1 className={`text-2xl font-black ${selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-700'} tracking-tight`}>{t('login_title')}</h1>
                  </div>
                  {loginStep === 'select' ? (
                      <div>
                          <p className={`text-sm mb-5 text-center font-medium uppercase tracking-wider ${selectedTheme === 'light' ? 'text-blue-900' : 'text-gray-400'}`}>{t('select_name')}</p>
                          <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                              {workers.length > 0 ? workers.map(w => (
                                  <button key={w} onClick={() => handleWorkerSelect(w)} className={selectedTheme === 'light' ? 'w-full p-4 bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-900 rounded-2xl text-left font-bold transition-all flex items-center gap-4 group shadow-sm' : selectedTheme === 'gold' ? 'w-full p-4 bg-[#0a0a0a]/50 hover:bg-[#d4af37]/10 border border-[#d4af37]/20 text-gray-200 rounded-2xl text-left font-bold transition-all flex items-center gap-4 group shadow-sm' : 'w-full p-4 bg-[#0a0a0a]/50 hover:bg-[#00f2fe]/10 border border-[#00f2fe]/20 text-gray-200 rounded-2xl text-left font-bold transition-all flex items-center gap-4 group shadow-sm'}>
                                      <div className={selectedTheme === 'light' ? 'w-10 h-10 rounded-xl bg-blue-200 text-blue-900 border-blue-400 flex items-center justify-center text-sm border group-hover:scale-105 transition-transform' : selectedTheme === 'gold' ? 'w-10 h-10 rounded-xl bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40 flex items-center justify-center text-sm border group-hover:scale-105 transition-transform' : 'w-10 h-10 rounded-xl bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/40 flex items-center justify-center text-sm border group-hover:scale-105 transition-transform'}>{w.substring(0,2).toUpperCase()}</div>{w}
                                  </button>
                              )) : <p className="text-center text-gray-500 italic">No data.</p>}
                          </div>
                      </div>
                  ) : (
                      <form onSubmit={handleLoginSubmit} className="space-y-5">
                          <button type="button" onClick={() => { setLoginStep('select'); setLoginError(''); }} className={`text-sm ${selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-600'} font-bold flex items-center gap-1 hover:opacity-80 transition-opacity`}><ChevronLeft size={16} /> {t('back')}</button>
                          <div className="mb-6 text-center"><span className={`font-bold text-xl ${selectedTheme === 'light' ? 'text-blue-900' : 'text-gray-200'}`}>{selectedLoginWorker}</span></div>
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">{t('enter_pass')}</label>
                                  <div className="relative"><Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${selectedTheme === 'gold' ? 'text-[#d4af37]/60' : selectedTheme === 'space' ? 'text-[#00f2fe]/60' : 'text-blue-500/60'}`} size={20} /><input type="password" value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setLoginError(''); }} className={`w-full pl-12 pr-4 py-4 ${
                    selectedTheme === 'light' ? 'bg-slate-100 border-blue-300 text-blue-900 focus:ring-blue-500' :
                    'bg-[#0a0a0a] border'
                  } ${selectedTheme === 'gold' ? 'border-[#d4af37]/30 text-[#d4af37] focus:ring-[#d4af37]' : selectedTheme === 'space' ? 'border-[#00f2fe]/30 text-[#00f2fe] focus:ring-[#00f2fe]' : 'border-blue-300 text-blue-900 focus:ring-blue-500'} rounded-2xl focus:ring-1 outline-none text-xl tracking-widest backdrop-blur-md shadow-inner`} placeholder="••••" autoFocus /></div>
                              </div>
                              {loginError && <div className="p-3 bg-red-900/40 text-red-400 border border-red-500/50 rounded-xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} /> {loginError}</div>}
                              <button type="submit" className={`w-full bg-gradient-to-r ${
                                selectedTheme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a] hover:shadow-[0_8px_25px_rgba(212,175,55,0.5)] shadow-[0_8px_20px_rgba(212,175,55,0.3)]' :
                                selectedTheme === 'space' ? 'from-[#00f2fe] to-[#4facfe] text-[#020617] hover:shadow-[0_8px_25px_rgba(0,242,254,0.5)] shadow-[0_8px_20px_rgba(0,242,254,0.3)]' :
                                'from-blue-500 to-blue-600 text-white hover:shadow-[0_8px_25px_rgba(59,130,246,0.5)] shadow-[0_8px_20px_rgba(59,130,246,0.3)]'
                              } font-bold py-4 rounded-2xl transition-all active:scale-[0.98]`}>{t('login')}</button>
                          </div>
                      </form>
                  )}
              </div>
          </div>
      );
  }

  // Merge live order data with full detail (timeLogs/photos/drawings are lazy-loaded)
  const lightOrder = orders.find(o => o.id === selectedOrderForLog?.id);
  const currentOrderLive = selectedOrderForLog
    ? lightOrder
      ? { ...lightOrder, timeLogs: selectedOrderForLog.timeLogs ?? [], photos: selectedOrderForLog.photos ?? [], drawings: selectedOrderForLog.drawings ?? [] }
      : selectedOrderForLog
    : null;

  // --- ORDER DETAILS SCREEN (THEMED) ---
  if (currentOrderLive) {
      const order = currentOrderLive;
      const totalLogged = order.timeLogs?.reduce((sum, log) => sum + log.hours, 0) || 0;

      return (
          <div className={`min-h-screen ${selectedTheme === 'gold' ? 'bg-[#0a0a0a]' : selectedTheme === 'space' ? 'bg-[#020617]' : 'bg-slate-50'} flex flex-col font-sans`}>
              {/* VIEWER OVERLAY */}
              {viewingMedia && (
                  <div className="fixed inset-0 z-[120] bg-black/95 flex flex-col p-4 animate-fade-in backdrop-blur-md">
                      <div className={`flex justify-between items-center mb-6 ${selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-500'} px-2`}>
                          <span className="font-bold text-lg tracking-wide">Media Viewer</span>
                          <button onClick={() => setViewingMedia(null)} className={`p-2 bg-[#141414] rounded-full hover:bg-[${selectedTheme === 'gold' ? '#d4af37' : '#00f2fe'}]/20 transition-colors`}><X size={24}/></button>
                      </div>
                      <div className={`flex-1 overflow-hidden flex items-center justify-center bg-transparent rounded-3xl border ${selectedTheme === 'gold' ? 'border-[#d4af37]/30' : selectedTheme === 'space' ? 'border-[#00f2fe]/30' : 'border-blue-300'}`}>
                          {viewingMedia.startsWith('data:application/pdf') ? (
                              <iframe src={viewingMedia} className="w-full h-full bg-white rounded-2xl border-none"></iframe>
                          ) : (
                              <img src={viewingMedia} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="View" />
                          )}
                      </div>
                  </div>
              )}

              {/* 3D MODEL VIEWER OVERLAY */}
              {viewingModel && (
                  <div className="fixed inset-0 z-[125] bg-black flex flex-col">
                      <div className={`flex justify-between items-center p-4 ${selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-500'}`}>
                          <span className="font-bold text-lg flex items-center gap-2"><Box size={20}/> {t('model_3d')}</span>
                          <button onClick={() => setViewingModel(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={24} className="text-white"/></button>
                      </div>
                      <div className="flex-1">
                          <model-viewer
                              src={viewingModel}
                              alt="3D Model"
                              camera-controls
                              auto-rotate
                              style={{ width: '100%', height: '100%', background: '#111' }}
                          />
                      </div>
                  </div>
              )}

              <header className={`${selectedTheme === 'light' ? 'bg-white' : 'bg-[#141414]/90'} backdrop-blur-xl p-4 shadow-md border-b ${selectedTheme === 'gold' ? 'border-[#d4af37]/30' : selectedTheme === 'space' ? 'border-[#00f2fe]/30' : 'border-blue-200'} sticky top-0 z-20 flex items-center gap-4`}>
                  <button onClick={() => { setSelectedOrderForLog(null); resetLogForm(); }} className={`p-2 rounded-full border transition-colors ${selectedTheme === 'light' ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 border-blue-300' : selectedTheme === 'gold' ? 'bg-[#0a0a0a] text-[#d4af37] hover:bg-[#d4af37]/20 border-[#d4af37]/30' : 'bg-[#0a0a0a] text-[#00f2fe] hover:bg-[#00f2fe]/20 border-[#00f2fe]/30'}`}><ChevronLeft size={24} /></button>
                  <div className="overflow-hidden flex-1">
                      <h2 className={`font-black text-xl ${selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#ffffff]' : 'text-blue-900'} truncate tracking-tight drop-shadow-sm`}>{order.orderNumber}</h2>
                      {isLoadingDetail && <p className="text-[10px] text-gray-500 animate-pulse mt-0.5">...</p>}
                  </div>
                  {!reportReadyMode ? <button onClick={() => setReportReadyMode(true)} className={`bg-gradient-to-r ${selectedTheme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a] shadow-[0_4px_10px_rgba(212,175,55,0.3)]' : selectedTheme === 'space' ? 'from-[#00f2fe] to-[#4facfe] text-[#020617] shadow-[0_4px_10px_rgba(0,242,254,0.3)]' : 'from-blue-500 to-blue-600 text-white shadow-[0_4px_10px_rgba(59,130,246,0.3)]'} p-2.5 rounded-full hover:scale-105 transition-transform`}><CheckCircle size={18} /></button> : <div className="w-10"></div>}
              </header>

              <div className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full pb-24 overflow-y-auto">
                  {reportReadyMode ? (
                      <div className={`${selectedTheme === 'gold' ? 'bg-[#d4af37]/10 border-[#d4af37]/50' : selectedTheme === 'space' ? 'bg-[#00f2fe]/10 border-[#00f2fe]/50' : 'bg-blue-50 border-blue-200'} p-6 rounded-3xl border shadow-sm animate-fade-in backdrop-blur-md`}>
                          <h3 className={`font-bold ${selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-700'} mb-2 flex items-center gap-2 text-lg`}><CheckCircle size={20}/> {t('report_ready')}</h3>
                          <p className={`text-sm mb-4 ${selectedTheme === 'light' ? 'text-blue-800' : 'text-gray-300'}`}>{t('report_ready_desc')}</p>
                          <textarea className={`w-full p-4 ${selectedTheme === 'light' ? 'bg-white border-blue-300 text-blue-900 focus:ring-blue-500' : 'bg-[#0a0a0a] border text-gray-200'} ${selectedTheme === 'gold' ? 'border-[#d4af37]/50 focus:ring-[#d4af37]' : selectedTheme === 'space' ? 'border-[#00f2fe]/50 focus:ring-[#00f2fe]' : 'border-blue-300 focus:ring-blue-500'} rounded-2xl mb-4 text-sm outline-none focus:ring-1 shadow-inner`} placeholder={t('note')} value={readyNote} onChange={(e) => setReadyNote(e.target.value)} rows={3} />
                          <div className="flex gap-3">
                              <button onClick={() => setReportReadyMode(false)} className={`flex-1 py-3 bg-transparent border ${selectedTheme === 'gold' ? 'border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/20' : selectedTheme === 'space' ? 'border-[#00f2fe]/50 text-[#00f2fe] hover:bg-[#00f2fe]/20' : 'border-blue-400 text-blue-600 hover:bg-blue-50'} font-bold rounded-2xl text-sm transition-colors`}>{t('cancel')}</button>
                              <button onClick={handleReportReady} className={`flex-1 py-3 bg-gradient-to-r ${selectedTheme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a] shadow-[0_4px_15px_rgba(212,175,55,0.3)]' : selectedTheme === 'space' ? 'from-[#00f2fe] to-[#4facfe] text-[#020617] shadow-[0_4px_15px_rgba(0,242,254,0.3)]' : 'from-blue-500 to-blue-600 text-white shadow-[0_4px_15px_rgba(59,130,246,0.3)]'} font-bold rounded-2xl text-sm active:scale-95 transition-transform`}>{t('confirm_ready')}</button>
                          </div>
                      </div>
                  ) : (
                      <>
                        <div className={`${selectedTheme === 'light' ? 'bg-blue-50 backdrop-blur-md border-blue-200' : 'bg-[#141414]/80 backdrop-blur-md'} p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border ${selectedTheme === 'gold' ? 'border-[#d4af37]/20' : selectedTheme === 'space' ? 'border-[#00f2fe]/20' : 'border-blue-200'}`}>
                            <h3 className={`font-black text-lg ${selectedTheme === 'light' ? 'text-blue-900' : 'text-gray-200'} mb-1.5 truncate`}>
                                {workerPerms?.showClientName ? order.opdrachtgever : t('hidden')}
                            </h3>
                            {order.projectRef && <p className={`text-sm ${selectedTheme === 'light' ? 'text-blue-800' : 'text-gray-400'} mb-4 truncate font-medium`}>{order.projectRef}</p>}
                            <div className="flex flex-wrap gap-2">
                                <span className={`text-[11px] ${selectedTheme === 'light' ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-[#0a0a0a] text-gray-300 border-gray-700'} px-3 py-1 rounded-lg font-bold tracking-wide uppercase border`}>{order.material}</span>
                                <span className={`text-[11px] ${selectedTheme === 'gold' ? 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30' : selectedTheme === 'space' ? 'bg-[#00f2fe]/10 text-[#00f2fe] border-[#00f2fe]/30' : 'bg-blue-100 text-blue-700 border-blue-300'} px-3 py-1 rounded-lg font-bold tracking-wide uppercase border truncate max-w-[180px]`}>{order.preservationType}</span>
                            </div>
                        </div>

                        {/* UREN LOGGEN */}
                        <div className={`${selectedTheme === 'light' ? 'bg-blue-50 backdrop-blur-md border-blue-200' : 'bg-[#141414]/80 backdrop-blur-md'} p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border ${selectedTheme === 'gold' ? 'border-[#d4af37]/20' : selectedTheme === 'space' ? 'border-[#00f2fe]/20' : 'border-blue-200'}`}>
                            <h3 className={`font-bold ${selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-900'} flex items-center gap-2 mb-5 text-sm uppercase tracking-widest`}><Clock size={18} /> {t('log_hours')}</h3>
                            
                            {!selectedCategory && (
                                <div>
                                    <p className={`text-[11px] font-bold ${selectedTheme === 'light' ? 'text-blue-900' : 'text-gray-500'} uppercase mb-3`}>{t('select_category')}</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {departments.map(cat => (
                                            <button key={cat.id} onClick={() => setSelectedCategory(cat)} className={`p-3 ${selectedTheme === 'light' ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-[#0a0a0a] text-gray-300 border-gray-700'} border rounded-2xl text-center font-bold hover:border-[${selectedTheme === 'gold' ? '#d4af37' : selectedTheme === 'space' ? '#00f2fe' : 'blue-600'}]/50 text-xs shadow-sm transition-colors`}>{cat.name.split(' ')[0]}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedCategory && !selectedActivity && (
                                <div className="animate-fade-in">
                                    <button onClick={() => setSelectedCategory(null)} className={`text-[11px] ${selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-700'} flex items-center gap-1 mb-4 font-bold uppercase tracking-wider hover:opacity-80 transition-opacity`}><ChevronLeft size={14}/> {t('back')}</button>
                                    <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                                        {selectedCategory.activities.map(act => (
                                            <button key={act} onClick={() => setSelectedActivity(act)} className={`w-full p-3 ${selectedTheme === 'light' ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-[#0a0a0a] text-gray-300 border-gray-700'} border rounded-2xl font-bold hover:border-[${selectedTheme === 'gold' ? '#d4af37' : selectedTheme === 'space' ? '#00f2fe' : 'blue-600'}]/50 text-xs transition-colors shadow-sm text-center`}>{act}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedCategory && selectedActivity && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className={`flex items-center justify-between ${selectedTheme === 'gold' ? 'bg-[#d4af37]/10 border-[#d4af37]/30' : 'bg-[#00f2fe]/10 border-[#00f2fe]/30'} p-3 rounded-2xl border`}>
                                        <div><span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">{selectedCategory.name}</span><span className={`text-sm font-black ${selectedTheme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>{selectedActivity}</span></div>
                                        <button onClick={() => setSelectedActivity(null)} className={`p-2 hover:bg-[${selectedTheme === 'gold' ? '#d4af37' : '#00f2fe'}]/20 rounded-full transition-colors`}><RefreshCw size={16} className={selectedTheme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}/></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 pl-1">{t('date')}</label><input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className={`w-full p-3 bg-[#0a0a0a] border border-gray-700 text-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[${selectedTheme === 'gold' ? '#d4af37' : '#00f2fe'}] shadow-inner`}/></div>
                                        <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 pl-1">{t('hours')}</label><input type="number" step="0.5" value={logHours} onChange={(e) => setLogHours(e.target.value)} className={`w-full p-3 bg-[#0a0a0a] border border-gray-700 ${selectedTheme === 'gold' ? 'text-[#d4af37] focus:border-[#d4af37]' : 'text-[#00f2fe] focus:border-[#00f2fe]'} rounded-xl font-black text-center text-lg outline-none shadow-inner`} placeholder="0.0" autoFocus /></div>
                                    </div>
                                    <input type="text" value={logNote} onChange={(e) => setLogNote(e.target.value)} className={`w-full p-3 bg-[#0a0a0a] border border-gray-700 text-gray-200 rounded-xl text-sm outline-none focus:border-[${selectedTheme === 'gold' ? '#d4af37' : '#00f2fe'}] shadow-inner`} placeholder={t('note')} />
                                    <button onClick={handleSaveLog} disabled={!logHours} className={`w-full bg-gradient-to-r ${selectedTheme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a] shadow-[0_8px_20px_rgba(212,175,55,0.3)] hover:from-[#e5c558] hover:to-[#c4a53d]' : 'from-[#00f2fe] to-[#4facfe] text-[#020617] shadow-[0_8px_20px_rgba(0,242,254,0.3)] hover:from-[#33ffff] hover:to-[#6fc3ff]'} font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.98] transition-transform`}><Save size={18} /> {t('save_log')}</button>
                                </div>
                            )}
                        </div>

                        {/* MEDIA & FILES SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* PHOTOS */}
                            {workerPerms?.allowPhotoUpload && (
                                <div className={`${selectedTheme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-[#141414]/80 border-[#d4af37]/20'} backdrop-blur-md p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border ${selectedTheme === 'space' ? 'border-[#00f2fe]/20' : ''}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className={`font-bold ${selectedTheme === 'light' ? 'text-blue-900' : 'text-gray-300'} flex items-center gap-2 text-xs uppercase tracking-widest`}><Camera size={16} className={selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-600'}/> {t('photos')}</h3>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                                        <button onClick={() => fileInputRef.current?.click()} className={`text-[10px] ${selectedTheme === 'gold' ? 'bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30' : 'bg-[#00f2fe]/10 hover:bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/30'} px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 border transition-colors`}><Plus size={12}/> {t('uploadPhoto')}</button>
                                    </div>
                                    {order.photos && order.photos.length > 0 ? (
                                        <div className="flex overflow-x-auto gap-3 pb-2 snap-x custom-scrollbar">
                                            {order.photos.map((img, i) => (
                                                <img key={i} src={img} onClick={() => setViewingMedia(img)} className="w-16 h-16 object-cover rounded-xl border border-gray-700 shrink-0 snap-center cursor-pointer shadow-sm hover:opacity-80 transition-opacity" alt="Foto" />
                                            ))}
                                        </div>
                                    ) : <p className={`text-[11px] ${selectedTheme === 'light' ? 'text-blue-700' : 'text-gray-500'} italic px-1`}>{t('no_photos')}</p>}
                                </div>
                            )}

                            {/* DRAWINGS */}
                            {workerPerms?.allowDrawingsView && (
                                <div className={`${selectedTheme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-[#141414]/80 border-[#d4af37]/20'} backdrop-blur-md p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border ${selectedTheme === 'space' ? 'border-[#00f2fe]/20' : ''}`}>
                                    <h3 className={`font-bold ${selectedTheme === 'light' ? 'text-blue-900' : 'text-gray-300'} flex items-center gap-2 text-xs uppercase tracking-widest mb-3`}><FileText size={16} className={selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-600'}/> {t('drawings')}</h3>
                                    {order.drawings && order.drawings.length > 0 ? (
                                        <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                            {order.drawings.map((doc, i) => (
                                                <button key={i} onClick={() => setViewingMedia(doc)} className={`w-full p-2.5 bg-[#0a0a0a] border border-gray-700 rounded-xl flex items-center justify-between hover:border-[${selectedTheme === 'gold' ? '#d4af37' : '#00f2fe'}]/50 transition-colors group`}>
                                                    <span className={`text-[11px] font-bold text-gray-300 flex items-center gap-2 group-hover:text-[${selectedTheme === 'gold' ? '#d4af37' : '#00f2fe'}]`}><FileText size={14} className={selectedTheme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}/> {t('drawings_loaded')} #{i+1}</span>
                                                    <Eye size={16} className={`text-gray-500 group-hover:text-[${selectedTheme === 'gold' ? '#d4af37' : '#00f2fe'}]`}/>
                                                </button>
                                            ))}
                                        </div>
                                    ) : <p className={`text-[11px] ${selectedTheme === 'light' ? 'text-blue-700' : 'text-gray-500'} italic px-1`}>{t('no_drawings')}</p>}
                                </div>
                            )}
                        </div>

                        {/* 3D MODEL SECTION */}
                        {order.glbUrl && (
                            <div className={`${selectedTheme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-[#141414]/80 border-[#d4af37]/20'} backdrop-blur-md p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border ${selectedTheme === 'space' ? 'border-[#00f2fe]/20' : ''}`}>
                                <div className="flex justify-between items-center">
                                    <h3 className={`font-bold ${selectedTheme === 'light' ? 'text-blue-900' : 'text-gray-300'} flex items-center gap-2 text-xs uppercase tracking-widest`}><Box size={16} className={selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-600'}/> {t('model_3d')}</h3>
                                    <button onClick={() => setViewingModel(order.glbUrl!)} className={`text-[10px] ${selectedTheme === 'gold' ? 'bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30' : 'bg-[#00f2fe]/10 hover:bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/30'} px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 border transition-colors`}><Eye size={12}/> {t('view_3d')}</button>
                                </div>
                            </div>
                        )}

                        {/* HISTORY */}
                        {order.timeLogs && order.timeLogs.length > 0 && (
                            <div className={`${selectedTheme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-[#141414]/80 border-[#d4af37]/20'} backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border ${selectedTheme === 'space' ? 'border-[#00f2fe]/20' : ''} overflow-hidden`}>
                                <div className={`p-4 ${selectedTheme === 'light' ? 'bg-blue-100 border-blue-300' : 'bg-[#0a0a0a]/80 border-gray-800'} border-b flex justify-between items-center`}>
                                    <h4 className={`font-bold text-xs uppercase tracking-widest ${selectedTheme === 'light' ? 'text-blue-900' : 'text-gray-400'}`}>{t('log_history')}</h4>
                                    <span className={`text-[11px] font-black ${selectedTheme === 'gold' ? 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30' : 'bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/30'} px-3 py-1 rounded-full border`}>{totalLogged}h</span>
                                </div>
                                <div className={`${selectedTheme === 'light' ? 'divide-blue-200' : 'divide-gray-800'} max-h-[250px] overflow-y-auto custom-scrollbar`}>
                                    {order.timeLogs.slice().reverse().map((log) => (
                                        <div key={log.id} className={`p-3 flex justify-between items-center transition-colors ${selectedTheme === 'light' ? 'hover:bg-blue-100' : 'hover:bg-[#0a0a0a]'}`}>
                                            <div className="min-w-0 pr-2">
                                                <div className={`font-bold flex items-center gap-2 text-sm truncate mb-0.5 ${selectedTheme === 'light' ? 'text-blue-900' : 'text-gray-200'}`}>
                                                    {log.worker}
                                                    {(log.activity || log.category) && <span className={`text-[9px] ${selectedTheme === 'light' ? 'bg-blue-200 text-blue-900 border-blue-300' : 'bg-gray-800 text-gray-400 border-gray-700'} px-1.5 py-0.5 rounded-md border uppercase tracking-wide`}>{log.activity || log.category}</span>}
                                                </div>
                                                <div className={`${selectedTheme === 'light' ? 'text-blue-800' : 'text-gray-500'} text-[10px] truncate max-w-[200px] font-medium`}>{formatDate(log.date)} {log.note && <span className="italic ml-1 opacity-80">• {log.note}</span>}</div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className={`font-black ${selectedTheme === 'gold' ? 'text-[#d4af37] bg-[#d4af37]/10 border-[#d4af37]/30' : 'text-[#00f2fe] bg-[#00f2fe]/10 border-[#00f2fe]/30'} px-2 py-1 rounded-lg text-sm border`}>{log.hours}h</div>
                                                {log.worker === loggedInWorker && <button onClick={() => handleDeleteLogItem(log.id)} className="p-1.5 text-red-500 hover:bg-red-900/50 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16} /></button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                      </>
                  )}
              </div>
          </div>
      );
  }

  // --- MAIN LIST (THEMED) ---
  return (
    <div className={`min-h-screen ${selectedTheme === 'gold' ? 'bg-[#0a0a0a]' : selectedTheme === 'space' ? 'bg-[#020617]' : 'bg-slate-50'} flex flex-col font-sans`}>
      <header className={`${selectedTheme === 'light' ? 'bg-white' : 'bg-[#141414]/90'} backdrop-blur-xl text-white p-5 sticky top-0 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-b ${selectedTheme === 'gold' ? 'border-[#d4af37]/20' : selectedTheme === 'space' ? 'border-[#00f2fe]/20' : 'border-blue-200'} rounded-b-2xl mb-4 mx-2 mt-2`}>
        <div className="flex justify-between items-center mb-3">
            <h1 className={`text-xl font-black flex items-center gap-2 tracking-tight ${selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#ffffff]' : 'text-blue-900'} drop-shadow-md`}><div className={`${selectedTheme === 'light' ? 'bg-blue-100 border-blue-300' : 'bg-[#0a0a0a]'} p-1.5 rounded-lg border ${selectedTheme === 'gold' ? 'border-[#d4af37]/40' : selectedTheme === 'space' ? 'border-[#00f2fe]/40' : ''} shadow-inner`}><Hammer size={20} className={selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-700'}/></div> SNEP</h1>
            <div className="flex items-center gap-2">
                 {/* Language selector */}
                 <div className={`flex items-center gap-0.5 ${selectedTheme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-[#0a0a0a]'} px-1.5 py-1 rounded-xl border ${selectedTheme === 'gold' ? 'border-[#d4af37]/20' : selectedTheme === 'space' ? 'border-[#00f2fe]/20' : 'border-blue-200'}`}>
                   {(['nl','it','pl','en'] as Language[]).map(l => (
                     <button key={l} onClick={() => setLang(l)} className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${lang === l ? (selectedTheme === 'gold' ? 'bg-[#d4af37] text-[#0a0a0a]' : selectedTheme === 'space' ? 'bg-[#00f2fe] text-[#020617]' : 'bg-blue-500 text-white') : (selectedTheme === 'light' ? 'text-blue-400 hover:text-blue-600' : 'text-gray-600 hover:text-gray-300')}`}>{l}</button>
                   ))}
                 </div>
                 <div className={`flex items-center gap-2 ${selectedTheme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-[#0a0a0a]'} px-3 py-1.5 rounded-xl border ${selectedTheme === 'gold' ? 'border-[#d4af37]/20' : selectedTheme === 'space' ? 'border-[#00f2fe]/20' : 'border-blue-200'} shadow-inner`}>
                    <User size={14} className={selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-600'} /><span className={`text-xs font-bold ${selectedTheme === 'light' ? 'text-blue-900' : 'text-gray-200'}`}>{loggedInWorker}</span>
                 </div>
                 <button onClick={handleLogout} className="p-2 bg-red-900/20 text-red-500 rounded-xl hover:bg-red-900/40 transition-colors border border-red-500/30"><LogOut size={16} /></button>
            </div>
        </div>
        <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${selectedTheme === 'gold' ? 'text-[#d4af37]/50' : selectedTheme === 'space' ? 'text-[#00f2fe]/50' : 'text-blue-400'}`} size={18} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search_placeholder')} className={`w-full pl-12 pr-4 py-3.5 rounded-xl ${selectedTheme === 'light' ? 'bg-blue-50 text-blue-900 border-blue-300 placeholder-blue-400' : 'bg-[#0a0a0a] text-white placeholder-gray-600'} text-sm outline-none border ${selectedTheme === 'gold' ? 'border-[#d4af37]/30 focus:border-[#d4af37]' : selectedTheme === 'space' ? 'border-[#00f2fe]/30 focus:border-[#00f2fe]' : 'border-blue-300 focus:border-blue-500'} transition-all shadow-inner font-medium`} />
        </div>
      </header>

      <div className="flex-1 p-3 space-y-4 pb-12 max-w-3xl mx-auto w-full">
         {filteredOrders.length === 0 ? (
             <div className="text-center py-16 text-gray-600">
                 <div className={`${selectedTheme === 'light' ? 'bg-blue-100 border-blue-300' : 'bg-[#141414]'} rounded-full flex items-center justify-center mx-auto mb-4 border ${selectedTheme === 'gold' ? 'border-[#d4af37]/20' : selectedTheme === 'space' ? 'border-[#00f2fe]/20' : 'border-blue-200'} w-16 h-16`}><AlertCircle size={32} className={`opacity-50 ${selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-500'}`}/></div>
                 <p className="text-base font-medium">{t('no_results')}</p>
             </div>
         ) : (
             filteredOrders.map(order => (
                 <div key={order.id} onClick={async () => {
                   if (onFetchOrderDetail) {
                     setIsLoadingDetail(true);
                     try {
                       const detail = await onFetchOrderDetail(order.id);
                       setSelectedOrderForLog(detail || order);
                     } catch { setSelectedOrderForLog(order); }
                     finally { setIsLoadingDetail(false); }
                   } else {
                     setSelectedOrderForLog(order);
                   }
                   resetLogForm();
                 }} className={`${selectedTheme === 'light' ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400' : 'bg-[#141414]/90 backdrop-blur-xl'} p-4 rounded-[1.5rem] ${selectedTheme === 'gold' ? 'shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-[#d4af37]/20 hover:border-[#d4af37]/50' : selectedTheme === 'space' ? 'shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-[#00f2fe]/20 hover:border-[#00f2fe]/50' : 'shadow-[0_4px_15px_rgba(59,130,246,0.2)] border-blue-200'} active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden group border`}>
                     {order.readyForArchive && <div className={`absolute right-0 top-0 bg-gradient-to-r ${selectedTheme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a] border-[#d4af37]' : selectedTheme === 'space' ? 'from-[#00f2fe] to-[#4facfe] text-[#020617] border-[#00f2fe]' : 'from-blue-400 to-blue-600 text-white border-blue-500'} px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl z-10 shadow-sm border-b border-l`}>{t('report_ready')}</div>}

                     <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <span className={`font-mono font-black text-lg ${selectedTheme === 'gold' ? 'text-[#d4af37]' : selectedTheme === 'space' ? 'text-[#00f2fe]' : 'text-blue-600'} drop-shadow-sm block`}>{order.orderNumber}</span>
                            {order.projectRef && <p className={`text-sm truncate font-bold mt-1 ${selectedTheme === 'light' ? 'text-blue-800' : 'text-gray-300'}`}>{order.projectRef}</p>}
                        </div>
                     </div>
                 </div>
             ))
         )}
      </div>
    </div>
  );
};
