from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import database
import unicodedata

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

# Função para transformar "Zé" em "ze", "Augusto" em "augusto"
def slugify(texto):
    return ''.join(c for c in unicodedata.normalize('NFD', texto)
                  if unicodedata.category(c) != 'Mn').lower()

# --- CONFIGURAÇÕES DO JOGO (Fácil de editar aqui!) ---
AMIGOS_LISTA = ['Augusto', 'Daniel', 'Fernanda', 'Zé', 'Rafael']

LOCAIS_PRECOS = [
    {'nome': 'CT', 'preco': 2.00},
    {'nome': 'Artes', 'preco': 2.00},
    {'nome': 'Onofre', 'preco': 3.00},
    {'nome': 'Ed. Física', 'preco': 2.00}
]

# Rota Principal
@app.route('/')
def home():
    # Prepara os dados para o HTML
    amigos_dados = []
    for nome in AMIGOS_LISTA:
        amigos_dados.append({
            'nome': nome,
            'id': slugify(nome), # gera "ze", "daniel"...
            'css_class': f'card-{slugify(nome)}' # gera "card-ze"...
        })
    
    # Envia tudo para o template renderizar
    return render_template('index.html', amigos=amigos_dados, locais=LOCAIS_PRECOS)

# API - Totais
@app.route('/api/totais', methods=['GET'])
def obter_totais():
    amigos = database.buscar_totais_amigos()
    locais = database.buscar_totais_locais()
    return jsonify({'amigos': amigos, 'locais': locais})

# API - Nova Transação
@app.route('/api/transacao', methods=['POST'])
def nova_transacao():
    dados = request.json
    msg = database.registrar_transacao(dados.get('nome'), dados.get('local'), dados.get('valor'))
    return jsonify({'mensagem': msg})

# API - Resetar
@app.route('/api/resetar', methods=['POST'])
def resetar_tudo():
    database.limpar_banco()
    return jsonify({'mensagem': 'Tudo limpo!'})

if __name__ == '__main__':
    database.init_db()
    app.run(debug=True, port=5000)