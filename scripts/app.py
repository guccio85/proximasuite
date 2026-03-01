import os
from flask import Flask, send_from_directory
from dotenv import load_dotenv

# Carica le variabili d'ambiente dal file .env (essenziale per il servizio systemd)
load_dotenv()

# Serve i file dalla cartella 'dist' (la versione ottimizzata/compilata del sito)
app = Flask(__name__, static_folder='dist', static_url_path='')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Se il file richiesto esiste nella cartella dist (es. css, js), servilo
    if path != "" and os.path.exists(os.path.join('dist', path)):
        return send_from_directory('dist', path)
    # Altrimenti servi sempre index.html (per far gestire il routing a React)
    else:
        return send_from_directory('dist', 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    # Verifica API KEY
    if not os.environ.get("API_KEY"):
        print("ATTENZIONE: API_KEY non trovata nelle variabili d'ambiente.")
    
    print(f"SNEP Werkbeheer avviato su http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port)
