// ============================================================
// i18n/index.ts — White-Label Foundation (v2.4.0)
// ============================================================
// Central translation dictionaries for Sidebar and SettingsView.
// Each component imports its own dict and the createTranslator helper.
// The JSX of each component is left completely unchanged.
//
// To add a new language: add a new key (e.g. 'de') to each dict.
// To migrate more components: add their dict here and follow the same pattern.
// ============================================================

import { Language } from '../types';

// ------------------------------------------------------------------
// Generic helper — creates a t(key) function bound to a dict + lang
// ------------------------------------------------------------------
export function createTranslator(
  dict: Record<string, Record<string, string>>,
  lang: Language
): (key: string) => string {
  return (key: string) => dict[lang]?.[key] ?? key;
}

// ------------------------------------------------------------------
// SIDEBAR dictionary  (migrated from Sidebar.tsx)
// ------------------------------------------------------------------
export const SIDEBAR_DICT: Record<string, Record<string, string>> = {
  nl: {
    order_planning: 'Order Planning',
    team_schedule: 'Team Rooster',
    employees: 'Personeel Lijst',
    rubrica_ditte: 'Rubrica Ditte',
    archive: 'Order Archief',
    statistics: 'Uren Statistieken',
    costs: 'Kosten Beheer',
    settings: 'Instellingen & Backup',
    new_order: 'NIEUWE ORDER',
    scan_mobile: 'Scan voor Mobiel',
    language: 'Taal Selecteren',
    powered_by: 'Powered by',
    wifi_warn: 'Zorg dat mobiel op WiFi zit!',
    select_theme: 'Thema Selecteren',
    theme_gold: 'Goud',
    theme_space: 'Space Blue',
    theme_space_light: 'Space Blue Light',
    version_label: 'Versie',
  },
  en: {
    order_planning: 'Order Planning',
    team_schedule: 'Team Schedule',
    employees: 'Staff List',
    rubrica_ditte: 'Contractor Directory',
    archive: 'Order Archive',
    statistics: 'Statistics',
    costs: 'Cost Management',
    settings: 'Settings & Backup',
    new_order: 'NEW ORDER',
    scan_mobile: 'Scan Mobile',
    language: 'Language',
    powered_by: 'Powered by',
    wifi_warn: 'Ensure mobile is on WiFi!',
    select_theme: 'Select Theme',
    theme_gold: 'Gold',
    theme_space: 'Space Blue',
    theme_space_light: 'Space Blue Light',
    version_label: 'Version',
  },
  it: {
    order_planning: 'Piano Ordini',
    team_schedule: 'Orari Team',
    employees: 'Lista Personale',
    rubrica_ditte: 'Rubrica Ditte',
    archive: 'Archivio Ordini',
    statistics: 'Statistiche',
    costs: 'Gestione Costi',
    settings: 'Impostazioni & Backup',
    new_order: 'NUOVO ORDINE',
    scan_mobile: 'Mobile QR',
    language: 'Lingua',
    powered_by: 'Sviluppato da',
    wifi_warn: 'Assicurati di essere in WiFi!',
    select_theme: 'Seleziona Tema',
    theme_gold: 'Oro',
    theme_space: 'Blu Spaziale',
    theme_space_light: 'Blu Spaziale Chiaro',
    version_label: 'Versione',
  },
  pl: {
    order_planning: 'Planowanie Zleceń',
    team_schedule: 'Harmonogram Zespołu',
    employees: 'Lista Pracowników',
    rubrica_ditte: 'Katalog Firm',
    archive: 'Archiwum Zleceń',
    statistics: 'Statystyki',
    costs: 'Zarządzanie Kosztami',
    settings: 'Ustawienia & Backup',
    new_order: 'NOWE ZLECENIE',
    scan_mobile: 'Skanuj Mobilnie',
    language: 'Język',
    powered_by: 'Zasilane przez',
    wifi_warn: 'Upewnij się, że jesteś na WiFi!',
    select_theme: 'Wybierz Motyw',
    theme_gold: 'Złoty',
    theme_space: 'Space Blue',
    theme_space_light: 'Space Blue Light',
    version_label: 'Wersja',
  },
};

