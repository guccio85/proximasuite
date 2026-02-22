#!/bin/bash

# Questo script configura Firefox per consentire SEMPRE l'accesso alla fotocamera 
# per http://localhost:3000 senza mostrare popup.
# Deve essere eseguito con sudo.

if [ "$EUID" -ne 0 ]; then
  echo "ERRORE: Devi eseguire questo script come root."
  echo "Usa il comando: sudo ./setup_camera_policy.sh"
  exit 1
fi

echo "--- Configurazione Permessi Fotocamera Firefox (System Wide) ---"

# Cartella delle policy di sistema di Firefox
# Su Fedora standard è /etc/firefox/policies
POLICY_DIR="/etc/firefox/policies"

if [ ! -d "$POLICY_DIR" ]; then
    echo "Creazione cartella policy in $POLICY_DIR..."
    mkdir -p "$POLICY_DIR"
fi

POLICY_FILE="$POLICY_DIR/policies.json"

echo "Scrittura file policy in $POLICY_FILE..."

# Scriviamo il file JSON che autorizza localhost
cat > "$POLICY_FILE" <<EOF
{
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
}
EOF

# Imposta permessi di lettura per tutti
chmod 644 "$POLICY_FILE"

echo "Fatto. La policy è stata applicata."
echo "Al prossimo avvio di Firefox, la camera sarà autorizzata automaticamente."
