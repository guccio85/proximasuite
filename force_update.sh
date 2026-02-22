
#!/bin/bash
# SCRIPT DI AGGIORNAMENTO FORZATO V2
# Esegui questo script se vedi ancora la vecchia versione.

echo "============================================="
echo "   SNEP - FORCE UPDATE & CLEAN V2"
echo "============================================="
echo "Inserisci la password di amministratore per sbloccare i file."
sudo -v

# 1. Ferma tutto
echo "🛑 Arresto processi..."
sudo pkill -9 node 2>/dev/null
sudo pkill -9 python3 2>/dev/null
sudo fuser -k -9 3000/tcp 2>/dev/null

# 2. Ripara permessi (Cruciale: diventa proprietario di tutto)
CURRENT_USER=$(whoami)
echo "🔧 Riparazione permessi per utente: $CURRENT_USER"
sudo chown -R $CURRENT_USER:$CURRENT_USER .

# 3. Pulizia profonda (Rimuovi cache npm che spesso si corrompe)
echo "🧹 Cancellazione cache e build..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf "$HOME/.npm/_cacache"

# 4. Ricostruzione
echo "🏗️  RICOSTRUZIONE SITO (BUILD)..."
# Forza installazione dipendenze se mancano
npm install
npm run build

# Verifica successo
if [ ! -f "dist/index.html" ]; then
    echo "❌ ERRORE CRITICO: La build è fallita."
    read -p "Premi INVIO per uscire..."
    exit 1
fi

echo "✅ Build completata."

# 5. Avvio
echo "🚀 Avvio Server..."
node server.js &
SERVER_PID=$!

sleep 5

if ps -p $SERVER_PID > /dev/null; then
    echo "✅ SERVER AVVIATO SU http://localhost:3000"
    echo "Dovresti vedere v5.4 in alto."
    echo "Apro il browser..."
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v firefox &> /dev/null; then
        firefox http://localhost:3000
    fi
else
    echo "❌ Errore avvio server."
fi

wait $SERVER_PID
