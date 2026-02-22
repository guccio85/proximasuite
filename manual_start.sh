#!/bin/bash
# SNEP START SCRIPT v5 (Auto-Build & Auto-Port)

cd "$(dirname "$0")"
CURRENT_USER=$(whoami)

echo "==========================================="
echo "   SNEP WERKBEHEER - AVVIO SICURO"
echo "==========================================="

echo "[1] Stop processi vecchi..."
sudo killall -9 node 2>/dev/null
sudo killall -9 python3 2>/dev/null

echo "[2] 🔨 APPLICAZIONE MODIFICHE (BUILD)..."
echo "Sto rigenerando il software per farti vedere le novità..."
echo "Attendere prego (può volerci un minuto)..."

# QUESTO COMANDO È FONDAMENTALE: Trasforma App.tsx nel sito vero e proprio
npm run build

echo "[3] Configurazione Database..."
if [ ! -f "database.json" ]; then
    echo "{}" > database.json
fi
sudo chown $CURRENT_USER "database.json"
sudo chmod 666 "database.json"

echo "[4] 🚀 AVVIO SERVER..."
echo "Il server cercherà automaticamente una porta libera (3000, 3001, etc)."
echo "-------------------------------------------"

# Avvia node
node server.js
