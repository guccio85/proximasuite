import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DATA_FILE = path.join(__dirname, 'database.json');
const DIST_PATH = path.join(__dirname, 'dist');
const UPLOADS_PATH = path.join(__dirname, 'uploads');

// --- SISTEMA BACKUP WINDOWS ---
const BACKUP_DIR = 'C:\\SNEP_BACKUP'; 

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📂 Cartella backup creata: ${BACKUP_DIR}`);
}

const runBackup = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const date = new Date();
            const timestamp = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours()}-${date.getMinutes()}`;
            const backupPath = path.join(BACKUP_DIR, `database_backup_${timestamp}.json`);
            fs.copyFileSync(DATA_FILE, backupPath);
            console.log(`🛡️ Backup salvato: ${backupPath}`);
            
            // Purga backup vecchi (mantiene solo gli ultimi 30 giorni)
            purgeOldBackups();
        }
    } catch (e) {
        console.error("❌ Errore backup:", e);
    }
};

const purgeOldBackups = () => {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const now = Date.now();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 giorni
        
        files.forEach(file => {
            const filePath = path.join(BACKUP_DIR, file);
            const fileStat = fs.statSync(filePath);
            const fileAge = now - fileStat.mtimeMs;
            
            // Elimina file più vecchi di 30 giorni
            if (fileAge > thirtyDaysInMs) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Backup antiguo eliminato: ${file}`);
            }
        });
    } catch (e) {
        console.error("❌ Errore durante purga backup:", e);
    }
};

// Assicura cartella uploads
if (!fs.existsSync(UPLOADS_PATH)) {
    fs.mkdirSync(UPLOADS_PATH);
}

app.use(express.json({ limit: '50mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  // Set correct MIME types for assets
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  } else if (req.path.endsWith('.css')) {
    res.type('text/css');
  } else if (req.path.endsWith('.svg')) {
    res.type('image/svg+xml');
  }
  next();
});

// API Get Dati
app.get('/api/data', (req, res) => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json({ orders: [], workers: [], availabilities: [], workLogs: [] });
        }
    } catch (e) {
        res.json({ orders: [], workers: [], availabilities: [], workLogs: [] });
    }
});

// API Post Dati (con Backup)
app.post('/api/data', (req, res) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
        console.log("💾 Dati salvati.");
        runBackup(); // Fa il backup ad ogni salvataggio
        res.json({ success: true });
    } catch (e) {
        console.error("❌ Errore:", e);
        res.status(500).send("Errore salvataggio");
    }
});

// API Upload Foto
app.post('/api/upload', (req, res) => {
    try {
        const { imageName, imageData } = req.body;
        const filePath = path.join(UPLOADS_PATH, imageName);
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(filePath, base64Data, 'base64');
        console.log(`📸 Foto salvata: ${imageName}`);
        res.json({ success: true, path: `/uploads/${imageName}` });
    } catch (e) {
        res.status(500).send("Errore foto");
    }
});

// Serve static files from dist with correct MIME types
app.use(express.static(DIST_PATH, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

app.use('/uploads', express.static(UPLOADS_PATH));

// SPA fallback - serve index.html for any route not matching static files
app.get('*', (req, res) => {
  const indexPath = path.join(DIST_PATH, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Index not found');
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ SERVER SNEP ATTIVO: http://localhost:${PORT}`);
    console.log(`📂 Database: ${DATA_FILE}`);
    console.log(`🛡️ Backup attivi in: ${BACKUP_DIR}\n`);
});