// ------------------------------------------------------------------
// SETTINGS VIEW dictionary  (migrated from SettingsView.tsx)
// Note: SettingsView currently supports NL / EN / IT only.
// ------------------------------------------------------------------
export const SETTINGS_DICT: Record<string, Record<string, string>> = {
  nl: {
    general: 'Algemeen', security: 'Team Beheer', customization: 'Kleuren & Taken', production: 'Productie', partners: 'Partners', workflow: 'Werkstroom', mobile: 'Mobiel Admin',
    title: 'Instellingen', subtitle: 'Configuratie Paneel', language: 'Taal / Language', company_data: 'Bedrijfsgegevens', edit_data: 'Wijzig Gegevens',
    company_name: 'Bedrijfsnaam', logo: 'Logo', save_company: 'Gegevens Opslaan', cancel: 'Annuleren', unlock_msg: 'Voer wachtwoord in om bedrijfsgegevens te wijzigen.',
    reset_db_btn: 'RESET TOTALE DATABASE', add_admin: 'Beheerder Toevoegen', admin_name: 'Naam', admin_pass: 'Wachtwoord',
    subcontractors_title: 'Onderaannemers', subcontractors_desc: 'Beheer externe partijen waaraan werk wordt uitbesteed.', add_sub: 'Partner Toevoegen',
    backup_title: 'Handmatige Backup', backup_desc: 'Maak een veilige kopie van het systeem om gegevensverlies te voorkomen.', backup_btn: 'DOWNLOAD BACKUP NU', restore_btn: 'HERSTEL BACKUP',
    wizard_btn: 'Setup Wizard Herstarten', wizard_desc: 'Herconfigureer bedrijfsnaam, logo en admin pass.',
    del_completed: 'Verwijder Voltooide Orders', del_completed_desc: "Verwijdert alle orders met status 'Voltooid' om de lijst schoon te houden.", delete_dept_confirm: 'Weet je zeker dat je deze afdeling wilt verwijderen?',
    color_kbw: 'KBW Kleur', color_plw: 'PLW Kleur', color_mon: 'Montage Kleur', color_wvb: 'WVB Kleur', color_hol: 'Feestdag Kleur', color_adv: 'ADV Kleur',
    admin_settings: 'Beheerder Wachtwoord', admin_settings_desc: 'Dit wachtwoord is vereist om kritieke wijzigingen op te slaan.',
    dept_title: 'Afdelingen & Activiteiten', dept_desc: 'Beheer de categorieën for urenregistratie.', acts_placeholder: 'Zagen, Lassen, ...', add_dept: 'Afdeling Toevoegen',
    mob_perm_title: 'Mobiele Beperkingen', mob_perm_desc: 'Bepaal wat werknemers zien op hun telefoon.', perm_client: 'Toon Klantnaam', perm_address: 'Toon Adres', perm_photo: 'Foto Upload Toestaan', perm_draw: 'Tekeningen Inzien', no_workers: 'Geen werknemers geconfigureerd',
    theme_title: 'Applicatie Thema', theme_gold: 'Goud', theme_space: 'Space Blue', theme_space_light: 'Space Blue Light',
    sub_name: 'Bedrijfsnaam *', sub_email: 'Email', sub_phone: 'Telefoon', sub_contact: 'Contactpersoon', sub_address: 'Adres', no_subs: 'Geen bedrijven toegevoegd',
    critical_actions: 'Kritieke Acties', delete_btn: 'Verwijderen',
    edit_admin: 'Bewerken', save_admin: 'Opslaan', cancel_edit: 'Annuleren', role: 'Rol', permissions: 'Rechten',
    perm_viewPlanner: 'Planner Bekijken', perm_editPlanner: 'Planner Bewerken', perm_viewOrders: 'Orders Bekijken', perm_editOrders: 'Orders Bewerken',
    perm_viewEmployees: 'Personeel Bekijken', perm_editEmployees: 'Personeel Bewerken', perm_viewStatistics: 'Statistieken', perm_viewSettings: 'Instellingen Bekijken',
    perm_editSettings: 'Instellingen Bewerken', perm_manageBackup: 'Backup Beheer', perm_deleteOrders: 'Orders Verwijderen', perm_viewCosts: 'Kosten Bekijken',
    role_admin: 'Beheerder', role_manager: 'Manager', role_viewer: 'Kijker',
  },
  en: {
    general: 'General', security: 'Team Admin', customization: 'Colors & Tasks', production: 'Production', partners: 'Partners', workflow: 'Workflow', mobile: 'Mobile Admin',
    title: 'Settings', subtitle: 'Control Panel', language: 'Language', company_data: 'Company Details', edit_data: 'Edit Data',
    company_name: 'Company Name', logo: 'Logo', save_company: 'Save Data', cancel: 'Cancel', unlock_msg: 'Enter password to edit company details.',
    reset_db_btn: 'RESET DATABASE', add_admin: 'Add Admin', admin_name: 'Name', admin_pass: 'Password',
    subcontractors_title: 'Subcontractors', subcontractors_desc: 'Manage external partners.', add_sub: 'Add Partner',
    backup_title: 'Manual Backup', backup_desc: 'Save a backup copy to prevent data loss.', backup_btn: 'DOWNLOAD BACKUP', restore_btn: 'RESTORE BACKUP',
    wizard_btn: 'Restart Setup Wizard', wizard_desc: 'Reconfigure company details and admin pass.',
    del_completed: 'Clear Completed Orders', del_completed_desc: "Removes all orders with 'Completed' status.", delete_dept_confirm: 'Are you sure you want to delete this department?',
    color_kbw: 'KBW Color', color_plw: 'PLW Color', color_mon: 'Montage Color', color_wvb: 'WVB Color', color_hol: 'Holiday Color', color_adv: 'ADV Color',
    admin_settings: 'Admin Password', admin_settings_desc: 'Password required for critical changes.',
    dept_title: 'Departments & Activities', dept_desc: 'Manage categories for time tracking.', acts_placeholder: 'Sawing, Welding...', add_dept: 'Add Department',
    mob_perm_title: 'Mobile Restrictions', mob_perm_desc: 'Control what workers see.', perm_client: 'Show Client', perm_address: 'Show Address', perm_photo: 'Allow Photo Upload', perm_draw: 'View Drawings', no_workers: 'No workers configured',
    theme_title: 'App Theme', theme_gold: 'Gold', theme_space: 'Space Blue', theme_space_light: 'Space Blue Light',
    sub_name: 'Company Name *', sub_email: 'Email', sub_phone: 'Phone', sub_contact: 'Contact Person', sub_address: 'Address', no_subs: 'No companies added',
    critical_actions: 'Critical Actions', delete_btn: 'Delete',
    edit_admin: 'Edit', save_admin: 'Save', cancel_edit: 'Cancel', role: 'Role', permissions: 'Permissions',
    perm_viewPlanner: 'View Planner', perm_editPlanner: 'Edit Planner', perm_viewOrders: 'View Orders', perm_editOrders: 'Edit Orders',
    perm_viewEmployees: 'View Staff', perm_editEmployees: 'Edit Staff', perm_viewStatistics: 'Statistics', perm_viewSettings: 'View Settings',
    perm_editSettings: 'Edit Settings', perm_manageBackup: 'Backup Management', perm_deleteOrders: 'Delete Orders', perm_viewCosts: 'View Costs',
    role_admin: 'Administrator', role_manager: 'Manager', role_viewer: 'Viewer',
  },
  it: {
    general: 'Generale', security: 'Gestione Team', customization: 'Colori & Task', production: 'Produzione', partners: 'Partner', workflow: 'Workflow', mobile: 'Admin Mobile',
    title: 'Impostazioni', subtitle: 'Pannello di Controllo', language: 'Lingua', company_data: 'Dati Aziendali', edit_data: 'Modifica Dati',
    company_name: 'Nome Azienda', logo: 'Logo', save_company: 'Salva Dati', cancel: 'Annulla', unlock_msg: 'Inserisci password per modificare i dati.',
    reset_db_btn: 'RESET DATABASE', add_admin: 'Aggiungi Admin', admin_name: 'Nome', admin_pass: 'Password',
    subcontractors_title: 'Subappaltatori', subcontractors_desc: 'Gestisci i partner esterni.', add_sub: 'Aggiungi Partner',
    backup_title: 'Backup Manuale', backup_desc: 'Crea una copia di sicurezza per evitare perdite.', backup_btn: 'SCARICA BACKUP', restore_btn: 'RIPRISTINA BACKUP',
    wizard_btn: 'Riavvia Setup Wizard', wizard_desc: 'Riconfigura nome, logo e password admin.',
    del_completed: 'Pulisci Ordini Completati', del_completed_desc: "Rimuove gli ordini con stato 'Completato'.", delete_dept_confirm: 'Sei sicuro di voler eliminare questo reparto?',
    color_kbw: 'Colore KBW', color_plw: 'Colore PLW', color_mon: 'Colore Montaggio', color_wvb: 'Colore WVB', color_hol: 'Colore Festivi', color_adv: 'Colore ADV',
    admin_settings: 'Password Amministratore', admin_settings_desc: 'Password richiesta per modifiche critiche.',
    dept_title: 'Reparti & Attività', dept_desc: 'Gestisci le categorie per le ore.', acts_placeholder: 'Taglio, Saldatura...', add_dept: 'Aggiungi Reparto',
    mob_perm_title: 'Restrizioni Mobile', mob_perm_desc: 'Controlla cosa vedono i dipendenti.', perm_client: 'Mostra Cliente', perm_address: 'Mostra Indirizzo', perm_photo: 'Permetti Foto', perm_draw: 'Vedi Disegni', no_workers: 'Nessun dipendente configurato',
    theme_title: 'Tema Applicazione', theme_gold: 'Oro', theme_space: 'Blu Spaziale', theme_space_light: 'Blu Spaziale Chiaro',
    sub_name: 'Nome Azienda *', sub_email: 'Email', sub_phone: 'Telefono', sub_contact: 'Persona Contatto', sub_address: 'Indirizzo', no_subs: 'Nessun partner aggiunto',
    critical_actions: 'Azioni Critiche', delete_btn: 'Elimina',
    edit_admin: 'Modifica', save_admin: 'Salva', cancel_edit: 'Annulla', role: 'Ruolo', permissions: 'Permessi',
    perm_viewPlanner: 'Visualizza Planner', perm_editPlanner: 'Modifica Planner', perm_viewOrders: 'Visualizza Ordini', perm_editOrders: 'Modifica Ordini',
    perm_viewEmployees: 'Visualizza Personale', perm_editEmployees: 'Modifica Personale', perm_viewStatistics: 'Statistiche', perm_viewSettings: 'Visualizza Impostazioni',
    perm_editSettings: 'Modifica Impostazioni', perm_manageBackup: 'Gestione Backup', perm_deleteOrders: 'Elimina Ordini', perm_viewCosts: 'Visualizza Costi',
    role_admin: 'Amministratore', role_manager: 'Manager', role_viewer: 'Visualizzatore',
  },
};
