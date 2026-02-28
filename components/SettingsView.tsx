import React, { useState, useRef, useEffect } from 'react';
import { 
    Monitor, RefreshCw, ZoomIn, ZoomOut, Save, Type, Trash2, Database, AlertTriangle, 
    Table, Palette, Sidebar as SidebarIcon, ShieldCheck, Lock, MoveVertical, 
    ArrowUpDown, Maximize2, Minimize2, Settings, X, ChevronRight, Layout, CalendarDays, Globe, Check, Building2, UploadCloud, Image as ImageIcon, Pencil, AlertOctagon, UserPlus, Users, Briefcase, Download, Upload, Wand2, Smartphone, Workflow, Plus
} from 'lucide-react';
import { TaskColors, Language, AdminProfile, AdminPermissions, DEFAULT_ADMIN_PERMISSIONS, Department, MobilePermissions, Subcontractor, WorkerMobilePermissions } from '../types';
import { PasswordPromptModal } from './PasswordPromptModal';

interface SettingsViewProps {
  isOpen?: boolean; 
  onClose?: () => void; 
  scale: number;
  onScaleChange: (newScale: number) => void;
  fontSize: number;
  onFontSizeChange: (newSize: number) => void;
  tableFontSize: number;
  onTableFontSizeChange: (newSize: number) => void;
  onDeleteCompleted: () => void;
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
  sidebarColor: string;
  onSidebarColorChange: (color: string) => void;
  sidebarTextColor: string;
  onSidebarTextColorChange: (color: string) => void;
    sidebarWidth?: number;
    onSidebarWidthChange?: (w: number) => void;
  layoutSpacing?: number;
  onLayoutSpacingChange?: (px: number) => void;
  taskColors?: TaskColors;
  onTaskColorsChange?: (colors: TaskColors) => void;
  adminProfiles?: AdminProfile[];
  onUpdateAdminProfiles?: (profiles: AdminProfile[]) => void;
  adminPassword?: string;
  onAdminPasswordChange?: (pass: string) => void;
  userPassword?: string;
  onUserPasswordChange?: (pass: string) => void;
  companyName?: string;
  companyLogo?: string;
  onUpdateCompanyDetails?: (name: string, logo?: string) => void;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  onTotalReset?: () => void;
  subcontractors?: Subcontractor[];
  onAddSubcontractor?: (subcontractor: Subcontractor) => void;
  onDeleteSubcontractor?: (id: string) => void;
  onBackup?: () => void;
  onRestore?: (file: File) => void;
  onTriggerWizard?: () => void;
  departments?: Department[];
  onUpdateDepartments?: (departments: Department[]) => void;
  workers?: string[];
  mobilePermissions?: MobilePermissions;
  onUpdateMobilePermissions?: (permissions: MobilePermissions) => void;
theme?: 'gold' | 'space' | 'space-light';
onThemeChange?: (theme: 'gold' | 'space' | 'space-light') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    isOpen, onClose, scale, onScaleChange, fontSize, onFontSizeChange, tableFontSize, onTableFontSizeChange, onDeleteCompleted, layoutSpacing = 10, onLayoutSpacingChange,
    taskColors, onTaskColorsChange, adminProfiles = [], onUpdateAdminProfiles, adminPassword, onAdminPasswordChange, companyName = '', companyLogo, onUpdateCompanyDetails,
    language = 'nl', onLanguageChange, onTotalReset, subcontractors = [], onAddSubcontractor, onDeleteSubcontractor, onBackup, onRestore, onTriggerWizard,
    departments = [], onUpdateDepartments, workers = [], mobilePermissions, onUpdateMobilePermissions, theme = 'gold', onThemeChange
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'customization' | 'production' | 'partners' | 'workflow' | 'mobile'>('general');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminPass, setEditAdminPass] = useState('');
  const [editAdminRole, setEditAdminRole] = useState<'admin' | 'manager' | 'viewer'>('admin');
  const [editAdminPerms, setEditAdminPerms] = useState<AdminPermissions>({...DEFAULT_ADMIN_PERMISSIONS});
  const [expandedAdminId, setExpandedAdminId] = useState<string | null>(null);
  
  // Subcontractor form state
  const [newSubName, setNewSubName] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubPhone, setNewSubPhone] = useState('');
  const [newSubAddress, setNewSubAddress] = useState('');
  const [newSubContact, setNewSubContact] = useState('');
  
  const [isCompanyUnlocked, setIsCompanyUnlocked] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [editName, setEditName] = useState(companyName);
  const [editLogo, setEditLogo] = useState<string | undefined>(companyLogo);
  
  // Department State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptActs, setNewDeptActs] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if(!isCompanyUnlocked) { setEditName(companyName); setEditLogo(companyLogo); } }, [companyName, companyLogo, isCompanyUnlocked]);
  if (!isOpen) return null;

