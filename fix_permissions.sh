#!/bin/bash

# SUPER FIX SCRIPT PER CAMERA FIREFOX
# Eseguire con: sudo ./fix_permissions.sh

if [ "$EUID" -ne 0 ]; then
  echo "ERRORE: Esegui come root: sudo ./fix_permissions.sh"
  exit 1
fi

echo "--- 1. AGGIUNTA UTENTE AL GRUPPO VIDEO ---"
# Trova l'utente reale (non root)
REAL_USER=$(logname || echo $SUDO_USER)
if [ -z "$REAL_USER" ]; then
    echo "Impossibile determinare l'utente. Inserisci il nome utente (es. pi, fedora, admin):"
    read REAL_USER
fi

echo "Aggiungo l'utente $REAL_USER al gruppo video..."
usermod -aG video $REAL_USER
echo "Fatto."

echo "--- 2. CREAZIONE POLICY FIREFOX (MULTIPATH) ---"
# Firefox è stupido e cerca la policy in posti diversi a seconda della distro.
# Le scriviamo tutte.

DIRECTORIES=(
  "/etc/firefox/policies"
  "/usr/lib/firefox/distribution"
  "/usr/lib64/firefox/distribution"
  "/usr/share/firefox/distribution"
)

JSON_CONTENT='{
  "policies": {
    "Permissions": {
      "Camera": {
        "Allow": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "BlockNewRequests": false
      },
      "Microphone": {
        "Allow": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "BlockNewRequests": false
      }
    }
  }
}'

for DIR in "${DIRECTORIES[@]}"; do
  if [ -d "$(dirname "$DIR")" ]; then
      echo "Scrivendo policy in: $DIR"
      mkdir -p "$DIR"
      echo "$JSON_CONTENT" > "$DIR/policies.json"
      chmod 644 "$DIR/policies.json"
  fi
done

echo "--- 3. RESETTARE PERMESSI UTENTE ESISTENTI ---"
# Se Firefox ha già salvato "BLOCCA" per localhost, la policy potrebbe non sovrascriverlo.
# Cancelliamo il file permissions.sqlite dai profili dell'utente.

USER_HOME=$(eval echo ~$REAL_USER)
MOZILLA_DIR="$USER_HOME/.mozilla/firefox"

if [ -d "$MOZILLA_DIR" ]; then
    echo "Pulizia permessi salvati nei profili Firefox..."
    find "$MOZILLA_DIR" -name "permissions.sqlite" -delete
    find "$MOZILLA_DIR" -name "content-prefs.sqlite" -delete
    chown -R $REAL_USER:$REAL_USER "$MOZILLA_DIR"
fi

echo "--- 4. RICOSTRUZIONE APP ---"
cd "$(dirname "$0")"
# Ricompiliamo per assicurarci che App.tsx sia aggiornato
if [ -f "package.json" ]; then
    sudo -u $REAL_USER npm run build
fi

echo "--- COMPLETATO ---"
echo "Il sistema deve essere riavviato per applicare i permessi del gruppo 'video'."
echo "Riavvio tra 5 secondi..."
sleep 5
reboot
