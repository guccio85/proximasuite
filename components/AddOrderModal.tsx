
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, Camera, Loader2, Check, Maximize2, Minimize2, PaintBucket, CalendarClock, Ruler, ClipboardList, Anvil, Layers, Wrench, MapPin, Info, Edit3, Clock, User, BarChart2, PieChart, Coins, Briefcase, Image as ImageIcon, Trash2, FileText, Eye, Plus, Box } from 'lucide-react';
import { WorkOrder, OrderStatus, Language, ExtractedOrderData, Subcontractor } from '../types';
import { parseExcelWorkOrder } from '../services/excelService';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: WorkOrder) => void;
  onUpdateAttachments?: (orderId: string, type: 'photos' | 'drawings', files: string[]) => void;
  onUpdateGlbModel?: (orderId: string, glbUrl: string | null) => void;
  workers?: string[];
  subcontractors?: Subcontractor[];
  editingOrder?: WorkOrder | null;
  language?: Language;
  baseFontSize?: number;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({ isOpen, onClose, onSave, onUpdateAttachments, onUpdateGlbModel, workers = [], subcontractors = [], editingOrder, language = 'nl', baseFontSize = 14 }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'import' | 'hours' | 'photos' | 'drawings' | 'models'>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [viewingDrawing, setViewingDrawing] = useState<string | null>(null);

  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
        nl: {
            new_order: "Nieuwe Order", edit_order: "Order Bewerken", manual: "HANDMATIG", import: "IMPORT EXCEL", hours_logs: "UREN (LOGS)", media: "MEDIA (FOTO'S)", drawings: "TEKENINGEN", models_tab: "3D MODEL", add_model: "MODEL TOEVOEGEN (.GLB)", no_model: "Geen 3D model beschikbaar.", model_uploaded: "Model geüpload", delete_model: "Model Verwijderen", processing: "Gegevens verwerken...", wait: "Even geduld a.u.b.", error_req: "Ordernummer en Opdrachtgever zijn verplicht.", cancel: "Annuleren", save: "Opslaan", save_changes: "Order Bijwerken", excel_title: "Excel Import", excel_sub: "Upload .xlsx of .xls bestanden om data automatisch in te vullen.", choose_file: "Excel Bestand Kiezen", log_date: "Datum", log_worker: "Werknemer", log_cat: "Cat / Activiteit", log_hours: "Uren", log_note: "Notitie", log_total: "Totaal Geregistreerd", no_logs: "Nog geen uren geregistreerd voor deze order.", no_photos: "Geen foto's beschikbaar voor deze order.", delete_photo: "Verwijder Foto", no_drawings: "Geen technische tekeningen beschikbaar.", add_drawing: "BESTAND TOEVOEGEN (PDF/JPG/PNG)", delete_drawing: "Verwijder Bestand", budget_vs_real: "Budget vs Realisatie", worker_summary: "Overzicht per Werknemer", planned: "Begroot", realized: "Gerealiseerd", manual_budget: "Budget Uren (Handmatig)", order_num: "Order Nummer", client: "Opdrachtgever", status: "Status", project: "Project / Werk", address: "Adres", material: "Materiaal", treatment: "CONSERVERING (BEHANDELING)", planning: "Planning & Uitvoering", main_date: "HOOFDDATUM (KALENDER)", del_date: "LEVERDATUM", measure: "Inmeten", start: "START", end: "EIND", executor: "UITVOERDER(S)", team: "PLOEG", desc: "Beschrijving / Notities", select: "Selecteer...", calc_days: "Auto-berekening: Duur (excl. weekend) op basis van budget", staal: "Staal", rvs: "RVS", alu: "Aluminium", andere: "Andere", is_subcontracted: "Partnerbedrijf / Onderaannemer", select_sub: "Partner selecteren", sub_msg: "Order is uitbesteed."
        },
        en: {
            new_order: "New Order", edit_order: "Edit Order", manual: "MANUAL", import: "IMPORT EXCEL", hours_logs: "HOURS (LOGS)", media: "MEDIA (PHOTOS)", drawings: "DRAWINGS", models_tab: "3D MODEL", add_model: "ADD MODEL (.GLB)", no_model: "No 3D model available.", model_uploaded: "Model uploaded", delete_model: "Delete Model", processing: "Processing...", wait: "Wait.", error_req: "Required fields missing.", cancel: "Cancel", save: "Save", save_changes: "Update", excel_title: "Excel Import", excel_sub: "Upload .xlsx or .xls to auto-fill fields.", choose_file: "Choose Excel File", log_date: "Date", log_worker: "Worker", log_cat: "Activity", log_hours: "Hours", log_note: "Note", log_total: "Total", no_logs: "No logs.", no_photos: "No photos.", delete_photo: "Delete Photo", no_drawings: "No drawings.", add_drawing: "ADD FILE (PDF/JPG/PNG)", delete_drawing: "Delete Drawing", budget_vs_real: "Budget vs Actual", worker_summary: "Worker Summary", planned: "Budget", realized: "Actual", manual_budget: "Budget Hours", order_num: "Order #", client: "Client", status: "Status", project: "Project", address: "Address", material: "Material", treatment: "PRESERVATION", planning: "Planning", main_date: "DATE", del_date: "DELIVERY", measure: "Measurement", start: "START", end: "END", executor: "EXECUTOR", team: "TEAM", desc: "Notes", select: "Select...", calc_days: "Auto-calc: Duration (excl. weekend) based on budget", staal: "Steel", rvs: "RVS", alu: "Alu", andere: "Other", is_subcontracted: "Partner / Subcontract", select_sub: "Select Partner", sub_msg: "Subcontracted."
        },
        it: {
            new_order: "Nuovo Ordine", edit_order: "Modifica Ordine", manual: "MANUALE", import: "IMPORTA EXCEL", hours_logs: "ORE (LOGS)", media: "MEDIA (FOTO)", drawings: "DISEGNI", models_tab: "3D MODELLO", add_model: "AGGIUNGI MODELLO (.GLB)", no_model: "Nessun modello 3D disponibile.", model_uploaded: "Modello caricato", delete_model: "Elimina Modello", processing: "Elaborazione...", wait: "Attendere...", error_req: "Numero e Cliente obbligatori.", cancel: "Annulla", save: "Salva", save_changes: "Aggiorna", excel_title: "Importazione Excel", excel_sub: "Carica file .xlsx o .xls per riempire i campi automaticamente.", choose_file: "Scegli File Excel", log_date: "Data", log_worker: "Operaio", log_cat: "Cat", log_hours: "Ore", log_note: "Nota", log_total: "Totale", no_logs: "Nessun log.", no_photos: "Nessuna foto.", delete_photo: "Elimina Foto", no_drawings: "Nessun disegno.", add_drawing: "AGGIUNGI FILE (PDF/JPG/PNG)", delete_drawing: "Elimina Disegno", budget_vs_real: "Budget vs Reale", worker_summary: "Riepilogo", planned: "Previsto", realized: "Reale", manual_budget: "Budget Ore", order_num: "N. Ordine", client: "Cliente", status: "Stato", project: "Progetto", address: "Indirizzo", material: "Materiale", treatment: "TRATTAMENTO", planning: "Planning", main_date: "DATA", del_date: "CONSEGNA", measure: "Misure", start: "INIZIO", end: "FINE", executor: "ESECUTORE", team: "SQUADRA", desc: "Note", select: "Seleziona...", calc_days: "Auto-calcolo: Durata (escl. weekend) basata su budget", staal: "Acciaio", rvs: "Inox", alu: "Alluminio", andere: "Altro", is_subcontracted: "Ditta Esterna / Partner", select_sub: "Seleziona Ditta Esterna", sub_msg: "Lavoro affidato a esterno."
        }
    };
    return dict[language]?.[key] || key;
  };

  // Utility function to scale font sizes based on baseFontSize
  const scaleFontSize = (basePixels: number): number => {
    const defaultBaseFontSize = 14;
    return Math.round((basePixels / defaultBaseFontSize) * baseFontSize);
  };

  const defaultState: Partial<WorkOrder> = {
    orderNumber: '', opdrachtgever: '', projectRef: '', address: '', description: '', scheduledDate: new Date().toISOString().split('T')[0], scheduledEndDate: '', material: 'STAAL', status: OrderStatus.PENDING, hourBudget: { kbw: 0, plw: 0, wvb: 0, montage: 0, rvs: 0, reis: 0 }, thermischVerzinkt: false, stralen: false, stralenPrimer: false, schoopperenPrimer: false, poedercoaten: false, natlakken: false, onbehandeld: false, deliveryDate: '', measurementDate: '', measurementEndDate: '', measurementWorker: '', workPreparationDate: '', workPreparationEndDate: '', workPreparationWorker: '', kbwDate: '', kbwEndDate: '', kbwWorker: '', plwDate: '', plwEndDate: '', plwWorker: '', installationDate: '', installationEndDate: '', installationWorker: '', isSubcontracted: false, subcontractorName: '', subcontractorDeliveryDate: '', photos: [], drawings: []
  };

  const [formData, setFormData] = useState<Partial<WorkOrder>>(defaultState);

  const addWorkDays = (startDateStr: string, daysNeeded: number): string => {
      if (!startDateStr || daysNeeded <= 0) return startDateStr;
      let date = new Date(startDateStr);
      let added = 1;
      while (added < daysNeeded) {
          date.setDate(date.getDate() + 1);
          if (date.getDay() !== 0 && date.getDay() !== 6) added++;
      }
      return date.toISOString().split('T')[0];
  };

  const syncEndDateForTask = useCallback((task: 'wvb' | 'kbw' | 'plw' | 'montage' | 'measure', currentData: Partial<WorkOrder>): Partial<WorkOrder> => {
      const config = {
          wvb: { budget: currentData.hourBudget?.wvb || 0, workers: (currentData.workPreparationWorker || '').split(' + ').filter(Boolean).length, start: currentData.workPreparationDate, endKey: 'workPreparationEndDate' },
          kbw: { budget: currentData.hourBudget?.kbw || 0, workers: (currentData.kbwWorker || '').split(' + ').filter(Boolean).length, start: currentData.kbwDate, endKey: 'kbwEndDate' },
          plw: { budget: currentData.hourBudget?.plw || 0, workers: (currentData.plwWorker || '').split(' + ').filter(Boolean).length, start: currentData.plwDate, endKey: 'plwEndDate' },
          montage: { budget: currentData.hourBudget?.montage || 0, workers: (currentData.installationWorker || '').split(' + ').filter(Boolean).length, start: currentData.installationDate, endKey: 'installationEndDate' },
          measure: { budget: 0, workers: (currentData.measurementWorker || '').split(' + ').filter(Boolean).length, start: currentData.measurementDate, endKey: 'measurementEndDate' }
      }[task];
      
      if (config.start && config.workers > 0) {
          // Calcolo basato su 8 ore per operaio
          const daysNeeded = config.budget > 0 ? Math.ceil(config.budget / (8 * config.workers)) : 1;
          const newEnd = addWorkDays(config.start, daysNeeded);
          return { ...currentData, [config.endKey]: newEnd };
      }
      return currentData;
  }, []);

  // Auto-calculate scheduledEndDate based on total budget and all workers
  const calculateScheduledEndDate = useCallback((currentData: Partial<WorkOrder>): Partial<WorkOrder> => {
      const totalBudget = (currentData.hourBudget?.wvb || 0) + (currentData.hourBudget?.kbw || 0) + 
                         (currentData.hourBudget?.plw || 0) + (currentData.hourBudget?.montage || 0) + 
                         (currentData.hourBudget?.rvs || 0) + (currentData.hourBudget?.reis || 0);
      
      if (!currentData.scheduledDate || totalBudget <= 0) return currentData;
      
      // Count total unique workers
      const allWorkers = new Set([
          ...(currentData.workPreparationWorker || '').split(' + ').filter(Boolean),
          ...(currentData.kbwWorker || '').split(' + ').filter(Boolean),
          ...(currentData.plwWorker || '').split(' + ').filter(Boolean),
          ...(currentData.installationWorker || '').split(' + ').filter(Boolean)
      ]);
      
      const workerCount = allWorkers.size || 1;
      const daysNeeded = Math.ceil(totalBudget / (8 * workerCount));
      const endDate = addWorkDays(currentData.scheduledDate, daysNeeded);
      
      return { ...currentData, scheduledEndDate: endDate };
  }, []);

  useEffect(() => {
      if (isOpen) {
          if (editingOrder) {
              setFormData({ 
                  ...defaultState, 
                  ...editingOrder, 
                  hourBudget: { ...defaultState.hourBudget, ...(editingOrder.hourBudget || {}) }, 
                  drawings: editingOrder.drawings || [],
                  photos: editingOrder.photos || []
              });
              setActiveTab('manual');
          } else {
              setFormData(defaultState);
              setActiveTab('manual');
          }
          setError(null);
      }
  }, [isOpen, editingOrder]);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const glbInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingGlb, setIsUploadingGlb] = useState(false);

  // Ridimensiona e comprime un'immagine prima di salvarla
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
        if (!ctx) { reject(new Error('no canvas')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleGlbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editingOrder) return;
      setIsUploadingGlb(true);
      try {
          const { uploadGlbModel } = await import('../supabaseAPI');
          const url = await uploadGlbModel(editingOrder.id, file);
          if (url) {
              setFormData(prev => ({ ...prev, glbUrl: url }));
              if (onUpdateGlbModel) onUpdateGlbModel(editingOrder.id, url);
          } else {
              setError('Errore upload modello 3D.');
          }
      } catch (err) { setError('Errore upload modello 3D.'); }
      finally { setIsUploadingGlb(false); if (glbInputRef.current) glbInputRef.current.value = ''; }
  };

  const handleDeleteGlbModel = async () => {
      if (!editingOrder || !formData.glbUrl) return;
      try {
          const { deleteGlbModel } = await import('../supabaseAPI');
          await deleteGlbModel(formData.glbUrl);
          setFormData(prev => ({ ...prev, glbUrl: undefined }));
          if (onUpdateGlbModel) onUpdateGlbModel(editingOrder.id, null);
      } catch (err) { setError('Errore eliminazione modello 3D.'); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      setIsLoading(true);
      try {
          const compressed = await Promise.all(files.map(f => resizeAndCompress(f)));
          const newPhotos = [...(formData.photos || []), ...compressed];
          setFormData(prev => ({ ...prev, photos: newPhotos }));
          if (editingOrder && onUpdateAttachments) onUpdateAttachments(editingOrder.id, 'photos', newPhotos);
      } catch (err) { setError('Errore caricamento foto.'); }
      finally { setIsLoading(false); if (photoInputRef.current) photoInputRef.current.value = ''; }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsLoading(true); setError(null);
      try {
          const data: ExtractedOrderData = await parseExcelWorkOrder(file);
          let updated: Partial<WorkOrder> = {
              ...formData,
              orderNumber: data.orderNumber || formData.orderNumber,
              opdrachtgever: data.opdrachtgever || formData.opdrachtgever,
              projectRef: data.projectRef || formData.projectRef,
              address: data.address || formData.address,
              scheduledDate: data.date || formData.scheduledDate,
              deliveryDate: data.deliveryDate || formData.deliveryDate,
              measurementDate: data.measurementDate || formData.measurementDate,
              description: data.description || formData.description,
              hourBudget: { ...formData.hourBudget, ...(data.hourBudget || {}) },
              thermischVerzinkt: data.thermischVerzinkt ?? formData.thermischVerzinkt,
              stralen: data.stralen ?? formData.stralen,
              stralenPrimer: data.stralenPrimer ?? formData.stralenPrimer,
              schoopperenPrimer: data.schoopperenPrimer ?? formData.schoopperenPrimer,
              poedercoaten: data.poedercoaten ?? formData.poedercoaten,
              onbehandeld: data.onbehandeld ?? formData.onbehandeld
          };
          ['wvb', 'kbw', 'plw', 'montage'].forEach(t => { updated = syncEndDateForTask(t as any, updated); });
          setFormData(updated);
          setActiveTab('manual');
      } catch (err) {
          setError("Fout bij het importeren van Excel file.");
      } finally {
          setIsLoading(false);
          if (excelInputRef.current) excelInputRef.current.value = '';
      }
  };

  const handleBudgetChange = (key: string, val: string) => {
      const num = parseFloat(val) || 0;
      let updated: Partial<WorkOrder> = { ...formData, hourBudget: { ...formData.hourBudget, [key]: num } };
      if (key === 'wvb') updated = syncEndDateForTask('wvb', updated);
      if (key === 'kbw') updated = syncEndDateForTask('kbw', updated);
      if (key === 'plw') updated = syncEndDateForTask('plw', updated);
      if (key === 'montage') updated = syncEndDateForTask('montage', updated);
      // Recalculate main end date when budget changes
      updated = calculateScheduledEndDate(updated);
      setFormData(updated);
  };

  const MultiSelectWorker = ({ field }: { field: keyof WorkOrder }) => {
      if (formData.isSubcontracted) return <div className="text-gray-400 italic py-2" style={{ fontSize: `${scaleFontSize(10)}px` }}>{t('sub_msg')}</div>;
      const selectedStr = (formData[field] as string) || '';
      const selected = selectedStr ? selectedStr.split(' + ') : [];
      const toggleWorker = (worker: string) => {
          let newSelected = selected.includes(worker) ? selected.filter(w => w !== worker) : [...selected, worker];
          let updated: Partial<WorkOrder> = { ...formData, [field]: newSelected.join(' + ') };
          if (field === 'workPreparationWorker') updated = syncEndDateForTask('wvb', updated);
          if (field === 'kbwWorker') updated = syncEndDateForTask('kbw', updated);
          if (field === 'plwWorker') updated = syncEndDateForTask('plw', updated);
          if (field === 'installationWorker') updated = syncEndDateForTask('montage', updated);
          if (field === 'measurementWorker') updated = syncEndDateForTask('measure', updated);
          // Recalculate main end date when workers change
          updated = calculateScheduledEndDate(updated);
          setFormData(updated);
      };
      return (
          <div className="w-full bg-white border border-gray-300 rounded p-1 max-h-24 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                  {workers.sort().map(w => (
                      <button key={w} type="button" onClick={() => toggleWorker(w)} className={`px-1.5 py-0.5 rounded border ${selected.includes(w) ? 'bg-blue-600 text-white font-bold border-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`} style={{ fontSize: `${scaleFontSize(8)}px` }}>{w}</button>
                  ))}
              </div>
          </div>
      );
  };

  const handleDrawingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsLoading(true);
      try {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const base64 = ev.target?.result as string;
              const newDrawings = [...(formData.drawings || []), base64];
              setFormData(prev => ({ ...prev, drawings: newDrawings }));
              if (editingOrder && onUpdateAttachments) {
                  onUpdateAttachments(editingOrder.id, 'drawings', newDrawings);
              }
              setIsLoading(false);
          };
          reader.readAsDataURL(file);
      } catch (err) { setError("Uploadfout."); setIsLoading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNumber || !formData.opdrachtgever) { setError(t('error_req')); return; }
    
    const preservationParts = [];
    if (formData.thermischVerzinkt) preservationParts.push("Thermisch verzinkt");
    if (formData.stralen) preservationParts.push("Stralen");
    if (formData.stralenPrimer) preservationParts.push("Stralen + Primer");
    if (formData.schoopperenPrimer) preservationParts.push("Schoopperen + Primer");
    if (formData.poedercoaten) preservationParts.push("Poedercoaten");
    if (formData.natlakken) preservationParts.push("Natlakken");
    if (formData.onbehandeld) preservationParts.push("Onbehandeld");
    
    const finalOrder: WorkOrder = { 
        ...defaultState, ...formData,
        id: editingOrder ? editingOrder.id : Math.random().toString(36).substr(2, 9), 
        createdAt: editingOrder ? editingOrder.createdAt : Date.now(), 
        status: formData.status || OrderStatus.PENDING, 
        preservationParts, 
        preservationType: preservationParts.join(' + ') || (formData.onbehandeld ? 'Onbehandeld' : ''), 
        timeLogs: editingOrder?.timeLogs || [], 
        drawings: formData.drawings || [], 
        photos: formData.photos || []
    } as WorkOrder;
    onSave(finalOrder); onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className={`bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-200 ${isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[90vh]'}`} style={{ fontSize: `${baseFontSize}px` }}>
        
        {/* HEADER */}
        <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {editingOrder ? <Edit3 size={18} className="text-orange-500"/> : <Maximize2 size={18} className="text-blue-600"/>}
            {editingOrder ? t('edit_order') : t('new_order')}
          </h2>
          <div className="flex gap-2">
              <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">{isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex px-6 pt-4 bg-white gap-6 shrink-0 border-b border-gray-100 overflow-x-auto">
          <button onClick={() => setActiveTab('manual')} className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'manual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>{t('manual')}</button>
          {!editingOrder && <button onClick={() => setActiveTab('import')} className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 ${activeTab === 'import' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'}`}><FileSpreadsheet size={16} /> {t('import')}</button>}
          {editingOrder && (
              <>
                <button onClick={() => setActiveTab('hours')} className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 ${activeTab === 'hours' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}><Clock size={16} /> {t('hours_logs')}</button>
                <button onClick={() => setActiveTab('drawings')} className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 ${activeTab === 'drawings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}><FileText size={16} /> {t('drawings')} <span className="ml-1 bg-blue-100 text-blue-700 px-1.5 rounded-full" style={{ fontSize: `${scaleFontSize(10)}px` }}>{formData.drawings?.length || 0}</span></button>
                <button onClick={() => setActiveTab('photos')} className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 ${activeTab === 'photos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400'}`}><ImageIcon size={16} /> {t('media')}</button>
                <button onClick={() => setActiveTab('models')} className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 ${activeTab === 'models' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400'}`}><Box size={16} /> {t('models_tab')}</button>
              </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}
          
          {activeTab === 'manual' && (
            <form id="orderForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* PARTNER CHECKBOX */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.isSubcontracted} onChange={e => setFormData({...formData, isSubcontracted: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                        <div className="flex items-center gap-2 font-bold text-gray-700"><Briefcase size={18} className="text-purple-500"/> {t('is_subcontracted')}</div>
                    </label>
                    {formData.isSubcontracted && (
                        <div className="mt-3 pl-8 space-y-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Partner *</label>
                                <select value={formData.subcontractorName || ''} onChange={e => setFormData({...formData, subcontractorName: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-white">
                                    <option value="">{t('select_sub')}</option>
                                    {subcontractors && subcontractors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Data Consegna Ditta Esterna</label>
                                <input type="date" value={formData.subcontractorDeliveryDate || ''} onChange={e => setFormData({...formData, subcontractorDeliveryDate: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white" />
                            </div>
                        </div>
                    )}
                </div>

                {/* INFO BASE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div><label className="block font-bold text-gray-500 uppercase mb-1" style={{ fontSize: `${scaleFontSize(10)}px` }}>{t('order_num')}</label><input required type="text" value={formData.orderNumber} onChange={e => setFormData({...formData, orderNumber: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg outline-none font-bold text-gray-700" placeholder="202X-XXX"/></div>
                        <div><label className="block font-bold text-gray-500 uppercase mb-1" style={{ fontSize: `${scaleFontSize(10)}px` }}>{t('client')}</label><input required type="text" value={formData.opdrachtgever} onChange={e => setFormData({...formData, opdrachtgever: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg font-medium" placeholder="Opdrachtgever"/></div>
                        <div><label className="block font-bold text-gray-500 uppercase mb-1" style={{ fontSize: `${scaleFontSize(10)}px` }}>{t('status')}</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full p-3 border border-gray-200 rounded-lg bg-white">{Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    </div>
                    <div className="space-y-4">
                        <div><label className="block font-bold text-gray-500 uppercase mb-1" style={{ fontSize: `${scaleFontSize(10)}px` }}>{t('project')}</label><input type="text" value={formData.projectRef} onChange={e => setFormData({...formData, projectRef: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg"/></div>
                        <div><label className="block font-bold text-gray-500 uppercase mb-1" style={{ fontSize: `${scaleFontSize(10)}px` }}>{t('address')}</label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg"/></div></div>
                        <div><label className="block font-bold text-gray-500 uppercase mb-1" style={{ fontSize: `${scaleFontSize(10)}px` }}>{t('material')}</label><select value={formData.material} onChange={(e) => setFormData({...formData, material: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg font-medium bg-white"><option value="STAAL">{t('staal')}</option><option value="RVS">{t('rvs')}</option><option value="ALUMINIUM">{t('alu')}</option></select></div>
                    </div>
                </div>

                {/* BUDGET */}
                <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><Coins size={16} className="text-yellow-600"/> {t('manual_budget')}</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {['wvb', 'plw', 'kbw', 'rvs', 'montage', 'reis'].map(key => (
                            <div key={key}>
                                <label className="block font-bold text-gray-400 uppercase mb-1 text-center" style={{ fontSize: `${scaleFontSize(9)}px` }}>{key.toUpperCase()}</label>
                                <input type="number" value={formData.hourBudget?.[key] || 0} onChange={e => handleBudgetChange(key, e.target.value)} className="w-full p-2 border border-gray-100 rounded text-center font-bold"/>
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 text-blue-500 italic flex items-center gap-1" style={{ fontSize: `${scaleFontSize(10)}px` }}><Info size={12}/> {t('calc_days')}</p>
                </div>

                {/* CONSERVERING */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 text-sm uppercase tracking-wide"><PaintBucket size={16} className="text-orange-500"/> {t('treatment')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { id: 'thermischVerzinkt', label: 'Thermisch verzinkt' },
                          { id: 'stralen', label: 'Stralen' },
                          { id: 'stralenPrimer', label: 'Stralen + Primer' },
                          { id: 'schoopperenPrimer', label: 'Schoopperen + Primer' },
                          { id: 'poedercoaten', label: 'Poedercoaten' },
                          { id: 'natlakken', label: 'Natlakken' },
                          { id: 'onbehandeld', label: 'Onbehandeld' }
                        ].map(opt => (
                          <label key={opt.id} className="flex items-center gap-3 p-3 border border-gray-50 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input type="checkbox" checked={(formData as any)[opt.id]} onChange={e => setFormData({...formData, [opt.id]: e.target.checked})} className="w-5 h-5 rounded text-blue-600"/>
                              <span className="text-xs font-bold text-gray-700">{opt.label}</span>
                          </label>
                        ))}
                    </div>
                </div>

                {/* PLANNING & UITVOERING */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm border-b pb-2 uppercase tracking-widest"><CalendarClock size={16} className="text-blue-600"/> {t('planning')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block font-bold text-gray-400 uppercase mb-1" style={{ fontSize: `${scaleFontSize(10)}px` }}>{t('main_date')} (INIZIO)</label><input type="date" value={formData.scheduledDate} onChange={e => setFormData(calculateScheduledEndDate({...formData, scheduledDate: e.target.value}))} className="w-full p-2.5 border rounded-lg font-bold bg-blue-50/50"/></div>
                        <div><label className="block font-bold text-gray-400 uppercase mb-1" style={{ fontSize: `${scaleFontSize(10)}px` }}>DATA FINE (AUTO)</label><div className="w-full p-2.5 border-2 border-green-300 rounded-lg font-bold bg-green-50 text-green-700 text-center">{formData.scheduledEndDate || '-'}</div></div>
                        <div><label className="block font-bold text-gray-400 uppercase mb-1" style={{ fontSize: `${scaleFontSize(10)}px` }}>{t('del_date')}</label><input type="date" value={formData.deliveryDate || ''} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} className="w-full p-2.5 border rounded-lg font-bold"/></div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        {/*Attività con regola calcolo ore 8h/dipendente*/}
                        {[
                            { task: 'measure', icon: Ruler, label: t('measure'), startField: 'measurementDate', endField: 'measurementEndDate', workerField: 'measurementWorker' },
                            { task: 'wvb', icon: ClipboardList, label: 'WVB', startField: 'workPreparationDate', endField: 'workPreparationEndDate', workerField: 'workPreparationWorker' },
                            { task: 'kbw', icon: Anvil, label: 'KBW', startField: 'kbwDate', endField: 'kbwEndDate', workerField: 'kbwWorker' },
                            { task: 'plw', icon: Layers, label: 'PLW', startField: 'plwDate', endField: 'plwEndDate', workerField: 'plwWorker' },
                            { task: 'montage', icon: Wrench, label: 'MONTAGE', startField: 'installationDate', endField: 'installationEndDate', workerField: 'installationWorker' }
                        ].map(item => (
                            <div key={item.task} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-3 flex items-center gap-2 font-bold text-gray-600 text-xs uppercase tracking-tighter"><item.icon size={14}/> {item.label}</div>
                                <div className="col-span-2">
                                    <label className="block text-gray-400 uppercase" style={{ fontSize: `${scaleFontSize(8)}px` }}>{t('start')}</label>
                                    <input type="date" value={(formData as any)[item.startField] || ''} onChange={e => setFormData(syncEndDateForTask(item.task as any, {...formData, [item.startField]: e.target.value}))} className="w-full p-1 border rounded" style={{ fontSize: `${scaleFontSize(10)}px` }}/>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-gray-400 uppercase" style={{ fontSize: `${scaleFontSize(8)}px` }}>{t('end')}</label>
                                    <input type="date" value={(formData as any)[item.endField] || ''} onChange={e => setFormData({...formData, [item.endField]: e.target.value})} className="w-full p-1 border rounded font-bold" style={{ fontSize: `${scaleFontSize(10)}px` }}/>
                                </div>
                                <div className="col-span-5">
                                    <label className="block text-gray-400 uppercase" style={{ fontSize: `${scaleFontSize(8)}px` }}>{t('executor')}</label>
                                    <MultiSelectWorker field={item.workerField as any} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* NOTE */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-2 uppercase tracking-widest"><Info size={14}/> {t('desc')}</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg h-32 resize-none text-sm" placeholder="..." />
                </div>
            </form>
          )}

          {activeTab === 'import' && (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-2xl bg-white space-y-6 text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shadow-inner"><FileSpreadsheet size={40} /></div>
                  <div><h3 className="text-xl font-bold text-gray-800">{t('excel_title')}</h3><p className="text-gray-500 max-w-sm mx-auto mt-2">{t('excel_sub')}</p></div>
                  <input type="file" accept=".xlsx, .xls" className="hidden" ref={excelInputRef} onChange={handleExcelImport} />
                  <button onClick={() => excelInputRef.current?.click()} className="px-10 py-4 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 shadow-xl transition-all active:scale-95 flex items-center gap-2"><Upload size={20}/> {t('choose_file')}</button>
              </div>
          )}

          {activeTab === 'drawings' && (
              <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border">
                      <span className="font-bold">{t('drawings')}</span>
                      <input type="file" className="hidden" ref={pdfInputRef} onChange={handleDrawingUpload} />
                      <button onClick={() => pdfInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded font-bold text-xs"><Plus size={16} className="inline mr-1"/> {t('add_drawing')}</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formData.drawings?.map((f, i) => (
                          <div key={i} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <FileText size={18} className="text-blue-500"/>
                                  <span className="text-xs font-bold">Bestand #{i+1}</span>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => setViewingDrawing(f)} className="text-blue-500"><Eye size={16}/></button>
                                  <button onClick={() => { 
                                      const n = [...(formData.drawings || [])]; 
                                      n.splice(i,1); 
                                      setFormData({...formData, drawings: n}); 
                                      if (editingOrder && onUpdateAttachments) {
                                          onUpdateAttachments(editingOrder.id, 'drawings', n);
                                      }
                                  }} className="text-red-500"><Trash2 size={16}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'photos' && (
              <div className="space-y-3">
                  <div className="flex justify-end">
                      <input type="file" accept="image/*" multiple className="hidden" ref={photoInputRef} onChange={handlePhotoUpload} />
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                          <Camera size={14} /> {language === 'nl' ? 'FOTO TOEVOEGEN' : language === 'it' ? 'AGGIUNGI FOTO' : 'ADD PHOTO'}
                      </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto">
                  {formData.photos?.map((photo, index) => (
                      <div key={index} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                          <button type="button" onClick={() => { 
                              const n = [...(formData.photos || [])]; 
                              n.splice(index,1); 
                              setFormData({...formData, photos: n}); 
                              if (editingOrder && onUpdateAttachments) {
                                  onUpdateAttachments(editingOrder.id, 'photos', n);
                              }
                          }} className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-600 rounded-full shadow-md z-10"><Trash2 size={16}/></button>
                          <img src={photo} className="w-full h-full object-cover cursor-pointer" onClick={() => setViewingPhoto(photo)} alt="Mediapart" />
                      </div>
                  ))}
                  </div>
              </div>
          )}

          {activeTab === 'models' && editingOrder && (
              <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2"><Box size={16} className="text-emerald-600" /> {t('models_tab')}</h3>
                      {formData.glbUrl ? (
                          <div className="space-y-3">
                              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                  <Box size={20} className="text-emerald-600 shrink-0" />
                                  <span className="text-sm font-bold text-emerald-800 truncate flex-1">{t('model_uploaded')}</span>
                                  <button type="button" onClick={handleDeleteGlbModel} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0" title={t('delete_model')}><Trash2 size={16}/></button>
                              </div>
                              <a href={formData.glbUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline break-all">{formData.glbUrl}</a>
                          </div>
                      ) : (
                          <p className="text-sm text-gray-400 italic mb-3">{t('no_model')}</p>
                      )}
                      <div className="mt-3">
                          <input type="file" accept=".glb,.gltf" className="hidden" ref={glbInputRef} onChange={handleGlbUpload} />
                          <button type="button" onClick={() => glbInputRef.current?.click()} disabled={isUploadingGlb} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                              {isUploadingGlb ? <Loader2 size={14} className="animate-spin" /> : <Box size={14} />}
                              {isUploadingGlb ? t('processing') : t('add_model')}
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'hours' && editingOrder && (
              <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <h4 className="font-bold text-gray-800 text-sm">{t('budget_vs_real')}</h4>
                      <span className="text-xl font-black text-blue-900">{(editingOrder.timeLogs || []).reduce((acc,l)=>acc+l.hours, 0)} u</span>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 font-bold text-gray-500 uppercase" style={{ fontSize: `${scaleFontSize(10)}px` }}>
                              <tr><th className="px-4 py-2">{t('log_date')}</th><th className="px-4 py-2">{t('employee')}</th><th className="px-4 py-2 text-right">{t('log_hours')}</th><th className="px-4 py-2">{t('log_note')}</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {(editingOrder.timeLogs || []).slice().reverse().map(log => (
                                  <tr key={log.id} className="text-xs hover:bg-gray-50">
                                      <td className="px-4 py-2">{log.date}</td><td className="px-4 py-2 font-bold">{log.worker}</td><td className="px-4 py-2 text-right font-bold text-blue-600">{log.hours}</td><td className="px-4 py-2 text-gray-500 italic truncate max-w-[150px]">{log.note || '-'}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
        </div>

        <div className="p-4 border-t bg-white flex justify-between rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl border">{t('cancel')}</button>
          <button type="submit" form="orderForm" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-transform active:scale-95"><Check size={20} className="inline mr-1" />{editingOrder ? t('save_changes') : t('save')}</button>
        </div>
      </div>

      {/* VIEWERS */}
      {viewingDrawing && (
          <div className="fixed inset-0 z-[120] bg-black/95 flex flex-col p-4 animate-fade-in">
              <div className="flex justify-between items-center mb-4 px-4 text-white">
                  <h3 className="font-bold text-lg flex items-center gap-2"><FileText size={20}/> Bestand Viewer</h3>
                  <button onClick={() => setViewingDrawing(null)} className="p-2 bg-white/10 hover:bg-white/30 rounded-full"><X size={24} /></button>
              </div>
              <div className="flex-1 bg-white rounded-xl overflow-hidden">
                  {viewingDrawing.startsWith('data:application/pdf') ? <iframe src={viewingDrawing} className="w-full h-full border-none"></iframe> : <img src={viewingDrawing} className="max-w-full max-h-full mx-auto object-contain" alt="Viewer" />}
              </div>
          </div>
      )}
    </div>
  );
};
