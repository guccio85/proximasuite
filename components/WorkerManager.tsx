
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, User, Lock, Mail, Phone, MapPin, Camera, FileText, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Language, WorkerPasswords, WorkerContact } from '../types';

interface WorkerManagerProps {
  workers: string[];
  workerPasswords?: WorkerPasswords;
  workerContacts?: Record<string, WorkerContact>;
  onAdd: (name: string, password?: string) => void;
  onUpdate: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
  onUpdatePassword?: (worker: string, pass: string) => void;
  onUpdateContacts?: (contacts: Record<string, WorkerContact>) => void;
  language?: Language;
}

export const WorkerManager: React.FC<WorkerManagerProps> = ({ 
    workers, workerPasswords = {}, workerContacts = {}, onAdd, onUpdate, onDelete, onUpdatePassword, onUpdateContacts, language = 'nl' 
}) => {
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPass, setNewWorkerPass] = useState('');
  const [editingWorker, setEditingWorker] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPass, setEditPass] = useState('');
  const [editContact, setEditContact] = useState<WorkerContact>({});
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
        nl: {
            title: "Personeelsrubrica",
            subtitle: "Beheer contactgegevens, foto's en inloggegevens van werknemers.",
            placeholder: "Naam nieuwe werknemer...",
            pass_placeholder: "Wachtwoord...",
            add: "Toevoegen",
            empty: "Nog geen werknemers toegevoegd.",
            password: "Wachtwoord",
            no_password: "Geen wachtwoord",
            email: "Email",
            phone: "Telefoon",
            address: "Adres",
            notes: "Notities",
            photo: "Foto",
            upload_photo: "Foto Uploaden",
            remove_photo: "Verwijderen",
            search: "Zoek werknemer...",
            contact_info: "Contactgegevens",
            save: "Opslaan",
            cancel: "Annuleren",
            edit: "Bewerken",
            delete_confirm: "Weet je het zeker?"
        },
        en: {
            title: "Staff Directory",
            subtitle: "Manage contact details, photos and login credentials.",
            placeholder: "New employee name...",
            pass_placeholder: "Password...",
            add: "Add",
            empty: "No employees added yet.",
            password: "Password",
            no_password: "No password",
            email: "Email",
            phone: "Phone",
            address: "Address",
            notes: "Notes",
            photo: "Photo",
            upload_photo: "Upload Photo",
            remove_photo: "Remove",
            search: "Search employee...",
            contact_info: "Contact Info",
            save: "Save",
            cancel: "Cancel",
            edit: "Edit",
            delete_confirm: "Are you sure?"
        },
        it: {
            title: "Rubrica Personale",
            subtitle: "Gestisci contatti, foto e credenziali dei dipendenti.",
            placeholder: "Nome nuovo dipendente...",
            pass_placeholder: "Password...",
            add: "Aggiungi",
            empty: "Nessun dipendente aggiunto.",
            password: "Password",
            no_password: "Nessuna password",
            email: "Email",
            phone: "Telefono",
            address: "Indirizzo",
            notes: "Note",
            photo: "Foto",
            upload_photo: "Carica Foto",
            remove_photo: "Rimuovi",
            search: "Cerca dipendente...",
            contact_info: "Info Contatto",
            save: "Salva",
            cancel: "Annulla",
            edit: "Modifica",
            delete_confirm: "Sei sicuro?"
        }
    };
    return dict[language]?.[key] || key;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkerName.trim()) {
      onAdd(newWorkerName.trim(), newWorkerPass.trim());
      setNewWorkerName('');
      setNewWorkerPass('');
    }
  };

  const startEdit = (worker: string) => {
    setEditingWorker(worker);
    setEditName(worker);
    setEditPass(workerPasswords[worker] || '');
    setEditContact(workerContacts[worker] || {});
    setExpandedWorker(worker);
  };

  const saveEdit = () => {
    if (editName.trim() && editingWorker) {
      if (editName !== editingWorker) {
        onUpdate(editingWorker, editName.trim());
      }
      if (onUpdatePassword) {
          onUpdatePassword(editName.trim(), editPass.trim());
      }
      if (onUpdateContacts) {
        const updated = { ...workerContacts };
        if (editName !== editingWorker) {
          delete updated[editingWorker];
        }
        updated[editName.trim()] = editContact;
        onUpdateContacts(updated);
      }
      setEditingWorker(null);
      setExpandedWorker(null);
    }
  };

  const cancelEdit = () => {
    setEditingWorker(null);
    setEditName('');
    setEditPass('');
    setEditContact({});
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 200;
          let w = img.width, h = img.height;
          if (w > h) { h = h * MAX / w; w = MAX; } else { w = w * MAX / h; h = MAX; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          setEditContact({ ...editContact, photo: canvas.toDataURL('image/jpeg', 0.8) });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (workerContacts[w]?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (workerContacts[w]?.phone || '').includes(searchQuery)
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">📇 {t('title')}</h2>
        <p className="text-gray-500">{t('subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Add Worker Form */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleAdd} className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                placeholder={t('placeholder')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="relative w-48">
              <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                value={newWorkerPass}
                onChange={(e) => setNewWorkerPass(e.target.value)}
                placeholder={t('pass_placeholder')}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!newWorkerName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={20} />
              {t('add')}
            </button>
          </form>

          {/* Search Bar */}
          {workers.length > 3 && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search')}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              />
            </div>
          )}
        </div>

        {/* Workers List */}
        <div className="divide-y divide-gray-100">
          {filteredWorkers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 italic">
              {workers.length === 0 ? t('empty') : (language === 'it' ? 'Nessun risultato' : language === 'en' ? 'No results' : 'Geen resultaten')}
            </div>
          ) : (
            filteredWorkers.map((worker) => {
              const contact = workerContacts[worker] || {};
              const isExpanded = expandedWorker === worker;
              const isEditing = editingWorker === worker;

              return (
                <div key={worker} className={`transition-all ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                  {/* Worker Card Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Photo / Avatar */}
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0 border-2 border-white shadow-sm">
                        {contact.photo ? (
                          <img src={contact.photo} alt={worker} className="w-full h-full object-cover" />
                        ) : (
                          worker.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-lg">{worker}</span>
                          {workerPasswords[worker] && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                              <Lock size={8} /> {t('password')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                          {contact.email && <span className="flex items-center gap-1"><Mail size={10} /> {contact.email}</span>}
                          {contact.phone && <span className="flex items-center gap-1"><Phone size={10} /> {contact.phone}</span>}
                          {contact.address && <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin size={10} /> {contact.address}</span>}
                          {!contact.email && !contact.phone && !contact.address && (
                            <span className="italic text-gray-400">{language === 'it' ? 'Nessun contatto' : language === 'en' ? 'No contact info' : 'Geen contactinfo'}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => {
                          if (isExpanded && !isEditing) {
                            setExpandedWorker(null);
                          } else if (!isExpanded) {
                            setExpandedWorker(worker);
                            setEditingWorker(null);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <button 
                        onClick={() => isEditing ? cancelEdit() : startEdit(worker)}
                        className={`p-2 rounded-lg transition-colors ${isEditing ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => { if(confirm(t('delete_confirm'))) onDelete(worker); }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Card - View Mode */}
                  {isExpanded && !isEditing && (
                    <div className="px-4 pb-4">
                      <div className="bg-white rounded-xl border border-gray-200 p-5 ml-[72px]">
                        <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <FileText size={14} /> {t('contact_info')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-start gap-3">
                            <Mail size={16} className="text-gray-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">{t('email')}</p>
                              <p className="text-gray-800">{contact.email || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone size={16} className="text-gray-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">{t('phone')}</p>
                              <p className="text-gray-800">{contact.phone || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">{t('address')}</p>
                              <p className="text-gray-800">{contact.address || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Lock size={16} className="text-gray-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">{t('password')}</p>
                              <p className="text-gray-800 font-mono">
                                {workerPasswords[worker] ? (
                                  <span 
                                    className="cursor-pointer hover:text-blue-600"
                                    onClick={() => setShowPasswordFor(showPasswordFor === worker ? null : worker)}
                                  >
                                    {showPasswordFor === worker ? workerPasswords[worker] : '••••••'}
                                  </span>
                                ) : <span className="text-gray-400 italic">{t('no_password')}</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                        {contact.notes && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">{t('notes')}</p>
                            <p className="text-sm text-gray-700">{contact.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expanded Card - Edit Mode */}
                  {isExpanded && isEditing && (
                    <div className="px-4 pb-4">
                      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 ml-[72px] space-y-4">

                        {/* Photo Upload */}
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0 border-2 border-white shadow">
                            {editContact.photo ? (
                              <img src={editContact.photo} alt="photo" className="w-full h-full object-cover" />
                            ) : (
                              <Camera size={24} className="text-gray-400" />
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <input type="file" ref={photoInputRef} accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            <button onClick={() => photoInputRef.current?.click()} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-1">
                              <Camera size={12} /> {t('upload_photo')}
                            </button>
                            {editContact.photo && (
                              <button onClick={() => setEditContact({...editContact, photo: undefined})} className="text-xs text-red-500 hover:text-red-700 font-bold">
                                {t('remove_photo')}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Name & Password Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1 flex items-center gap-1"><User size={10} /> {language === 'it' ? 'Nome' : language === 'en' ? 'Name' : 'Naam'}</label>
                            <input
                              type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1 flex items-center gap-1"><Lock size={10} /> {t('password')}</label>
                            <input
                              type="text" value={editPass} onChange={(e) => setEditPass(e.target.value)} placeholder={t('pass_placeholder')}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                            />
                          </div>
                        </div>

                        {/* Contact Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1 flex items-center gap-1"><Mail size={10} /> {t('email')}</label>
                            <input
                              type="email" value={editContact.email || ''} onChange={(e) => setEditContact({...editContact, email: e.target.value})}
                              placeholder="email@example.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1 flex items-center gap-1"><Phone size={10} /> {t('phone')}</label>
                            <input
                              type="tel" value={editContact.phone || ''} onChange={(e) => setEditContact({...editContact, phone: e.target.value})}
                              placeholder="+31 6 12345678"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-600 uppercase mb-1 flex items-center gap-1"><MapPin size={10} /> {t('address')}</label>
                          <input
                            type="text" value={editContact.address || ''} onChange={(e) => setEditContact({...editContact, address: e.target.value})}
                            placeholder={language === 'it' ? 'Via Roma 1, Milano' : 'Straatnaam 1, Stad'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-600 uppercase mb-1 flex items-center gap-1"><FileText size={10} /> {t('notes')}</label>
                          <textarea
                            value={editContact.notes || ''} onChange={(e) => setEditContact({...editContact, notes: e.target.value})}
                            rows={2}
                            placeholder={language === 'it' ? 'Note aggiuntive...' : language === 'en' ? 'Additional notes...' : 'Extra notities...'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                          />
                        </div>

                        {/* Save / Cancel */}
                        <div className="flex justify-end gap-2 pt-2">
                          <button onClick={cancelEdit} className="px-4 py-2 text-gray-600 font-bold text-sm hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1">
                            <X size={14} /> {t('cancel')}
                          </button>
                          <button onClick={saveEdit} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm">
                            <Check size={14} /> {t('save')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
