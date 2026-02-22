import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateQRCode() {
    try {
        console.log('🔍 Cercando NGROK tunnel attivo...');
        
        // Leggi da NGROK API (disponibile su localhost:4040)
        const response = await fetch('http://localhost:4040/api/tunnels');
        const data = await response.json();
        
        if (!data.tunnels || data.tunnels.length === 0) {
            console.log('❌ Nessun tunnel NGROK attivo! Avvia NGROK prima.');
            process.exit(1);
        }
        
        // Estrai il primo URL HTTPS
        const tunnel = data.tunnels.find(t => t.proto === 'https');
        if (!tunnel) {
            console.log('❌ Tunnel HTTPS non trovato!');
            process.exit(1);
        }
        
        const publicUrl = tunnel.public_url;
        const fullUrl = `${publicUrl}/?view=werkplaats`;
        
        console.log(`\n✅ NGROK Tunnel trovato!`);
        console.log(`🌐 URL pubblico: ${publicUrl}`);
        console.log(`📱 URL con view: ${fullUrl}\n`);
        
        // Genera HTML con QR code usando API online (no dipendenze)
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`;
        
        const html = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SNEP SMART - QR Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 600px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .qr-container {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .qr-container img {
            max-width: 100%;
            height: auto;
        }
        .url-box {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 8px;
            word-break: break-all;
            font-size: 12px;
            color: #333;
            margin-top: 20px;
            border-left: 4px solid #667eea;
        }
        .instructions {
            background: #e8f4f8;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: left;
            font-size: 14px;
            border-left: 4px solid #00bcd4;
        }
        .instructions h3 {
            margin-top: 0;
            color: #00695c;
        }
        .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .instructions li {
            margin: 8px 0;
            color: #555;
        }
        .status {
            display: inline-block;
            background: #4caf50;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 SNEP SMART v6</h1>
        <p class="subtitle">Scansiona il QR code dal telefono</p>
        <span class="status">✅ NGROK Attivo</span>
        
        <div class="qr-container">
            <img src="${qrApiUrl}" alt="QR Code">
        </div>
        
        <div class="url-box">
            <strong>URL:</strong><br>
            ${fullUrl}
        </div>
        
        <div class="instructions">
            <h3>📋 Come installare l'app:</h3>
            <ol>
                <li>Scansiona il QR code con il telefono</li>
                <li>Apri il link nel browser</li>
                <li>Clicca il pulsante "Installa" in alto</li>
                <li>L'app è installata! 🎉</li>
                <li>Prossimo accesso: auto-login per 24 ore</li>
            </ol>
        </div>
    </div>
</body>
</html>`;
        
        const qrFilePath = path.join(__dirname, 'qr-code.html');
        fs.writeFileSync(qrFilePath, html);
        
        console.log(`✅ QR code salvato: ${qrFilePath}`);
        console.log(`\n📂 Apri qr-code.html nel browser per visualizzarlo\n`);
        
    } catch (error) {
        console.error('❌ Errore:', error.message);
        console.log('\n💡 Assicurati che NGROK sia avviato.');
        process.exit(1);
    }
}

generateQRCode();
