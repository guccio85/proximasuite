#!/bin/bash
cd "$(dirname "$0")"

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}   SNEP - AVVIO PULITO V5.0         ${NC}"
echo -e "${GREEN}====================================${NC}"

# 1. PULIZIA TOTALE (KILL)
echo -e "${RED}>> [1/5] Chiusura processi...${NC}"
pkill -9 node 2>/dev/null
pkill -9 python3 2>/dev/null
fuser -k -9 3000/tcp 2>/dev/null

sleep 1

# 2. ELIMINAZIONE VECCHIA BUILD (IMPORTANTE)
echo -e "${RED}>> [2/5] Rimozione vecchi file (Cache)...${NC}"
rm -rf dist
rm -rf node_modules/.vite

# 3. NUOVA BUILD
echo -e "${GREEN}>> [3/5] Ricostruzione Sito (Build)...${NC}"
npm run build

# 4. AVVIO SERVER
echo -e "${GREEN}>> [4/5] Avvio Server...${NC}"
node server.js &
SERVER_PID=$!

# 5. ATTESA E CONTROLLO
echo -e "${GREEN}>> [5/5] Attendo caricamento...${NC}"
sleep 5

if ! ps -p $SERVER_PID > /dev/null; then
    echo -e "${RED}❌ ERRORE: Il server non è partito.${NC}"
    read -p "Premi INVIO per uscire..."
    exit 1
fi

# 6. APERTURA BROWSER
echo "Apro il sito..."
# Prova ad aprire Firefox (comando Linux standard)
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v firefox &> /dev/null; then
    firefox http://localhost:3000
fi

echo ""
echo "✅ TUTTO OK."
wait $SERVER_PID
