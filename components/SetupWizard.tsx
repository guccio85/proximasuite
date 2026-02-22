
import React, { useState, useRef } from 'react';
import { CompanySettings, Language } from '../types';
import { UploadCloud, Check, Building2, Image as ImageIcon, ArrowRight, Lock, Hexagon, Globe, X, Palette } from 'lucide-react';

interface SetupWizardProps {
  onComplete: (settings: CompanySettings) => void;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  theme?: 'gold' | 'space';
  onThemeChange?: (theme: 'gold' | 'space') => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, language = 'nl', onLanguageChange, theme = 'gold', onThemeChange }) => {
  const [name, setName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
      nl: { 
          title: "Welkom bij PROXIMA SUITE", 
          sub: "Configureer uw systeem voor de eerste keer.", 
          comp_name: "Bedrijfsnaam *", 
          pass: "Beheerders Wachtwoord *", 
          pass_desc: "Vereist voor het bewerken van orders.", 
          logo: "Bedrijfslogo (Optioneel)", 
          upload: "Klik om te uploaden", 
          start: "Start Applicatie", 
          lang: "Taal Selecteren",
          theme_title: "Thema",
          theme_gold: "Goud",
          theme_space: "Space Blue"
      },
      en: { 
          title: "Welcome to PROXIMA SUITE", 
          sub: "Configure your system for the first time.", 
          comp_name: "Company Name *", 
          pass: "Admin Password *", 
          pass_desc: "Required for editing orders.", 
          logo: "Company Logo (Optional)", 
          upload: "Click to upload", 
          start: "Start Application", 
          lang: "Select Language",
          theme_title: "Theme",
          theme_gold: "Gold",
          theme_space: "Space Blue"
      },
      it: { 
          title: "Benvenuto in PROXIMA SUITE", 
          sub: "Configura il sistema per la prima volta.", 
          comp_name: "Nome Azienda *", 
          pass: "Password Admin *", 
          pass_desc: "Richiesta per modificare gli ordini.", 
          logo: "Logo Aziendale (Opzionale)", 
          upload: "Clicca per caricare", 
          start: "Avvia Applicazione", 
          lang: "Seleziona Lingua",
          theme_title: "Tema",
          theme_gold: "Oro",
          theme_space: "Blu Spaziale"
      }
    };
    return dict[language]?.[key] || key;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setLogo(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && adminPassword.trim()) {
      onComplete({ name: name.trim(), logoUrl: logo, adminPassword: adminPassword.trim() });
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'gold' ? 'bg-[#0a0a0a]' : 'bg-[#020617]'} flex items-center justify-center p-4 relative overflow-hidden font-sans`}>
      {/* Background Ornaments */}
      <div className={`absolute top-[-20%] left-[-10%] w-96 h-96 ${theme === 'gold' ? 'bg-[#d4af37]/10' : 'bg-[#00f2fe]/10'} rounded-full blur-[120px] pointer-events-none`}></div>
      <div className={`absolute bottom-[-20%] right-[-10%] w-96 h-96 ${theme === 'gold' ? 'bg-[#aa8c2c]/10' : 'bg-[#4facfe]/10'} rounded-full blur-[120px] pointer-events-none`}></div>

      <div className={`bg-[#141414]/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_rgba(${theme === 'gold' ? '212,175,55' : '0,242,254'},0.15)] w-full max-w-4xl overflow-hidden flex flex-col md:flex-row border ${theme === 'gold' ? 'border-[#d4af37]/30' : 'border-[#00f2fe]/30'} z-10`}>
        
        {/* Left Side - Info */}
        <div className={`bg-gradient-to-b ${theme === 'gold' ? 'from-[#0f0f0f] to-[#1a1a1a] border-[#d4af37]/20' : 'from-[#020617] to-[#0f172a] border-[#00f2fe]/20'} text-gray-300 p-10 md:w-1/2 flex flex-col justify-between border-r relative`}>
          <div>
            <div className="flex items-center gap-3 mb-8">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] border-[#ffd700]/30 shadow-[0_0_15px_rgba(212,175,55,0.4)] text-[#0a0a0a]' : 'from-[#00f2fe] to-[#4facfe] border-[#00f2fe]/30 shadow-[0_0_15px_rgba(0,242,254,0.4)] text-[#020617]'} flex items-center justify-center border`}>
                   <Hexagon size={24} className="fill-current" />
                </div>
                <div className="flex flex-col">
                    <span className={`text-xl font-thin tracking-[0.2em] ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>PROXIMA</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Powered by SG TechLab</span>
                </div>
            </div>
            
            <h2 className={`text-3xl font-black mb-3 ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'} drop-shadow-md tracking-tight`}>{t('title')}</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              {t('sub')}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-400 font-bold">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${theme === 'gold' ? 'bg-[#d4af37]/10 border-[#d4af37]/50 text-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'bg-[#00f2fe]/10 border-[#00f2fe]/50 text-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.2)]'}`}>1</div>
              <span className="text-gray-300">{t('comp_name')}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 font-bold">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${theme === 'gold' ? 'bg-[#d4af37]/10 border-[#d4af37]/50 text-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'bg-[#00f2fe]/10 border-[#00f2fe]/50 text-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.2)]'}`}>2</div>
              <span className="text-gray-300">{t('pass')}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 font-bold">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${theme === 'gold' ? 'bg-[#d4af37]/10 border-[#d4af37]/50 text-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'bg-[#00f2fe]/10 border-[#00f2fe]/50 text-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.2)]'}`}>3</div>
              <span className="text-gray-300">{t('logo')}</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-10 md:w-1/2 overflow-y-auto bg-[#141414] relative">
          
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
              {onThemeChange && (
                  <div className="flex items-center gap-2">
                      <Palette size={14} className={theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}/>
                      <div className="flex gap-1">
                          <button onClick={() => onThemeChange('gold')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${theme === 'gold' ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>{t('theme_gold')}</button>
                          <button onClick={() => onThemeChange('space')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${theme === 'space' ? 'bg-[#00f2fe]/20 border-[#00f2fe] text-[#00f2fe]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>{t('theme_space')}</button>
                      </div>
                  </div>
              )}
              {onLanguageChange && (
                <div className="flex items-center gap-2">
                    <Globe size={14} className={theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}/>
                    <div className="flex gap-1">
                        {['nl', 'en', 'it'].map(l => (
                            <button key={l} onClick={() => onLanguageChange(l as Language)} className={`px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${language === l ? `bg-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]/20 border-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}] text-[${theme === 'gold' ? '#d4af37' : '#00f2fe'}]` : 'border-transparent text-gray-500 hover:text-gray-300'}`}>{l}</button>
                        ))}
                    </div>
                </div>
              )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-xs font-bold ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'} uppercase tracking-wider mb-2`}>
                {t('comp_name')}
              </label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="PROXIMA B.V."
                className={`w-full px-4 py-3 bg-[#0a0a0a] border ${theme === 'gold' ? 'border-[#d4af37]/30 focus:ring-[#d4af37] focus:border-[#d4af37]' : 'border-[#00f2fe]/30 focus:ring-[#00f2fe] focus:border-[#00f2fe]'} text-white font-bold rounded-xl focus:ring-1 outline-none transition-all placeholder-gray-700 shadow-inner`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'} uppercase tracking-wider mb-2 flex items-center gap-2`}>
                <Lock size={14} /> {t('pass')}
              </label>
              <input 
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-[#0a0a0a] border ${theme === 'gold' ? 'border-[#d4af37]/30 text-[#d4af37] focus:ring-[#d4af37] focus:border-[#d4af37]' : 'border-[#00f2fe]/30 text-[#00f2fe] focus:ring-[#00f2fe] focus:border-[#00f2fe]'} rounded-xl focus:ring-1 outline-none transition-all font-mono tracking-widest placeholder-gray-700 shadow-inner`}
              />
              <p className="text-[10px] text-gray-500 mt-2 italic">{t('pass_desc')}</p>
            </div>

            <div>
              <label className={`block text-xs font-bold ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'} uppercase tracking-wider mb-2`}>
                {t('logo')}
              </label>
              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                className="hidden"
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed ${theme === 'gold' ? 'border-[#d4af37]/30 hover:border-[#d4af37]/80' : 'border-[#00f2fe]/30 hover:border-[#00f2fe]/80'} bg-[#0a0a0a] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-[#111] transition-all group shadow-inner`}
              >
                {logo ? (
                  <div className="relative">
                    <img src={logo} alt="Preview" className="h-16 object-contain drop-shadow-md" />
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLogo(undefined); }}
                        className="absolute -top-3 -right-3 bg-red-900/90 text-white rounded-full p-1 border border-red-500 hover:bg-red-700 shadow-lg"
                    >
                        <span className="sr-only">Remove</span>
                        <X size={14}/>
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className={`${theme === 'gold' ? 'text-[#d4af37]/60 group-hover:text-[#d4af37]' : 'text-[#00f2fe]/60 group-hover:text-[#00f2fe]'} mb-2 transition-colors drop-shadow-sm`} size={32} />
                    <p className="text-sm text-gray-300 font-bold">{t('upload')}</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">PNG, JPG</p>
                  </>
                )}
              </div>
            </div>

            <div className="pt-8">
              <button 
                type="submit"
                disabled={!name.trim() || !adminPassword.trim()}
                className={`w-full bg-gradient-to-r ${theme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] hover:from-[#e5c558] hover:to-[#c4a53d] text-[#0a0a0a] shadow-[0_8px_20px_rgba(212,175,55,0.4)]' : 'from-[#00f2fe] to-[#4facfe] hover:from-[#33ffff] hover:to-[#6fc3ff] text-[#020617] shadow-[0_8px_20px_rgba(0,242,254,0.4)]'} disabled:opacity-30 disabled:cursor-not-allowed font-black tracking-wider uppercase py-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95`}
              >
                {t('start')} <ArrowRight size={20} />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