const t = (key: string) => {
      const dict: Record<string, Record<string, string>> = {
          nl: { 
            general: "Algemeen", security: "Team Beheer", customization: "Kleuren & Taken", production: "Productie", partners: "Partners", workflow: "Werkstroom", mobile: "Mobiel Admin",
            title: "Instellingen", subtitle: "Configuratie Paneel", language: "Taal / Language", company_data: "Bedrijfsgegevens", edit_data: "Wijzig Gegevens", 
            company_name: "Bedrijfsnaam", logo: "Logo", save_company: "Gegevens Opslaan", cancel: "Annuleren", unlock_msg: "Voer wachtwoord in om bedrijfsgegevens te wijzigen.", 
            reset_db_btn: "RESET TOTALE DATABASE", add_admin: "Beheerder Toevoegen", admin_name: "Naam", admin_pass: "Wachtwoord", 
            subcontractors_title: "Onderaannemers", subcontractors_desc: "Beheer externe partijen waaraan werk wordt uitbesteed.", add_sub: "Partner Toevoegen", 
            backup_title: "Handmatige Backup", backup_desc: "Maak een veilige kopie van het systeem om gegevensverlies te voorkomen.", backup_btn: "DOWNLOAD BACKUP NU", restore_btn: "HERSTEL BACKUP", 
            wizard_btn: "Setup Wizard Herstarten", wizard_desc: "Herconfigureer bedrijfsnaam, logo en admin pass.",
            del_completed: "Verwijder Voltooide Orders", del_completed_desc: "Verwijdert alle orders met status 'Voltooid' om de lijst schoon te houden.", delete_dept_confirm: "Weet je zeker dat je deze afdeling wilt verwijderen?",
            color_kbw: "KBW Kleur", color_plw: "PLW Kleur", color_mon: "Montage Kleur", color_wvb: "WVB Kleur", color_hol: "Feestdag Kleur", color_adv: "ADV Kleur",
            admin_settings: "Beheerder Wachtwoord", admin_settings_desc: "Dit wachtwoord is vereist om kritieke wijzigingen op te slaan.",
            dept_title: "Afdelingen & Activiteiten", dept_desc: "Beheer de categorieën for urenregistratie.", acts_placeholder: "Zagen, Lassen, ...", add_dept: "Afdeling Toevoegen",
            mob_perm_title: "Mobiele Beperkingen", mob_perm_desc: "Bepaal wat werknemers zien op hun telefoon.", perm_client: "Toon Klantnaam", perm_address: "Toon Adres", perm_photo: "Foto Upload Toestaan", perm_draw: "Tekeningen Inzien", no_workers: "Geen werknemers geconfigureerd",
            theme_title: "Applicatie Thema", theme_gold: "Goud", theme_space: "Space Blue", theme_space_light: "Space Blue Light",
            sub_name: "Bedrijfsnaam *", sub_email: "Email", sub_phone: "Telefoon", sub_contact: "Contactpersoon", sub_address: "Adres", no_subs: "Geen bedrijven toegevoegd",
            critical_actions: "Kritieke Acties", delete_btn: "Verwijderen",
            edit_admin: "Bewerken", save_admin: "Opslaan", cancel_edit: "Annuleren", role: "Rol", permissions: "Rechten",
            perm_viewPlanner: "Planner Bekijken", perm_editPlanner: "Planner Bewerken", perm_viewOrders: "Orders Bekijken", perm_editOrders: "Orders Bewerken",
            perm_viewEmployees: "Personeel Bekijken", perm_editEmployees: "Personeel Bewerken", perm_viewStatistics: "Statistieken", perm_viewSettings: "Instellingen Bekijken",
            perm_editSettings: "Instellingen Bewerken", perm_manageBackup: "Backup Beheer", perm_deleteOrders: "Orders Verwijderen", perm_viewCosts: "Kosten Bekijken",
            role_admin: "Beheerder", role_manager: "Manager", role_viewer: "Kijker"
          },
          en: { 
            general: "General", security: "Team Admin", customization: "Colors & Tasks", production: "Production", partners: "Partners", workflow: "Workflow", mobile: "Mobile Admin",
            title: "Settings", subtitle: "Control Panel", language: "Language", company_data: "Company Details", edit_data: "Edit Data", 
            company_name: "Company Name", logo: "Logo", save_company: "Save Data", cancel: "Cancel", unlock_msg: "Enter password to edit company details.", 
            reset_db_btn: "RESET DATABASE", add_admin: "Add Admin", admin_name: "Name", admin_pass: "Password", 
            subcontractors_title: "Subcontractors", subcontractors_desc: "Manage external partners.", add_sub: "Add Partner", 
            backup_title: "Manual Backup", backup_desc: "Save a backup copy to prevent data loss.", backup_btn: "DOWNLOAD BACKUP", restore_btn: "RESTORE BACKUP", 
            wizard_btn: "Restart Setup Wizard", wizard_desc: "Reconfigure company details and admin pass.",
            del_completed: "Clear Completed Orders", del_completed_desc: "Removes all orders with 'Completed' status.", delete_dept_confirm: "Are you sure you want to delete this department?",
            color_kbw: "KBW Color", color_plw: "PLW Color", color_mon: "Montage Color", color_wvb: "WVB Color", color_hol: "Holiday Color", color_adv: "ADV Color",
            admin_settings: "Admin Password", admin_settings_desc: "Password required for critical changes.",
            dept_title: "Departments & Activities", dept_desc: "Manage categories for time tracking.", acts_placeholder: "Sawing, Welding...", add_dept: "Add Department",
            mob_perm_title: "Mobile Restrictions", mob_perm_desc: "Control what workers see.", perm_client: "Show Client", perm_address: "Show Address", perm_photo: "Allow Photo Upload", perm_draw: "View Drawings", no_workers: "No workers configured",
            theme_title: "App Theme", theme_gold: "Gold", theme_space: "Space Blue", theme_space_light: "Space Blue Light",
            sub_name: "Company Name *", sub_email: "Email", sub_phone: "Phone", sub_contact: "Contact Person", sub_address: "Address", no_subs: "No companies added",
            critical_actions: "Critical Actions", delete_btn: "Delete",
            edit_admin: "Edit", save_admin: "Save", cancel_edit: "Cancel", role: "Role", permissions: "Permissions",
            perm_viewPlanner: "View Planner", perm_editPlanner: "Edit Planner", perm_viewOrders: "View Orders", perm_editOrders: "Edit Orders",
            perm_viewEmployees: "View Staff", perm_editEmployees: "Edit Staff", perm_viewStatistics: "Statistics", perm_viewSettings: "View Settings", perm_viewCosts: "View Costs",
            perm_editSettings: "Edit Settings", perm_manageBackup: "Backup Management", perm_deleteOrders: "Delete Orders",
            role_admin: "Administrator", role_manager: "Manager", role_viewer: "Viewer"
          },
          it: { 
            general: "Generale", security: "Gestione Team", customization: "Colori & Task", production: "Produzione", partners: "Partner", workflow: "Workflow", mobile: "Admin Mobile",
            title: "Impostazioni", subtitle: "Pannello di Controllo", language: "Lingua", company_data: "Dati Aziendali", edit_data: "Modifica Dati", 
            company_name: "Nome Azienda", logo: "Logo", save_company: "Salva Dati", cancel: "Annulla", unlock_msg: "Inserisci password per modificare i dati.", 
            reset_db_btn: "RESET DATABASE", add_admin: "Aggiungi Admin", admin_name: "Nome", admin_pass: "Password", 
            subcontractors_title: "Subappaltatori", subcontractors_desc: "Gestisci i partner esterni.", add_sub: "Aggiungi Partner", 
            backup_title: "Backup Manuale", backup_desc: "Crea una copia di sicurezza per evitare perdite.", backup_btn: "SCARICA BACKUP", restore_btn: "RIPRISTINA BACKUP", 
            wizard_btn: "Riavvia Setup Wizard", wizard_desc: "Riconfigura nome, logo e password admin.",
            del_completed: "Pulisci Ordini Completati", del_completed_desc: "Rimuove gli ordini con stato 'Completato'.", delete_dept_confirm: "Sei sicuro di voler eliminare questo reparto?",
            color_kbw: "Colore KBW", color_plw: "Colore PLW", color_mon: "Colore Montaggio", color_wvb: "Colore WVB", color_hol: "Colore Festivi", color_adv: "Colore ADV",
            admin_settings: "Password Amministratore", admin_settings_desc: "Password richiesta per modifiche critiche.",
            dept_title: "Reparti & Attività", dept_desc: "Gestisci le categorie per le ore.", acts_placeholder: "Taglio, Saldatura...", add_dept: "Aggiungi Reparto",
            mob_perm_title: "Restrizioni Mobile", mob_perm_desc: "Controlla cosa vedono i dipendenti.", perm_client: "Mostra Cliente", perm_address: "Mostra Indirizzo", perm_photo: "Permetti Foto", perm_draw: "Vedi Disegni", no_workers: "Nessun dipendente configurato",
            theme_title: "Tema Applicazione", theme_gold: "Oro", theme_space: "Blu Spaziale", theme_space_light: "Blu Spaziale Chiaro",
            sub_name: "Nome Azienda *", sub_email: "Email", sub_phone: "Telefono", sub_contact: "Persona Contatto", sub_address: "Indirizzo", no_subs: "Nessun partner aggiunto",
            critical_actions: "Azioni Critiche", delete_btn: "Elimina",
            edit_admin: "Modifica", save_admin: "Salva", cancel_edit: "Annulla", role: "Ruolo", permissions: "Permessi",
            perm_viewPlanner: "Visualizza Planner", perm_editPlanner: "Modifica Planner", perm_viewOrders: "Visualizza Ordini", perm_editOrders: "Modifica Ordini",
            perm_viewEmployees: "Visualizza Personale", perm_editEmployees: "Modifica Personale", perm_viewStatistics: "Statistiche", perm_viewSettings: "Visualizza Impostazioni", perm_viewCosts: "Visualizza Costi",
            perm_editSettings: "Modifica Impostazioni", perm_manageBackup: "Gestione Backup", perm_deleteOrders: "Elimina Ordini",
            role_admin: "Amministratore", role_manager: "Manager", role_viewer: "Visualizzatore"
          }
      };
      return dict[language]?.[key] || key;
  };

  const handleAddSub = () => {
    if(newSubName.trim() && onAddSubcontractor) {
      const newSub: Subcontractor = {
        id: Date.now().toString(),
        name: newSubName.trim(),
        email: newSubEmail.trim() || undefined,
        phone: newSubPhone.trim() || undefined,
        address: newSubAddress.trim() || undefined,
        contactPerson: newSubContact.trim() || undefined
      };
      onAddSubcontractor(newSub);
      setNewSubName('');
      setNewSubEmail('');
      setNewSubPhone('');
      setNewSubAddress('');
      setNewSubContact('');
    }
  };
  const handleUnlockCompany = (password: string) => { if (password === '1111' || (adminPassword && password === adminPassword)) { setIsCompanyUnlocked(true); setIsUnlockModalOpen(false); } };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const reader = new FileReader(); reader.onload = (ev) => { if (ev.target?.result) setEditLogo(ev.target.result as string); }; reader.readAsDataURL(e.target.files[0]); } };
  const handleSaveCompanyData = () => { if(onUpdateCompanyDetails && editName.trim()) { onUpdateCompanyDetails(editName.trim(), editLogo); setIsCompanyUnlocked(false); } };

  const handleColorChange = (key: keyof TaskColors, val: string) => {
      if(taskColors && onTaskColorsChange) {
          onTaskColorsChange({ ...taskColors, [key]: val });
      }
  };

  const handleAddDepartment = () => {
      if (newDeptName.trim() && onUpdateDepartments) {
          const acts = newDeptActs.split(',').map(s => s.trim()).filter(Boolean);
          const activityVisibility: Record<string, boolean> = {};
          acts.forEach(act => {
              activityVisibility[act] = true; // Default all to visible
          });
          const newDept: Department = {
              id: newDeptName.toUpperCase().replace(/\s+/g, '_'),
              name: newDeptName.trim(),
              activities: acts.length > 0 ? acts : ['Algemeen'],
              activityVisibility: activityVisibility
          };
          onUpdateDepartments([...departments, newDept]);
          setNewDeptName('');
          setNewDeptActs('');
      }
  };

  const handleDeleteDepartment = (id: string) => {
      if (confirm(t('delete_dept_confirm')) && onUpdateDepartments) {
          onUpdateDepartments(departments.filter(d => d.id !== id));
      }
  };

  const handleToggleActivityVisibility = (deptId: string, activityName: string, visible: boolean) => {
      if (onUpdateDepartments) {
          const updated = departments.map(d => {
              if (d.id === deptId) {
                  return {
                      ...d,
                      activityVisibility: {
                          ...(d.activityVisibility || {}),
                          [activityName]: visible
                      }
                  };
              }
              return d;
          });
          onUpdateDepartments(updated);
      }
  };

  const handleMobilePermChange = (worker: string, key: keyof WorkerMobilePermissions, val: boolean) => {
      if (mobilePermissions && onUpdateMobilePermissions) {
          const updated = { ...mobilePermissions } as MobilePermissions;
          if (!updated[worker]) {
              updated[worker] = {
                  showClientName: false,
                  allowPhotoUpload: false,
                  allowDrawingsView: false,
                  showAddress: false,
              };
          }
          (updated[worker] as WorkerMobilePermissions)[key] = val;
          onUpdateMobilePermissions(updated);
      }
  };

  const tabs = [ 
    { id: 'general', label: t('general'), icon: Monitor }, 
    { id: 'security', label: t('security'), icon: ShieldCheck }, 
    { id: 'partners', label: t('partners'), icon: Briefcase }, 
    { id: 'customization', label: t('customization'), icon: Palette },
    { id: 'workflow', label: t('workflow'), icon: Workflow }, 
    { id: 'mobile', label: t('mobile'), icon: Smartphone }, 
    { id: 'production', label: t('production'), icon: Database } 
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in font-sans">
    <PasswordPromptModal isOpen={isUnlockModalOpen} onClose={() => setIsUnlockModalOpen(false)} onConfirm={handleUnlockCompany} title={t('edit_data')} checkPassword={(p) => p === '1111' || (adminPassword ? p === adminPassword : false)} />
    <div className={`w-full h-full md:w-[95%] md:h-[90%] md:rounded-2xl shadow-[0_20px_60px_rgba(${theme === 'gold' ? '212,175,55' : (theme === 'space-light' ? '100,116,139' : '0,242,254')},0.12)] flex overflow-hidden border ${theme === 'gold' ? 'bg-[#141414] border-[#d4af37]/30 text-gray-200' : theme === 'space-light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-[#00f2fe]/30 text-gray-200'}`}>
        {/* LEFT SIDEBAR IN SETTINGS */}
        <div className={`w-72 border-r flex flex-col shrink-0 ${theme === 'gold' ? 'bg-[#0a0a0a] border-[#d4af37]/20 text-gray-200' : theme === 'space-light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#020617] border-[#00f2fe]/20 text-gray-200'}`}>
            <div className={`p-6 border-b ${theme === 'gold' ? 'border-[#d4af37]/20 bg-[#0a0a0a]' : theme === 'space-light' ? 'border-slate-200 bg-white' : 'border-[#00f2fe]/20 bg-[#020617]'}`}>
                <h2 className={`text-xl font-bold flex items-center gap-2 ${theme === 'gold' ? 'text-[#d4af37]' : theme === 'space-light' ? 'text-slate-800' : 'text-[#00f2fe]'}`}>
                    <Settings /> {t('title')}
                </h2>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm border ${activeTab === tab.id ? (theme === 'gold' ? `bg-gradient-to-r from-[#d4af37]/20 border-[#d4af37] text-[#d4af37] to-transparent shadow-md border-l-2` : theme === 'space-light' ? `bg-slate-100 border-slate-300 text-slate-800 shadow-sm border-l-2` : `bg-gradient-to-r from-[#00f2fe]/20 border-[#00f2fe] text-[#00f2fe] to-transparent shadow-md border-l-2`) : `text-gray-400 bg-transparent border-transparent hover:text-[${theme === 'gold' ? '#d4af37' : (theme === 'space-light' ? '#334155' : '#00f2fe')}] hover:bg-[${theme === 'gold' ? '#d4af37' : (theme === 'space-light' ? '#f1f5f9' : '#00f2fe')}]/5`}`}>
                        <tab.icon size={18} className={activeTab === tab.id ? (theme === 'gold' ? 'text-[#d4af37]' : theme === 'space-light' ? 'text-slate-800' : 'text-[#00f2fe]') : ''} />
                        {tab.label}
                        {activeTab === tab.id && <ChevronRight size={16} className="ml-auto opacity-50" />}
                    </button>
                ))}
            </nav>
        </div>
        
        {/* MAIN CONTENT AREA IN SETTINGS */}
        <div className={`flex-1 flex flex-col min-w-0 ${theme === 'gold' ? 'bg-[#0f0f0f]' : theme === 'space-light' ? 'bg-white' : 'bg-[#0b1120]'}`}>
            <div className={`h-16 border-b flex items-center justify-between px-8 shrink-0 ${theme === 'gold' ? 'border-[#d4af37]/20 bg-[#141414]' : theme === 'space-light' ? 'border-slate-200 bg-white' : 'border-[#00f2fe]/20 bg-[#0f172a]'}`}>
                <h3 className={`text-lg font-bold ${theme === 'gold' ? 'text-[#d4af37]' : theme === 'space-light' ? 'text-slate-800' : 'text-[#00f2fe]'}`}>{t(activeTab)}</h3>
                <button onClick={onClose} className="p-2 text-gray-500 hover:bg-red-900/20 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {activeTab === 'general' && (
                        <>
                            {/* THEME SELECTOR */}
                            <div className={`p-6 rounded-xl border shadow-sm ${theme === 'gold' ? 'bg-[#141414] border-[#d4af37]/20 text-gray-200' : theme === 'space-light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-[#00f2fe]/20 text-gray-200'}`}>
                                <h4 className={`${theme === 'space-light' ? 'text-slate-800' : 'font-bold text-gray-200'} mb-4 flex items-center gap-2`}><Palette className={theme === 'gold' ? "text-[#d4af37]" : (theme === 'space-light' ? 'text-slate-800' : "text-[#00f2fe]")} /> {t('theme_title')}</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => onThemeChange && onThemeChange('gold')} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${theme === 'gold' ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-gray-700 bg-[#0a0a0a] text-gray-500 hover:border-[#d4af37]/50'}`}>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#aa8c2c]"></div>
                                        <span className="font-bold uppercase tracking-widest text-xs">{t('theme_gold')}</span>
                                    </button>
                                    <button onClick={() => onThemeChange && onThemeChange('space')} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${theme === 'space' ? 'border-[#00f2fe] bg-[#00f2fe]/10 text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.2)]' : 'border-gray-700 bg-[#020617] text-gray-500 hover:border-[#00f2fe]/50'}`}>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00f2fe] to-[#4facfe]"></div>
                                        <span className="font-bold uppercase tracking-widest text-xs">{t('theme_space')}</span>
                                    </button>
                                    <button onClick={() => onThemeChange && onThemeChange('space-light')} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${theme === 'space-light' ? 'border-slate-300 bg-white text-slate-800 shadow-sm' : 'border-gray-700 bg-gray-50 text-gray-400 hover:border-[#00f2fe]/50'}`}>
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00f2fe] to-[#4facfe] border border-gray-200"></div>
    <span className="font-bold uppercase tracking-widest text-xs">{t('theme_space_light')}</span>
</button>
                                </div>
                            </div>

                            <div className={`p-6 rounded-xl border shadow-sm ${isCompanyUnlocked ? (theme === 'gold' ? 'border-[#d4af37] ring-1 ring-[#d4af37]/50 bg-[#141414] text-gray-200' : theme === 'space-light' ? 'border-slate-300 ring-1 ring-slate-200/40 bg-white text-slate-800' : 'border-[#00f2fe] ring-1 ring-[#00f2fe]/50 bg-[#0f172a] text-gray-200') : (theme === 'gold' ? 'border-[#d4af37]/20 bg-[#141414] text-gray-200' : theme === 'space-light' ? 'border-slate-200 bg-white text-slate-800' : 'border-[#00f2fe]/20 bg-[#0f172a] text-gray-200')}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className={`font-bold ${theme === 'space-light' ? 'text-slate-800' : 'text-gray-200'} flex items-center gap-2`}>
                                        <Building2 className={isCompanyUnlocked ? (theme === 'gold' ? "text-[#d4af37]" : (theme === 'space-light' ? 'text-slate-800' : "text-[#00f2fe]")) : "text-gray-500"} /> {t('company_data')}
                                    </h4>
                                    <button onClick={() => setIsUnlockModalOpen(true)} className={`text-xs flex items-center gap-1 bg-[#0a0a0a] text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]/50 transition-colors font-bold`}>
                                        <Lock size={12} className={theme === 'gold' ? "text-[#d4af37]" : "text-[#00f2fe]"}/> {t('edit_data')}
                                    </button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={`text-xs font-bold ${theme === 'space-light' ? 'text-slate-600' : 'text-gray-400'} uppercase`}>{t('company_name')}</label>
                                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} disabled={!isCompanyUnlocked} className={`w-full px-4 py-3 ${theme === 'space-light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0a0a0a] border border-gray-700 text-gray-200'} rounded-xl outline-none focus:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}] font-bold`} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">{t('logo')}</label>
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
                                        <div onClick={() => isCompanyUnlocked && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-3 flex items-center gap-4 ${isCompanyUnlocked ? `border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]/50 bg-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]/5 cursor-pointer hover:bg-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]/10` : 'bg-[#0a0a0a] border-gray-800 cursor-not-allowed'}`}>
                                            <div className="w-12 h-12 bg-white rounded-lg border flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                                {editLogo ? <img src={editLogo} alt="L" className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-300" />}
                                            </div>
                                            <p className={`text-sm font-bold ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>Logo</p>
                                        </div>
                                    </div>
                                </div>
                                {isCompanyUnlocked && (
                                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-800 animate-fade-in">
                                        <button onClick={() => setIsCompanyUnlocked(false)} className="px-4 py-2 text-gray-400 font-bold text-sm hover:text-white">Annuleren</button>
                                        <button onClick={handleSaveCompanyData} className={`px-6 py-2 bg-gradient-to-r ${theme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a]' : 'from-[#00f2fe] to-[#4facfe] text-[#020617]'} rounded-lg font-bold text-sm shadow-md active:scale-95`}>Opslaan</button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'security' && (
                        <div className={`p-6 rounded-xl border shadow-sm space-y-8 ${theme === 'gold' ? 'bg-[#141414] border-[#d4af37]/20' : 'bg-[#0f172a] border-[#00f2fe]/20'}`}>
                            {/* ADMIN PROFILES SECTION */}
                            <section>
                                <h4 className="font-bold text-gray-200 mb-2 flex items-center gap-2"><Users className={theme === 'gold' ? "text-[#d4af37]" : "text-[#00f2fe]"} /> {t('admin_settings')}</h4>
                                <p className="text-sm text-gray-500 mb-6">{t('admin_settings_desc')}</p>

                                {/* Add Admin Form */}
                                <div className={`p-4 border rounded-xl mb-6 ${theme === 'gold' ? 'border-[#d4af37]/30 bg-[#0a0a0a]/50' : 'border-[#00f2fe]/30 bg-[#020617]/50'}`}>
                                    <h5 className="text-sm font-bold text-gray-300 mb-3">{t('add_admin')}</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                        <input 
                                            type="text" 
                                            placeholder={t('admin_name')}
                                            value={newAdminName} 
                                            onChange={(e) => setNewAdminName(e.target.value)}
                                            className={`p-2.5 bg-[#0a0a0a] border border-gray-700 ${theme === 'gold' ? 'text-[#d4af37] focus:border-[#d4af37]' : 'text-[#00f2fe] focus:border-[#00f2fe]'} rounded-lg outline-none`}
                                        />
                                        <input 
                                            type="password" 
                                            placeholder={t('admin_pass')}
                                            value={newAdminPass} 
                                            onChange={(e) => setNewAdminPass(e.target.value)}
                                            className={`p-2.5 bg-[#0a0a0a] border border-gray-700 ${theme === 'gold' ? 'text-[#d4af37] focus:border-[#d4af37]' : 'text-[#00f2fe] focus:border-[#00f2fe]'} rounded-lg outline-none`}
                                        />
                                        <button 
                                            onClick={() => {
                                                if (newAdminName.trim() && newAdminPass.trim() && onUpdateAdminProfiles) {
                                                    onUpdateAdminProfiles([...(adminProfiles || []), { id: Date.now().toString(), name: newAdminName.trim(), password: newAdminPass.trim(), role: 'admin', permissions: {...DEFAULT_ADMIN_PERMISSIONS} }]);
                                                    setNewAdminName('');
                                                    setNewAdminPass('');
                                                }
                                            }}
                                            className={`px-4 py-2.5 rounded font-bold transition-colors ${
                                                theme === 'gold' ? 'bg-[#d4af37] text-black hover:bg-[#aa8c2c]' :
                                                'bg-[#00f2fe] text-[#020617] hover:bg-[#4facfe]'
                                            }`}
                                        >
                                            <Plus size={16} className="inline mr-1" /> {t('add_admin')}
                                        </button>
                                    </div>
                                </div>

                                {/* Admin List */}
                                {(adminProfiles || []).length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">{language === 'it' ? 'Nessun amministratore aggiunto' : language === 'en' ? 'No admins added' : 'Geen beheerders toegevoegd'}</p>
                                ) : (
                                    <div className="space-y-3">
                                        {(adminProfiles || []).map((admin: AdminProfile) => (
                                            <div key={admin.id} className={`border rounded-lg overflow-hidden ${theme === 'gold' ? 'border-[#d4af37]/20 bg-[#0a0a0a]/50' : 'border-[#00f2fe]/20 bg-[#020617]/50'}`}>
                                                {/* Admin Header Row */}
                                                <div className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${theme === 'gold' ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-[#00f2fe]/20 text-[#00f2fe]'}`}>
                                                            {admin.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>{admin.name}</p>
                                                            <p className="text-xs text-gray-500">{t('role')}: <span className="font-bold">{t(`role_${admin.role || 'admin'}`)}</span></p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                if (expandedAdminId === admin.id) {
                                                                    setExpandedAdminId(null);
                                                                    setEditingAdminId(null);
                                                                } else {
                                                                    setExpandedAdminId(admin.id);
                                                                    setEditingAdminId(admin.id);
                                                                    setEditAdminName(admin.name);
                                                                    setEditAdminPass(admin.password);
                                                                    setEditAdminRole(admin.role || 'admin');
                                                                    setEditAdminPerms(admin.permissions || {...DEFAULT_ADMIN_PERMISSIONS});
                                                                }
                                                            }}
                                                            className={`p-2 rounded transition-colors ${expandedAdminId === admin.id ? (theme === 'gold' ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-[#00f2fe]/20 text-[#00f2fe]') : 'text-gray-400 hover:text-gray-200'}`}
                                                            title={t('edit_admin')}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                if (onUpdateAdminProfiles) {
                                                                    onUpdateAdminProfiles((adminProfiles || []).filter(a => a.id !== admin.id));
                                                                }
                                                            }}
                                                            className="p-2 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                                                            title={t('delete_btn')}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expanded Edit Panel */}
                                                {expandedAdminId === admin.id && (
                                                    <div className={`p-4 border-t space-y-4 ${theme === 'gold' ? 'border-[#d4af37]/20 bg-[#0a0a0a]/80' : 'border-[#00f2fe]/20 bg-[#020617]/80'}`}>
                                                        {/* Name & Password */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('admin_name')}</label>
                                                                <input 
                                                                    type="text" value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)}
                                                                    className={`w-full p-2.5 bg-[#0a0a0a] border border-gray-700 ${theme === 'gold' ? 'text-[#d4af37] focus:border-[#d4af37]' : 'text-[#00f2fe] focus:border-[#00f2fe]'} rounded-lg outline-none`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('admin_pass')}</label>
                                                                <input 
                                                                    type="text" value={editAdminPass} onChange={(e) => setEditAdminPass(e.target.value)}
                                                                    className={`w-full p-2.5 bg-[#0a0a0a] border border-gray-700 ${theme === 'gold' ? 'text-[#d4af37] focus:border-[#d4af37]' : 'text-[#00f2fe] focus:border-[#00f2fe]'} rounded-lg outline-none`}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Role Selector */}
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t('role')}</label>
                                                            <div className="flex gap-2">
                                                                {(['admin', 'manager', 'viewer'] as const).map(role => (
                                                                    <button key={role} onClick={() => {
                                                                        setEditAdminRole(role);
                                                                        if (role === 'admin') setEditAdminPerms({...DEFAULT_ADMIN_PERMISSIONS});
                                                                        else if (role === 'manager') setEditAdminPerms({...DEFAULT_ADMIN_PERMISSIONS, editSettings: false, manageBackup: false, deleteOrders: false});
                                                                        else setEditAdminPerms({viewPlanner: true, editPlanner: false, viewOrders: true, editOrders: false, viewEmployees: true, editEmployees: false, viewStatistics: true, viewSettings: false, editSettings: false, manageBackup: false, deleteOrders: false});
                                                                    }}
                                                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all border ${editAdminRole === role ? (theme === 'gold' ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'bg-[#00f2fe]/20 border-[#00f2fe] text-[#00f2fe]') : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                                                                        {t(`role_${role}`)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Permissions Grid */}
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t('permissions')}</label>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                {(Object.keys(DEFAULT_ADMIN_PERMISSIONS) as (keyof AdminPermissions)[]).map(perm => (
                                                                    <label key={perm} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${editAdminPerms[perm] ? (theme === 'gold' ? 'border-[#d4af37]/50 bg-[#d4af37]/10' : 'border-[#00f2fe]/50 bg-[#00f2fe]/10') : 'border-gray-800 bg-transparent'}`}>
                                                                        <input 
                                                                            type="checkbox" checked={editAdminPerms[perm]} 
                                                                            onChange={(e) => setEditAdminPerms({...editAdminPerms, [perm]: e.target.checked})}
                                                                            className="accent-[#d4af37] w-4 h-4"
                                                                        />
                                                                        <span className={`text-xs font-medium ${editAdminPerms[perm] ? 'text-gray-200' : 'text-gray-500'}`}>{t(`perm_${perm}`)}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Save / Cancel */}
                                                        <div className="flex justify-end gap-2 pt-2">
                                                            <button onClick={() => { setExpandedAdminId(null); setEditingAdminId(null); }}
                                                                className="px-4 py-2 text-gray-400 font-bold text-sm hover:text-white transition-colors">
                                                                {t('cancel_edit')}
                                                            </button>
                                                            <button onClick={() => {
                                                                if (editAdminName.trim() && editAdminPass.trim() && onUpdateAdminProfiles) {
                                                                    const updated = (adminProfiles || []).map(a => 
                                                                        a.id === admin.id ? { ...a, name: editAdminName.trim(), password: editAdminPass.trim(), role: editAdminRole, permissions: editAdminPerms } : a
                                                                    );
                                                                    onUpdateAdminProfiles(updated);
                                                                    setExpandedAdminId(null);
                                                                    setEditingAdminId(null);
                                                                }
                                                            }}
                                                                className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${theme === 'gold' ? 'bg-[#d4af37] text-black hover:bg-[#aa8c2c]' : 'bg-[#00f2fe] text-[#020617] hover:bg-[#4facfe]'}`}>
                                                                <Check size={14} className="inline mr-1" /> {t('save_admin')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {activeTab === 'customization' && (
                        <div className={`p-6 rounded-xl border shadow-sm ${theme === 'gold' ? 'bg-[#141414] border-[#d4af37]/20' : 'bg-[#0f172a] border-[#00f2fe]/20'}`}>
                            <h4 className="font-bold text-gray-200 mb-6 flex items-center gap-2"><Palette className={theme === 'gold' ? "text-[#d4af37]" : "text-[#00f2fe]"} /> {t('customization')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { id: 'kbw', label: t('color_kbw') },
                                    { id: 'plw', label: t('color_plw') },
                                    { id: 'montage', label: t('color_mon') },
                                    { id: 'werkvoorbereid', label: t('color_wvb') },
                                    { id: 'holiday', label: t('color_hol') },
                                    { id: 'adv', label: t('color_adv') }
                                ].map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-3 border border-gray-800 bg-[#0a0a0a] rounded-xl">
                                        <span className="text-sm font-bold text-gray-300">{c.label}</span>
                                        <input 
                                            type="color" 
                                            value={(taskColors as any)?.[c.id] || '#ffffff'} 
                                            onChange={(e) => handleColorChange(c.id as any, e.target.value)}
                                            className="w-10 h-10 border-0 rounded cursor-pointer"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'workflow' && (
                        <div className={`p-6 rounded-xl border shadow-sm ${theme === 'gold' ? 'bg-[#141414] border-[#d4af37]/20' : 'bg-[#0f172a] border-[#00f2fe]/20'}`}>
                            <h4 className="font-bold text-gray-200 mb-2 flex items-center gap-2"><Workflow className={theme === 'gold' ? "text-[#d4af37]" : "text-[#00f2fe]"} /> {t('dept_title')}</h4>
                            <p className="text-sm text-gray-500 mb-6">{t('dept_desc')}</p>
                            
                            <div className="space-y-4 mb-6">
                                {departments.map(dept => (
                                    <div key={dept.id} className={`p-4 border border-gray-800 bg-[#0a0a0a] rounded-xl ${theme === 'gold' ? 'bg-[#0a0a0a]/50' : 'bg-[#020617]/50'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <h5 className="font-bold text-gray-200">{dept.name}</h5>
                                            <button onClick={() => handleDeleteDepartment(dept.id)} className="text-gray-600 hover:text-red-500 p-2 transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {dept.activities.map((act) => {
                                                const isVisible = dept.activityVisibility?.[act] !== false; // Default true
                                                return (
                                                    <label key={act} className={`flex items-center justify-between p-3 border border-gray-800 bg-[#0a0a0a] rounded-lg cursor-pointer transition-colors hover:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]/50`}>
                                                        <span className="text-sm text-gray-300">{act}</span>
                                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isVisible ? 'bg-green-600' : 'bg-gray-700'}`}>
                                                            <input 
                                                                type="checkbox" 
                                                                className="hidden" 
                                                                checked={isVisible} 
                                                                onChange={e => handleToggleActivityVisibility(dept.id, act, e.target.checked)} 
                                                            />
                                                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${isVisible ? 'translate-x-5' : ''}`}></div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={`p-4 rounded-xl border ${theme === 'gold' ? 'bg-[#d4af37]/5 border-[#d4af37]/30' : 'bg-[#00f2fe]/5 border-[#00f2fe]/30'}`}>
                                <h5 className={`font-bold text-sm mb-3 ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>{t('add_dept')}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <input type="text" placeholder="Naam (bv. CNC)" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} className={`p-2 bg-[#0a0a0a] border border-gray-700 text-gray-200 rounded-lg text-sm outline-none focus:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]`} />
                                    <input type="text" placeholder={t('acts_placeholder')} value={newDeptActs} onChange={e => setNewDeptActs(e.target.value)} className={`p-2 bg-[#0a0a0a] border border-gray-700 text-gray-200 rounded-lg text-sm outline-none focus:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]`} />
                                </div>
                                <button onClick={handleAddDepartment} className={`bg-gradient-to-r ${theme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a]' : 'from-[#00f2fe] to-[#4facfe] text-[#020617]'} px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2`}><Plus size={14}/> Toevoegen</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'mobile' && mobilePermissions && (
                        <div className={`p-6 rounded-xl border shadow-sm ${theme === 'gold' ? 'bg-[#141414] border-[#d4af37]/20' : 'bg-[#0f172a] border-[#00f2fe]/20'}`}>
                            <h4 className="font-bold text-gray-200 mb-2 flex items-center gap-2"><Smartphone className={theme === 'gold' ? "text-[#d4af37]" : "text-[#00f2fe]"} /> {t('mob_perm_title')}</h4>
                            <p className="text-sm text-gray-500 mb-6">{t('mob_perm_desc')}</p>
                            
                            {workers && workers.length === 0 ? (
                                <p className="text-sm text-gray-400">{t('no_workers')}</p>
                            ) : (
                                <div className="space-y-6">
                                    {workers?.map(worker => {
                                        const perms = mobilePermissions[worker] || {
                                            showClientName: false,
                                            allowPhotoUpload: false,
                                            allowDrawingsView: false,
                                            showAddress: false,
                                        };
                                        return (
                                            <div key={worker} className={`p-4 border border-gray-700 rounded-xl ${theme === 'gold' ? 'bg-[#0a0a0a]/50' : 'bg-[#020617]/50'}`}>
                                                <h5 className="font-bold text-gray-200 mb-4 text-sm">{worker}</h5>
                                                <div className="space-y-3">
                                                    <label className={`flex items-center justify-between p-3 border border-gray-800 bg-[#0a0a0a] rounded-lg cursor-pointer transition-colors hover:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]/50`}>
                                                        <span className="text-sm text-gray-300">{t('perm_client')}</span>
                                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${perms.showClientName ? 'bg-green-600' : 'bg-gray-700'}`}>
                                                            <input type="checkbox" className="hidden" checked={perms.showClientName} onChange={e => handleMobilePermChange(worker, 'showClientName', e.target.checked)} />
                                                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${perms.showClientName ? 'translate-x-5' : ''}`}></div>
                                                        </div>
                                                    </label>
                                                    <label className={`flex items-center justify-between p-3 border border-gray-800 bg-[#0a0a0a] rounded-lg cursor-pointer transition-colors hover:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]/50`}>
                                                        <span className="text-sm text-gray-300">{t('perm_address')}</span>
                                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${perms.showAddress ? 'bg-green-600' : 'bg-gray-700'}`}>
                                                            <input type="checkbox" className="hidden" checked={perms.showAddress} onChange={e => handleMobilePermChange(worker, 'showAddress', e.target.checked)} />
                                                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${perms.showAddress ? 'translate-x-5' : ''}`}></div>
                                                        </div>
                                                    </label>
                                                    <label className={`flex items-center justify-between p-3 border border-gray-800 bg-[#0a0a0a] rounded-lg cursor-pointer transition-colors hover:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]/50`}>
                                                        <span className="text-sm text-gray-300">{t('perm_photo')}</span>
                                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${perms.allowPhotoUpload ? 'bg-green-600' : 'bg-gray-700'}`}>
                                                            <input type="checkbox" className="hidden" checked={perms.allowPhotoUpload} onChange={e => handleMobilePermChange(worker, 'allowPhotoUpload', e.target.checked)} />
                                                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${perms.allowPhotoUpload ? 'translate-x-5' : ''}`}></div>
                                                        </div>
                                                    </label>
                                                    <label className={`flex items-center justify-between p-3 border border-gray-800 bg-[#0a0a0a] rounded-lg cursor-pointer transition-colors hover:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]/50`}>
                                                        <span className="text-sm text-gray-300">{t('perm_draw')}</span>
                                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${perms.allowDrawingsView ? 'bg-green-600' : 'bg-gray-700'}`}>
                                                            <input type="checkbox" className="hidden" checked={perms.allowDrawingsView} onChange={e => handleMobilePermChange(worker, 'allowDrawingsView', e.target.checked)} />
                                                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${perms.allowDrawingsView ? 'translate-x-5' : ''}`}></div>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'production' && (
                        <div className="space-y-6">
                            <div className={`p-6 rounded-xl border shadow-sm ${theme === 'gold' ? 'bg-[#141414] border-[#d4af37]/20' : 'bg-[#0f172a] border-[#00f2fe]/20'}`}>
                                <h4 className="font-bold text-gray-200 mb-4 flex items-center gap-2"><Database className={theme === 'gold' ? "text-[#d4af37]" : "text-[#00f2fe]"} /> {t('del_completed')}</h4>
                                <p className="text-sm text-gray-500 mb-4">{t('del_completed_desc')}</p>
                                <button onClick={onDeleteCompleted} className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors"><Trash2 size={18}/> {t('del_completed')}</button>
                            </div>
                            
                            <div className={`p-6 rounded-xl border shadow-sm ${theme === 'gold' ? 'bg-[#141414] border-[#d4af37]/20' : 'bg-[#0f172a] border-[#00f2fe]/20'}`}>
                                <h4 className="font-bold text-gray-200 mb-4 flex items-center gap-2"><UploadCloud className={theme === 'gold' ? "text-[#d4af37]" : "text-[#00f2fe]"} /> {t('backup_title')}</h4>
                                <p className="text-sm text-gray-500 mb-4">{t('backup_desc')}</p>
                                <div className="flex gap-4">
                                    <button onClick={onBackup} className={`bg-gradient-to-r ${theme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a]' : 'from-[#00f2fe] to-[#4facfe] text-[#020617]'} px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md active:scale-95`}><Download size={18}/> {t('backup_btn')}</button>
                                    <input type="file" ref={restoreInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && onRestore && onRestore(e.target.files[0])} />
                                    <button onClick={() => restoreInputRef.current?.click()} className="bg-gray-800 border border-gray-600 text-gray-200 px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-700"><Upload size={18}/> {t('restore_btn')}</button>
                                </div>
                            </div>

                            <div className="bg-red-900/10 p-6 rounded-xl border border-red-500/30 shadow-sm">
                                <h4 className="font-bold text-red-500 mb-4 flex items-center gap-2"><AlertOctagon /> {t('critical_actions')}</h4>
                                <div className="flex flex-wrap gap-4">
                                    <button onClick={onTriggerWizard} className={`bg-[#0a0a0a] border border-gray-700 text-gray-300 px-6 py-2.5 rounded-lg font-bold hover:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}] flex items-center gap-2`}><RefreshCw size={18}/> {t('wizard_btn')}</button>
                                    <button onClick={onTotalReset} className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-700 flex items-center gap-2 shadow-lg"><Trash2 size={18}/> {t('reset_db_btn')}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'partners' && (
                        <div className={`p-6 rounded-xl border shadow-sm ${theme === 'gold' ? 'bg-[#141414] border-[#d4af37]/20' : 'bg-[#0f172a] border-[#00f2fe]/20'}`}>
                            <h4 className="text-lg font-bold text-gray-200 mb-2 flex items-center gap-2"><Briefcase className={theme === 'gold' ? "text-[#d4af37]" : "text-[#00f2fe]"} /> {t('subcontractors_title')}</h4>
                            <p className="text-sm text-gray-400 mb-4">{t('subcontractors_desc')}</p>
                            
                            {/* Add/Edit Form */}
                            <div className={`bg-[#0a0a0a] p-4 rounded-xl border border-gray-800 mb-6`}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input type="text" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder={t('sub_name')} className={`w-full p-2.5 bg-[#141414] border border-gray-700 text-white rounded-lg outline-none focus:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]`} />
                                <input type="email" value={newSubEmail} onChange={(e) => setNewSubEmail(e.target.value)} placeholder={t('sub_email')} className={`w-full p-2.5 bg-[#141414] border border-gray-700 text-white rounded-lg outline-none focus:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]`} />
                                <input type="tel" value={newSubPhone} onChange={(e) => setNewSubPhone(e.target.value)} placeholder={t('sub_phone')} className={`w-full p-2.5 bg-[#141414] border border-gray-700 text-white rounded-lg outline-none focus:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]`} />
                                <input type="text" value={newSubContact} onChange={(e) => setNewSubContact(e.target.value)} placeholder={t('sub_contact')} className={`w-full p-2.5 bg-[#141414] border border-gray-700 text-white rounded-lg outline-none focus:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]`} />
                              </div>
                              <input type="text" value={newSubAddress} onChange={(e) => setNewSubAddress(e.target.value)} placeholder={t('sub_address')} className={`w-full p-2.5 bg-[#141414] border border-gray-700 text-white rounded-lg outline-none focus:border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}] mb-3`} />
                              <button onClick={handleAddSub} className={`w-full px-6 py-2.5 bg-gradient-to-r ${theme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a]' : 'from-[#00f2fe] to-[#4facfe] text-[#020617]'} font-bold rounded-lg active:scale-95`}>{t('add_sub')}</button>
                            </div>

                            {/* List of Subcontractors */}
                            <div className="space-y-3">
                                {subcontractors && subcontractors.length > 0 ? (
                                  subcontractors.map(sub => (
                                    <div key={sub.id} className="p-4 border border-gray-800 bg-[#0a0a0a] rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Building2 size={16} className={theme === 'gold' ? "text-[#d4af37]" : "text-[#00f2fe]"}/>
                                            <span className="font-bold text-gray-200">{sub.name}</span>
                                          </div>
                                          <button onClick={() => onDeleteSubcontractor && onDeleteSubcontractor(sub.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                                        </div>
                                        <div className="text-sm text-gray-400 space-y-1 pl-6">
                                          {sub.email && <div>📧 {sub.email}</div>}
                                          {sub.phone && <div>📞 {sub.phone}</div>}
                                          {sub.contactPerson && <div>👤 {sub.contactPerson}</div>}
                                          {sub.address && <div>📍 {sub.address}</div>}
                                        </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center text-gray-400 py-6">{t('no_subs')}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
