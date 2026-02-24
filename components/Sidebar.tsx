import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, FileText, UserCog, Plus, Users, CalendarClock, ChevronLeft, ChevronRight, Box, LogOut, QrCode, BarChart3, Globe, Hexagon, Palette } from 'lucide-react';
import { CompanySettings, Language } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onAddOrder: () => void;
  onLogout?: () => void;
  currentAdmin?: string | null;
  companySettings?: CompanySettings;
  customColor?: string;
  customTextColor?: string; 
  width?: number;
  currentLang?: Language;
  onLanguageChange?: (lang: Language) => void;
  plannerScale?: number;
  onPlannerScaleChange?: (scale: number) => void;
  onOpenTodayReport?: () => void;
  theme?: 'gold' | 'space' | 'space-light';
  onThemeChange?: (theme: 'gold' | 'space' | 'space-light') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, setIsOpen, isCollapsed, toggleCollapse, currentView, onNavigate, onAddOrder, onLogout, currentAdmin, companySettings, customColor, customTextColor, width = 264, currentLang = 'nl', onLanguageChange, plannerScale = 1, onPlannerScaleChange, onOpenTodayReport, theme = 'gold', onThemeChange
}) => {
  const [showQr, setShowQr] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  // --- CONFIGURAZIONE v2.3.1 ---
  const VERSION = "v2.3.1";
  
  // Cloud URL for mobile access - update this with your actual cloud URL
  const CLOUD_BASE_URL = 'https://proximasuite.vercel.app'; // URL Vercel di produzione

  useEffect(() => {
    // Generate QR URL - always use cloud URL for internet-wide access
    const generateQrUrl = () => {
      // Use cloud URL with werkplaats view
      setQrUrl(`${CLOUD_BASE_URL}/?view=werkplaats`);
    };
    
    generateQrUrl();
  }, []);

  const t = (key: string) => {
      const dict: Record<string, Record<string, string>> = {
          nl: { 
            order_planning: "Order Planning", 
            team_schedule: "Team Rooster", 
            employees: "Personeel Lijst", 
            rubrica_ditte: "Rubrica Ditte",
            archive: "Order Archief", 
            statistics: "Uren Statistieken", 
            settings: "Instellingen & Backup", 
            new_order: "NIEUWE ORDER", 
            scan_mobile: "Scan voor Mobiel", 
            language: "Taal Selecteren", 
            powered_by: "Powered by", 
            wifi_warn: "Zorg dat mobiel op WiFi zit!", 
            select_theme: "Thema Selecteren", 
            theme_gold: "Goud", 
            theme_space: "Space Blue",
                        theme_space_light: "Space Blue Light",
            version_label: "Versie"
          },
          en: { 
                        theme_space_light: "Space Blue Light",
            order_planning: "Order Planning", 
            team_schedule: "Team Schedule", 
            employees: "Staff List", 
            rubrica_ditte: "Contractor Directory",
            archive: "Order Archive", 
            statistics: "Statistics", 
            settings: "Settings & Backup", 
            new_order: "NEW ORDER", 
            scan_mobile: "Scan Mobile", 
            language: "Language", 
            powered_by: "Powered by", 
            wifi_warn: "Ensure mobile is on WiFi!", 
            select_theme: "Select Theme", 
            theme_gold: "Gold", 
            theme_space: "Space Blue",
            version_label: "Version"
          },
          it: { 
            order_planning: "Piano Ordini", 
            team_schedule: "Orari Team", 
            employees: "Lista Personale", 
            rubrica_ditte: "Rubrica Ditte",
            archive: "Archivio Ordini", 
            statistics: "Statistiche", 
            settings: "Impostazioni & Backup", 
            new_order: "NUOVO ORDINE", 
            scan_mobile: "Mobile QR", 
            language: "Lingua", 
            powered_by: "Sviluppato da", 
            wifi_warn: "Assicurati di essere in WiFi!", 
            select_theme: "Seleziona Tema", 
            theme_gold: "Oro", 
            theme_space: "Blu Spaziale",
                        theme_space_light: "Blu Spaziale Chiaro",
            version_label: "Versione"
          }
      };
      return dict[currentLang]?.[key] || key;
  };

  return (
    <>
      <div className={`fixed inset-0 z-20 bg-black/80 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}/>
      
      <div className={`fixed top-0 left-0 z-30 h-full transition-all duration-300 ease-in-out flex flex-col shadow-[4px_0_30px_rgba(0,0,0,0.8)] lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${theme === 'gold' ? 'bg-[#0a0a0a]/95 border-[#d4af37]/20 text-gray-300' : theme === 'space-light' ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-[#020617]/95 border-[#00f2fe]/20 text-gray-300'} backdrop-blur-2xl border-r`} style={{ width: isCollapsed ? '80px' : `${width}px` }}>
        
        <button onClick={toggleCollapse} className={`hidden lg:flex absolute -right-3 top-24 p-1.5 rounded-full ${theme === 'gold' ? 'shadow-[0_0_10px_rgba(212,175,55,0.4)] border-[#d4af37]/50 bg-[#1a1a1a] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0a0a0a]' : theme === 'space-light' ? 'shadow-sm border-slate-200 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-800' : 'shadow-[0_0_10px_rgba(0,242,254,0.4)] border-[#00f2fe]/50 bg-[#0f172a] text-[#00f2fe] hover:bg-[#00f2fe] hover:text-[#020617]'} border z-40 transition-colors`}>
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        
        <div className={`flex items-center h-28 shrink-0 border-b ${theme === 'gold' ? 'border-[#d4af37]/20' : 'border-[#00f2fe]/20'} ${isCollapsed ? 'justify-center' : 'px-8 gap-4'}`}>
            <div className={`w-11 h-11 ${theme === 'gold' ? 'bg-gradient-to-br from-[#d4af37] to-[#aa8c2c] shadow-[0_0_15px_rgba(212,175,55,0.4)] border-[#ffd700]/30 text-[#0a0a0a]' : theme === 'space-light' ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-gradient-to-br from-[#00f2fe] to-[#4facfe] shadow-[0_0_15px_rgba(0,242,254,0.4)] border-[#00f2fe]/30 text-[#020617]'} rounded-xl flex items-center justify-center border shrink-0 overflow-hidden p-1`}>
                {companySettings?.logoUrl ? (
                    <img src={companySettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                    <Box size={22} />
                )}
            </div>
            {!isCollapsed && (
                <div className="flex flex-col">
                    <span className={`text-xl font-black tracking-tighter ${theme === 'gold' ? 'text-[#d4af37]' : theme === 'space-light' ? 'text-slate-800' : 'text-[#00f2fe]'} drop-shadow-md leading-none`}>{companySettings?.name || 'SNEP'}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Werkbeheer</span>
                </div>
            )}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-8 custom-scrollbar flex flex-col">
            <button onClick={() => onAddOrder()} className={`flex items-center w-full py-4 rounded-2xl transition-all ${theme === 'gold' ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a] shadow-[0_8px_20px_rgba(212,175,55,0.3)] border-[#ffd700]/50' : theme === 'space-light' ? 'bg-gradient-to-r from-slate-100 to-white text-slate-800 shadow-sm border-slate-200' : 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#020617] shadow-[0_8px_20px_rgba(0,242,254,0.3)] border-[#00f2fe]/50'} active:scale-95 border ${isCollapsed ? 'justify-center' : 'px-5 gap-3'}`}>
              <Plus size={20} />{!isCollapsed && <span className="font-bold text-sm tracking-widest uppercase">{t('new_order')}</span>}
          </button>
          
          <div className="space-y-2">
                {[
                { id: 'dashboard', icon: LayoutDashboard, label: t('order_planning') },
                { id: 'team-schedule', icon: CalendarClock, label: t('team_schedule') },
                { id: 'employees', icon: Users, label: t('employees') },
                { id: 'rubrica-ditte', icon: UserCog, label: t('rubrica_ditte') },
                { id: 'statistics', icon: BarChart3, label: t('statistics') },
                { id: 'archief', icon: FileText, label: t('archive') },
                { id: 'instellingen', icon: Settings, label: t('settings') }
                ].map(item => (
                <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex items-center w-full py-3.5 rounded-2xl transition-all duration-300 ${currentView === item.id ? `bg-gradient-to-r ${theme === 'gold' ? 'from-[#d4af37]/20 border-[#d4af37] text-[#d4af37] shadow-[inset_4px_0_0_0_#d4af37]' : theme === 'space-light' ? 'from-slate-100 border-slate-300 text-slate-800 shadow-none' : 'from-[#00f2fe]/20 border-[#00f2fe] text-[#00f2fe] shadow-[inset_4px_0_0_0_#00f2fe]'} to-transparent font-semibold border-l-2` : `text-gray-400 hover:text-[${theme === 'gold' ? '#d4af37' : (theme === 'space-light' ? '#334155' : '#00f2fe')}] hover:bg-[${theme === 'gold' ? '#d4af37' : (theme === 'space-light' ? '#f1f5f9' : '#00f2fe')}]/5 border-l-2 border-transparent`} ${isCollapsed ? 'justify-center px-0' : 'px-5 gap-4'}`}>
                    <item.icon size={20} className={currentView === item.id ? `${theme === 'gold' ? 'text-[#d4af37] drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]' : theme === 'space-light' ? 'text-slate-800' : 'text-[#00f2fe] drop-shadow-[0_0_5px_rgba(0,242,254,0.5)]'}` : ''} />
                    <span className={isCollapsed ? 'hidden' : `text-sm tracking-wide ${theme === 'space-light' ? 'text-slate-700' : ''}`}>{item.label}</span>
                </button>
              ))}
          </div>

          {!isCollapsed && (
            <>
              {/* THEME SELECTOR */}
              <div className={`pt-6 border-t ${theme === 'gold' ? 'border-[#d4af37]/20' : 'border-[#00f2fe]/20'} space-y-3`}>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500 tracking-wider"><Palette size={14}/> {t('select_theme')}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => onThemeChange?.('gold')} className={`p-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${theme === 'gold' ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'bg-transparent border-gray-700 text-gray-500 hover:text-[#d4af37]'}`}>{t('theme_gold')}</button>
                      <button onClick={() => onThemeChange?.('space')} className={`p-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${theme === 'space' ? 'bg-[#00f2fe]/20 border-[#00f2fe] text-[#00f2fe]' : 'bg-transparent border-gray-700 text-gray-500 hover:text-[#00f2fe]'}`}>{t('theme_space')}</button>
                      <button onClick={() => onThemeChange?.('space-light')} className={`p-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${theme === 'space-light' ? 'bg-white border-[#00f2fe] text-[#00f2fe]' : 'bg-transparent border-gray-700 text-gray-500 hover:text-[#00f2fe]'}`}>{t('theme_space_light') || 'Space Light'}</button>
                    </div>
              </div>

              {/* LANGUAGE SELECTOR */}
              <div className={`pt-6 border-t ${theme === 'gold' ? 'border-[#d4af37]/20' : 'border-[#00f2fe]/20'} space-y-3`}>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500 tracking-wider"><Globe size={14}/> {t('language')}</div>
                  <div className="grid grid-cols-3 gap-2">
                      {['nl', 'en', 'it'].map(l => (
                          <button key={l} onClick={() => onLanguageChange?.(l as Language)} className={`p-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${currentLang === l ? (theme === 'gold' ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'bg-[#00f2fe]/20 border-[#00f2fe] text-[#00f2fe]') : 'bg-transparent border-gray-700 text-gray-500'}`}>{l}</button>
                      ))}
                  </div>
              </div>

              {/* QR MOBILE */}
              <div className={`mt-8 pt-6 border-t ${theme === 'gold' ? 'border-[#d4af37]/20' : 'border-[#00f2fe]/20'}`}>
                  <button onClick={() => setShowQr(!showQr)} className={`flex items-center gap-2 text-gray-400 hover:text-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}] text-xs font-bold uppercase mb-3 w-full`}><QrCode size={16} /> {t('scan_mobile')}</button>
                  {showQr && qrUrl && (
                    <div className={`bg-[#141414] p-4 rounded-2xl flex flex-col items-center gap-3 border ${theme === 'gold' ? 'border-[#d4af37]/30' : 'border-[#00f2fe]/30'}`}>
                      <div className="bg-white p-2 rounded-xl w-full flex items-center justify-center">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`} className="w-full max-w-[120px] mix-blend-multiply" alt="QR" />
                      </div>
                      <span className="text-[9px] text-gray-500 text-center uppercase tracking-wider">{t('wifi_warn')}</span>
                    </div>
                  )}
              </div>

              {/* BRANDING FOOTER */}
              <div className="mt-auto pt-8 pb-4 flex flex-col items-center justify-center gap-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a] flex items-center justify-center mb-1 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                     <Hexagon size={18} className="fill-current" />
                  </div>
                  <span className="text-[12px] font-thin tracking-[0.3em] text-[#d4af37]">PROXIMA SUITE</span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">{t('powered_by')} <span className="text-[#d4af37] font-bold">SG TechLab</span></span>
                  <span className="text-[8px] text-gray-600 font-mono mt-1 uppercase">{t('version_label')} {VERSION}</span>
              </div>
            </>
          )}
        </nav>
        
        <div className={`bg-[#050505] border-t ${theme === 'gold' ? 'border-[#d4af37]/30' : 'border-[#00f2fe]/30'} p-5 flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-[#1a1a1a] border ${theme === 'gold' ? 'border-[#d4af37]/50 text-[#d4af37]' : 'border-[#00f2fe]/50 text-[#00f2fe]'} flex items-center justify-center`}><UserCog size={16} /></div>
                {!isCollapsed && <div className="text-[10px] font-bold tracking-wider"><p className="text-gray-200">{currentAdmin || 'ADMIN'}</p><p className={`${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'} flex items-center gap-1`}><span className={`w-1.5 h-1.5 rounded-full ${theme === 'gold' ? 'bg-[#d4af37]' : 'bg-[#00f2fe]'} animate-pulse`}></span> ONLINE</p></div>}
            </div>
            {onLogout && <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-400 rounded-xl transition-colors"><LogOut size={18}/></button>}
        </div>
      </div>
    </>
  );
};