import React from 'react';
import { Language, CompanySettings } from '../types';
import { Trash2 } from 'lucide-react';

interface SubcontractorDirectoryProps {
  companySettings: CompanySettings | null;
  onUpdateSettings: (settings: CompanySettings) => void;
  language: Language;
  newSubName: string;
  setNewSubName: (value: string) => void;
  newSubEmail: string;
  setNewSubEmail: (value: string) => void;
  newSubPhone: string;
  setNewSubPhone: (value: string) => void;
  newSubAddress: string;
  setNewSubAddress: (value: string) => void;
  newSubContact: string;
  setNewSubContact: (value: string) => void;
}

export const SubcontractorDirectory: React.FC<SubcontractorDirectoryProps> = ({
  companySettings,
  onUpdateSettings,
  language,
  newSubName,
  setNewSubName,
  newSubEmail,
  setNewSubEmail,
  newSubPhone,
  setNewSubPhone,
  newSubAddress,
  setNewSubAddress,
  newSubContact,
  setNewSubContact
}) => {
  const handleAddSub = () => {
    if(newSubName.trim()) {
      const newSub: any = {
        id: Date.now().toString(),
        name: newSubName.trim(),
        email: newSubEmail.trim() || undefined,
        phone: newSubPhone.trim() || undefined,
        address: newSubAddress.trim() || undefined,
        contactPerson: newSubContact.trim() || undefined
      };
      const updated = { ...companySettings, subcontractors: [...(companySettings?.subcontractors || []), newSub] };
      onUpdateSettings(updated);
      setNewSubName('');
      setNewSubEmail('');
      setNewSubPhone('');
      setNewSubAddress('');
      setNewSubContact('');
    }
  };

  const handleDeleteSub = (id: string) => {
    const updated = { ...companySettings, subcontractors: (companySettings?.subcontractors || []).filter(s => s.id !== id) };
    onUpdateSettings(updated);
  };

  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
      nl: { 
        rubrica_title: "Rubrica Ditte", 
        rubrica_desc: "Beheer externe leveranciers en partners.",
        sub_name: "Bedrijfsnaam *", 
        sub_email: "Email", 
        sub_phone: "Telefoon", 
        sub_contact: "Contactpersoon", 
        sub_address: "Adres", 
        add_sub: "Partner Toevoegen", 
        no_subs: "Geen bedrijven toegevoegd", 
        delete_btn: "Verwijderen"
      },
      en: { 
        rubrica_title: "Contractor Directory", 
        rubrica_desc: "Manage external suppliers and partners.",
        sub_name: "Company Name *", 
        sub_email: "Email", 
        sub_phone: "Phone", 
        sub_contact: "Contact Person", 
        sub_address: "Address", 
        add_sub: "Add Partner", 
        no_subs: "No companies added", 
        delete_btn: "Delete"
      },
      it: { 
        rubrica_title: "Rubrica Ditte", 
        rubrica_desc: "Gestisci fornitori e partner esterni.",
        sub_name: "Nome Azienda *", 
        sub_email: "Email", 
        sub_phone: "Telefono", 
        sub_contact: "Persona di Contatto", 
        sub_address: "Indirizzo", 
        add_sub: "Aggiungi Partner", 
        no_subs: "Nessun partner aggiunto",
        delete_btn: "Elimina"
      }
    };
    return dict[language]?.[key] || key;
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{t('rubrica_title')}</h2>
          <p className="text-gray-600">{t('rubrica_desc')}</p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded mb-8">
          <h3 className="text-lg font-semibold mb-4">{t('add_sub')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder={t('sub_name')} 
              value={newSubName} 
              onChange={(e) => setNewSubName(e.target.value)} 
              className="col-span-2 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="off"
            />
            <input 
              type="email" 
              placeholder={t('sub_email')} 
              value={newSubEmail} 
              onChange={(e) => setNewSubEmail(e.target.value)} 
              className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="off"
            />
            <input 
              type="tel" 
              placeholder={t('sub_phone')} 
              value={newSubPhone} 
              onChange={(e) => setNewSubPhone(e.target.value)} 
              className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="off"
            />
            <input 
              type="text" 
              placeholder={t('sub_contact')} 
              value={newSubContact} 
              onChange={(e) => setNewSubContact(e.target.value)} 
              className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="off"
            />
            <input 
              type="text" 
              placeholder={t('sub_address')} 
              value={newSubAddress} 
              onChange={(e) => setNewSubAddress(e.target.value)} 
              className="col-span-2 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="off"
            />
          </div>
          <button 
            onClick={handleAddSub} 
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition-colors"
          >
            {t('add_sub')}
          </button>
        </div>

        {(companySettings?.subcontractors || []).length === 0 ? (
          <div className="text-center py-12 text-gray-500">{t('no_subs')}</div>
        ) : (
          <div className="space-y-4">
            {(companySettings?.subcontractors || []).map(sub => (
              <div key={sub.id} className="bg-white border rounded-lg p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <h4 className="text-lg font-bold">{sub.name}</h4>
                  {sub.contactPerson && <p className="text-sm text-gray-600">{sub.contactPerson}</p>}
                  {sub.email && <p className="text-sm text-gray-600">{sub.email}</p>}
                  {sub.phone && <p className="text-sm text-gray-600">{sub.phone}</p>}
                  {sub.address && <p className="text-sm text-gray-600">{sub.address}</p>}
                </div>
                <button 
                  onClick={() => handleDeleteSub(sub.id)} 
                  className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  {t('delete_btn')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
