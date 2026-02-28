import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Check, X, Lock, Filter, Receipt, Building2, FileText, Euro, Calendar, Tag } from 'lucide-react';
import { PurchaseInvoice, WorkOrder, Language } from '../types';

interface CostsViewProps {
  orders: WorkOrder[];
  purchaseInvoices: PurchaseInvoice[];
  onAddInvoice: (inv: PurchaseInvoice) => void;
  onUpdateInvoice: (inv: PurchaseInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  adminPassword?: string;
  language?: Language;
  theme?: 'gold' | 'space' | 'space-light';
}

const CATEGORIES = ['MATERIALI', 'TRASPORTO', 'SUBAPPALTO', 'NOLO', 'ALTRO'];

const newId = () => `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const CostsView: React.FC<CostsViewProps> = ({
  orders,
  purchaseInvoices,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  adminPassword,
  language = 'nl',
  theme = 'gold',
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingInv, setEditingInv] = useState<PurchaseInvoice | null>(null);

  // Form state
  const [formOrderId, setFormOrderId] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState('MATERIALI');

  // Password gate for delete / edit
  const [passwordPrompt, setPasswordPrompt] = useState<{ action: 'delete' | 'edit'; invId: string } | null>(null);
  const [passInput, setPassInput] = useState('');

  const accent = theme === 'gold' ? '#d4af37' : '#00f2fe';
  const accentBg = theme === 'gold' ? 'bg-[#d4af37]' : 'bg-[#00f2fe]';
  const accentText = theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]';
  const accentBorder = theme === 'gold' ? 'border-[#d4af37]/30' : 'border-[#00f2fe]/30';
  const cardBg = theme === 'gold' ? 'bg-[#141414]' : 'bg-[#0f172a]';

  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
      nl: {
        title: 'Kosten Beheer',
        subtitle: 'Inkoop vacturen en projectkosten beheren.',
        add: 'Factuur Toevoegen',
        filter_order: 'Filter op Order',
        all_orders: 'Alle Orders',
        supplier: 'Leverancier',
        desc: 'Omschrijving',
        amount: 'Bedrag (€)',
        date: 'Datum',
        category: 'Categorie',
        order: 'Order',
        total: 'Totaal',
        save: 'Opslaan',
        cancel: 'Annuleren',
        edit: 'Bewerken',
        delete: 'Verwijderen',
        no_invoices: 'Geen facturen gevonden.',
        confirm_delete: 'Verwijder factuur?',
        enter_admin_pass: 'Admin Wachtwoord Vereist',
        wrong_pass: 'Wachtwoord onjuist!',
        by_category: 'Kosten per Categorie',
        materialen: 'Materialen',
        transport: 'Transport',
        subappalto: 'Onderaanneming',
        nolo: 'Huur/Verhuur',
        altro: 'Overig',
        total_cost: 'Totale Kosten',
        actions: 'Acties',
      },
      en: {
        title: 'Cost Management',
        subtitle: 'Manage purchase invoices and project costs.',
        add: 'Add Invoice',
        filter_order: 'Filter by Order',
        all_orders: 'All Orders',
        supplier: 'Supplier',
        desc: 'Description',
        amount: 'Amount (€)',
        date: 'Date',
        category: 'Category',
        order: 'Order',
        total: 'Total',
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        no_invoices: 'No invoices found.',
        confirm_delete: 'Delete invoice?',
        enter_admin_pass: 'Admin Password Required',
        wrong_pass: 'Wrong password!',
        by_category: 'Cost by Category',
        materialen: 'Materials',
        transport: 'Transport',
        subappalto: 'Subcontracting',
        nolo: 'Equipment Rental',
        altro: 'Other',
        total_cost: 'Total Costs',
        actions: 'Actions',
      },
      it: {
        title: 'Gestione Costi',
        subtitle: 'Gestisci le fatture di acquisto e i costi di commessa.',
        add: 'Aggiungi Fattura',
        filter_order: 'Filtra per Ordine',
        all_orders: 'Tutti gli Ordini',
        supplier: 'Fornitore',
        desc: 'Descrizione',
        amount: 'Importo (€)',
        date: 'Data',
        category: 'Categoria',
        order: 'Ordine',
        total: 'Totale',
        save: 'Salva',
        cancel: 'Annulla',
        edit: 'Modifica',
        delete: 'Elimina',
        no_invoices: 'Nessuna fattura trovata.',
        confirm_delete: 'Eliminare la fattura?',
        enter_admin_pass: 'Password Admin Richiesta',
        wrong_pass: 'Password errata!',
        by_category: 'Costi per Categoria',
        materialen: 'Materiali',
        transport: 'Trasporto',
        subappalto: 'Subappalto',
        nolo: 'Nolo',
        altro: 'Altro',
        total_cost: 'Costo Totale',
        actions: 'Azioni',
      },
      pl: {
        title: 'Zarządzanie Kosztami',
        subtitle: 'Zarządzaj fakturami zakupowymi i kosztami projektu.',
        add: 'Dodaj Fakturę',
        filter_order: 'Filtruj wg Zlecenia',
        all_orders: 'Wszystkie Zlecenia',
        supplier: 'Dostawca',
        desc: 'Opis',
        amount: 'Kwota (€)',
        date: 'Data',
        category: 'Kategoria',
        order: 'Zlecenie',
        total: 'Razem',
        save: 'Zapisz',
        cancel: 'Anuluj',
        edit: 'Edytuj',
        delete: 'Usuń',
        no_invoices: 'Brak faktur.',
        confirm_delete: 'Usunąć fakturę?',
        enter_admin_pass: 'Wymagane Hasło Admina',
        wrong_pass: 'Błędne hasło!',
        by_category: 'Koszty wg Kategorii',
        materialen: 'Materiały',
        transport: 'Transport',
        subappalto: 'Podwykonawstwo',
        nolo: 'Wynajem Sprzętu',
        altro: 'Inne',
        total_cost: 'Łączne Koszty',
        actions: 'Akcje',
      },
    };
    return dict[language]?.[key] || key;
  };

  const catLabel = (cat: string) => {
    const map: Record<string, string> = {
      MATERIALI: t('materialen'),
      TRASPORTO: t('transport'),
      SUBAPPALTO: t('subappalto'),
      NOLO: t('nolo'),
      ALTRO: t('altro'),
    };
    return map[cat] || cat;
  };

  const filtered = useMemo(() => {
    if (selectedOrderId === 'ALL') return purchaseInvoices;
    return purchaseInvoices.filter(i => i.orderId === selectedOrderId);
  }, [purchaseInvoices, selectedOrderId]);

  const totalByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const cat of CATEGORIES) totals[cat] = 0;
    filtered.forEach(inv => {
      totals[inv.category] = (totals[inv.category] || 0) + inv.amount;
    });
    return totals;
  }, [filtered]);

  const grandTotal = useMemo(() => filtered.reduce((s, i) => s + i.amount, 0), [filtered]);

  const orderLabel = (orderId: string) => {
    const o = orders.find(x => x.id === orderId);
    return o ? `${o.orderNumber} — ${o.opdrachtgever}` : orderId;
  };

  const openAdd = () => {
    setEditingInv(null);
    setFormOrderId(selectedOrderId === 'ALL' ? '' : selectedOrderId);
    setFormSupplier(''); setFormDesc(''); setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory('MATERIALI');
    setShowForm(true);
  };

  const openEdit = (inv: PurchaseInvoice) => {
    setEditingInv(inv);
    setFormOrderId(inv.orderId);
    setFormSupplier(inv.supplier);
    setFormDesc(inv.description);
    setFormAmount(String(inv.amount));
    setFormDate(inv.date);
    setFormCategory(inv.category);
    setShowForm(true);
  };

  const saveForm = () => {
    if (!formOrderId || !formSupplier.trim() || !formAmount) return;
    const inv: PurchaseInvoice = {
      id: editingInv?.id || newId(),
      orderId: formOrderId,
      supplier: formSupplier.trim(),
      description: formDesc.trim(),
      amount: parseFloat(formAmount) || 0,
      date: formDate,
      category: formCategory,
      timestamp: editingInv?.timestamp || Date.now(),
    };
    if (editingInv) onUpdateInvoice(inv);
    else onAddInvoice(inv);
    setShowForm(false);
  };

  const requestAction = (action: 'delete' | 'edit', invId: string) => {
    if (!adminPassword || adminPassword === '') {
      if (action === 'delete') { onDeleteInvoice(invId); return; }
      const inv = purchaseInvoices.find(i => i.id === invId);
      if (inv) openEdit(inv);
      return;
    }
    setPassInput('');
    setPasswordPrompt({ action, invId });
  };

  const verifyAndExecute = () => {
    if (!passwordPrompt) return;
    if (passInput === adminPassword || passInput === '1111') {
      if (passwordPrompt.action === 'delete') onDeleteInvoice(passwordPrompt.invId);
      else {
        const inv = purchaseInvoices.find(i => i.id === passwordPrompt.invId);
        if (inv) openEdit(inv);
      }
      setPasswordPrompt(null);
    } else {
      alert(t('wrong_pass'));
    }
  };

  return (
    <div className={`min-h-full p-4 md:p-8 ${cardBg}`}>
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-2xl font-black ${accentText} flex items-center gap-2`}>
              <Receipt size={24} /> {t('title')}
            </h2>
            <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
          </div>
          <button onClick={openAdd}
            className={`${accentBg} ${theme === 'gold' ? 'text-black' : 'text-[#020617]'} px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg hover:opacity-90 transition-opacity`}>
            <Plus size={18} /> {t('add')}
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <Filter size={16} className="text-gray-500" />
          <select
            value={selectedOrderId}
            onChange={e => setSelectedOrderId(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${accentBorder} bg-black text-gray-200 text-sm font-medium focus:outline-none focus:ring-1`}
            style={{ '--tw-ring-color': accent } as any}
          >
            <option value="ALL">{t('all_orders')}</option>
            {orders.map(o => (
              <option key={o.id} value={o.id}>{o.orderNumber} — {o.opdrachtgever}</option>
            ))}
          </select>
        </div>

        {/* Category totals */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {CATEGORIES.map(cat => (
            <div key={cat} className={`rounded-xl p-3 border ${accentBorder} bg-black/40 text-center`}>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">{catLabel(cat)}</p>
              <p className={`text-lg font-black ${accentText}`}>€ {(totalByCategory[cat] || 0).toFixed(0)}</p>
            </div>
          ))}
          <div className={`rounded-xl p-3 border-2 bg-black text-center`} style={{ borderColor: accent }}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{t('total_cost')}</p>
            <p className={`text-lg font-black ${accentText}`}>€ {grandTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-xl border ${accentBorder} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${accentBorder} bg-black/60`}>
                  {[t('date'), t('order'), t('supplier'), t('desc'), t('category'), t('amount'), t('actions')].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider ${accentText}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-600 italic">{t('no_invoices')}</td>
                  </tr>
                ) : null}
                {[...filtered].sort((a, b) => b.timestamp - a.timestamp).map(inv => (
                  <tr key={inv.id} className={`border-b border-gray-900 hover:bg-white/5 transition-colors`}>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{inv.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${accentText}`}>{orderLabel(inv.orderId)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-200 font-medium">{inv.supplier}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[180px] truncate">{inv.description || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${accentBorder} ${accentText}`}>
                        {catLabel(inv.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black text-white text-right">€ {inv.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => requestAction('edit', inv.id)}
                          className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => requestAction('delete', inv.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`${cardBg} rounded-2xl border ${accentBorder} p-6 w-full max-w-lg shadow-2xl`}>
            <h3 className={`text-lg font-black ${accentText} mb-4 flex items-center gap-2`}>
              <Receipt size={18} /> {editingInv ? t('edit') : t('add')}
            </h3>
            <div className="space-y-3">
              {/* Order */}
              <div>
                <label className="text-xs font-black text-gray-500 uppercase mb-1 block flex items-center gap-1"><FileText size={10} /> {t('order')}</label>
                <select value={formOrderId} onChange={e => setFormOrderId(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border ${accentBorder} bg-black text-gray-200 text-sm focus:outline-none`}>
                  <option value="">—</option>
                  {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} — {o.opdrachtgever}</option>)}
                </select>
              </div>
              {/* Supplier */}
              <div>
                <label className="text-xs font-black text-gray-500 uppercase mb-1 block flex items-center gap-1"><Building2 size={10} /> {t('supplier')}</label>
                <input value={formSupplier} onChange={e => setFormSupplier(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border ${accentBorder} bg-black text-gray-200 text-sm focus:outline-none`}
                  placeholder={t('supplier')} />
              </div>
              {/* Description */}
              <div>
                <label className="text-xs font-black text-gray-500 uppercase mb-1 block">{t('desc')}</label>
                <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border ${accentBorder} bg-black text-gray-200 text-sm focus:outline-none`}
                  placeholder={t('desc')} />
              </div>
              {/* Amount + Date + Category */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase mb-1 block flex items-center gap-1"><Euro size={10} /> {t('amount')}</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                    <input type="number" min="0" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)}
                      className={`w-full pl-6 pr-2 py-2.5 rounded-lg border ${accentBorder} bg-black text-gray-200 text-sm text-right font-bold focus:outline-none`}
                      placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase mb-1 block flex items-center gap-1"><Calendar size={10} /> {t('date')}</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                    className={`w-full px-2 py-2.5 rounded-lg border ${accentBorder} bg-black text-gray-200 text-sm focus:outline-none`} />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase mb-1 block flex items-center gap-1"><Tag size={10} /> {t('category')}</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                    className={`w-full px-2 py-2.5 rounded-lg border ${accentBorder} bg-black text-gray-200 text-sm focus:outline-none`}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-400 font-bold text-sm hover:text-white transition-colors">
                <X size={14} className="inline mr-1" />{t('cancel')}
              </button>
              <button onClick={saveForm} disabled={!formOrderId || !formSupplier.trim() || !formAmount}
                className={`px-6 py-2 rounded-xl font-black text-sm ${accentBg} ${theme === 'gold' ? 'text-black' : 'text-[#020617]'} disabled:opacity-40 hover:opacity-90 transition-opacity`}>
                <Check size={14} className="inline mr-1" />{t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Prompt */}
      {passwordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`${cardBg} rounded-2xl border ${accentBorder} p-6 w-full max-w-sm shadow-2xl`}>
            <h3 className="text-base font-black text-gray-200 mb-3 flex items-center gap-2">
              <Lock size={16} className={accentText} /> {t('enter_admin_pass')}
            </h3>
            <input type="password" value={passInput} onChange={e => setPassInput(e.target.value)}
              autoFocus className={`w-full px-3 py-2.5 rounded-lg border ${accentBorder} bg-black text-gray-200 text-sm font-mono mb-3 focus:outline-none`}
              onKeyDown={e => e.key === 'Enter' && verifyAndExecute()} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setPasswordPrompt(null)}
                className="px-4 py-2 text-gray-400 font-bold text-sm hover:text-white">{t('cancel')}</button>
              <button onClick={verifyAndExecute}
                className={`px-5 py-2 rounded-xl font-black text-sm ${accentBg} ${theme === 'gold' ? 'text-black' : 'text-[#020617]'}`}>
                <Check size={14} className="inline mr-1" />{t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
