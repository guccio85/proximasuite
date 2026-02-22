#!/bin/bash
# Questo script ripara i permessi dei file se sono diventati di proprietà di "root"
# Eseguilo se il launcher ti dà errori di "Permission denied" o "npm ERR!"

echo "--- RIPARAZIONE PERMESSI SNEP ---"
echo "Sto reimpostando il proprietario di tutti i file al tuo utente corrente."
echo "Ti verrà chiesta la password (quella che usi per il login)."
echo ""

CURRENT_USER=$(whoami)
DIR=$(pwd)

echo "Utente: $CURRENT_USER"
echo "Cartella: $DIR"
echo ""
echo "Esecuzione comando 'sudo chown'..."

# Cambia proprietario di tutto nella cartella corrente
sudo chown -R $CURRENT_USER:$CURRENT_USER "$DIR"

# Rimuove cache npm che spesso si corrompe con sudo
rm -rf "$HOME/.npm/_cacache"

echo ""
echo "✅ Fatto! I file ora sono tuoi."
echo "Ora puoi eseguire ./install_icon.sh senza errori."
echo ""
read -p "Premi INVIO per uscire..." 2>/dev/null || true
