#!/bin/bash

# Vai nella cartella del progetto
cd "$(dirname "$0")"

echo "--- AVVIO SNEP WERKBEHEER ---"

# --- 1. SBLOCCO PORTA 3000 ---
echo "Controllo porta 3000..."

# Funzione per uccidere i processi
kill_blockers() {
    pkill -f "node server.js"
    pkill -f "python3 app.py"
    pkill -f "flask"
    # Se fuser è installato, usalo (è più preciso)
    if command -v fuser &> /dev/null; then
        fuser -k 3000/tcp >/dev/null 2>&1
    fi
}

kill_blockers
sleep 1

# Controllo se la porta è ancora occupata (usando bash tcp check)
if (echo > /dev/tcp/localhost/3000) >/dev/null 2>&1; then
    echo "⚠️  Porta 3000 ancora occupata. Ritento..."
    kill_blockers
    sleep 2
    
    # Ultimo controllo: se fallisce qui, serve SUDO
    if (echo > /dev/tcp/localhost/3000) >/dev/null 2>&1; then
        echo "------------------------------------------------------------"
        echo "❌ ERRORE CRITICO: PORTA 3000 BLOCCATA DA AMMINISTRATORE"
        echo "------------------------------------------------------------"
        echo "Sembra che un vecchio server sia rimasto attivo con permessi di root."
        echo "Lo script attuale non ha i permessi per chiuderlo."
        echo ""
        echo "PER RISOLVERE, ESEGUI QUESTO COMANDO:"
        echo "   sudo fuser -k 3000/tcp"
        echo ""
        echo "(Se non funziona, riavvia semplicemente il computer)"
        echo "------------------------------------------------------------"
        exit 1
    fi
fi

# --- 2. CONTROLLO DIPENDENZE ---
if [ ! -d "node_modules/express" ]; then
    echo "Installazione librerie necessarie..."
    npm install
fi

# --- 3. BUILD (SOLO SE MANCA) ---
if [ ! -d "dist" ]; then
    echo "Compilazione app..."
    npm run build
fi

# --- 4. AVVIO SERVER ---
echo "Avvio Server Node..."
# > server_log.txt cancella il vecchio log e ne crea uno nuovo
nohup node server.js > server_log.txt 2>&1 &
PID=$!

echo "Attendi avvio (PID: $PID)..."
sleep 4

# Verifica se è vivo
if ps -p $PID > /dev/null; then
    echo "✅ TUTTO OK! Server attivo."
    echo "Apri Firefox su: http://localhost:3000"
else
    echo "❌ IL SERVER SI È ARRESTATO SUBITO."
    echo "Ecco l'errore:"
    cat server_log.txt
fi
