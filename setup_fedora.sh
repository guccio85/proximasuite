#!/bin/bash

# Ferma se errore
set -e

echo "=========================================="
echo "   INSTALLAZIONE SNEP (FEDORA)"
echo "=========================================="

# 0. Fix fine riga Windows (CRLF) per tutti gli script .sh
# Questo risolve errori strani tipo "command not found" su file esistenti
echo "[0/5] Correzione formati file..."
sed -i 's/\r$//' *.sh 2>/dev/null || true

# 1. Verifica Node
if ! command -v node &> /dev/null; then
    echo "[1/5] Installazione Node.js..."
    sudo dnf install -y nodejs
else
    echo "[1/5] Node.js trovato."
fi

# 2. Pulizia profonda
echo "[2/5] Pulizia file temporanei (Reset)..."
rm -rf node_modules package-lock.json dist

# 3. Installazione
echo "[3/5] Installazione librerie (attendere)..."
npm install

# 4. Configurazione API
if [ ! -f ".env" ]; then
    echo "ATTENZIONE: File .env mancante."
    echo "Inserisci la tua Google Gemini API Key (o premi Invio per saltare):"
    read api_key
    echo "API_KEY=$api_key" > .env
fi

# 5. Build
echo "[4/5] Compilazione Software (Build)..."
export $(grep -v '^#' .env | xargs 2>/dev/null)
npm run build

# 6. Permessi
echo "[5/5] Impostazione permessi..."
chmod +x launcher.sh
chmod +x install_icon.sh

echo "=========================================="
echo "✅ INSTALLAZIONE COMPLETATA CON SUCCESSO!"
echo "=========================================="
echo "Ora esegui questo comando per l'icona:"
echo "./install_icon.sh"
echo "=========================================="
