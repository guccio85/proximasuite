#!/bin/bash

# Ottieni il percorso assoluto della cartella corrente
CURRENT_DIR="$(pwd)"
USER_APPS="$HOME/.local/share/applications"

echo "========================================"
echo "   CREAZIONE ICONA SNEP (FEDORA)        "
echo "========================================"

# Assicura che il launcher sia eseguibile
chmod +x "$CURRENT_DIR/launcher.sh"

# Crea il contenuto del file .desktop
# Terminal=true -> Fondamentale per vedere la finestra nera del server
DESKTOP_ENTRY="[Desktop Entry]
Version=1.0
Type=Application
Name=SNEP Werkbeheer
Comment=Gestionale SNEP
Exec=\"$CURRENT_DIR/launcher.sh\"
Icon=utilities-terminal
Path=$CURRENT_DIR
Terminal=true
StartupNotify=true
Categories=Office;Utility;"

# Crea la cartella applicazioni se non esiste
mkdir -p "$USER_APPS"

# Scrivi il file
echo "$DESKTOP_ENTRY" > "$USER_APPS/snep_werkbeheer.desktop"
chmod +x "$USER_APPS/snep_werkbeheer.desktop"

# Aggiorna il database delle applicazioni di Linux
update-desktop-database "$USER_APPS" 2>/dev/null

echo "✅ ICONA INSTALLATA NEL MENU APPLICAZIONI."
echo "-----------------------------------------------------"
echo "1. Premi il tasto WINDOWS (o Super) sulla tastiera."
echo "2. Scrivi 'SNEP'."
echo "3. Clicca sull'icona."
echo "-----------------------------------------------------"
