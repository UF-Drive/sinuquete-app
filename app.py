from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os

# MUDANÇA IMPORTANTE: 
# 'static_url_path' e 'static_folder' dizem pro Python: 
# "Procure os arquivos do site (html, css) aqui nesta pasta mesmo"
app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

# Nome do arquivo do banco
DB_NAME = 'sinuquete.db'

# Função para conectar no SQLite
def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row # Para acessar colunas pelo nome
    return conn

# Função para criar o banco se não existir (Roda automático!)
def init_db():
    if not os.path.exists(DB_NAME):
        conn = get_db_connection()
        cursor = conn.cursor()
        # Cria tabela amigos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS amigos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL
            )
        ''')
        # Cria tabela transacoes
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amigo_id INTEGER NOT NULL,
                local TEXT NOT NULL,
                valor REAL NOT NULL,
                data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (amigo_id) REFERENCES amigos(id)
            )
        ''')
        # Insere os amigos iniciais
        amigos_iniciais = ['Augusto', 'Daniel', 'Fernanda', 'Zé', 'Rafael']
        for nome in amigos_iniciais:
            cursor.execute("INSERT INTO amigos (nome) VALUES (?)", (nome,))
        
        conn.commit()
        conn.close()
        print("Banco de dados SQLite criado com sucesso!")

# --- ROTA PRINCIPAL (CORRIGE O "NOT FOUND") ---
@app.route('/')
def home():
    # Quando entrar em http://localhost:5000, entrega o site!
    return app.send_static_file('index.html')
# ----------------------------------------------

# Rota 1: Pega totais
@app.route('/api/totais', methods=['GET'])
def obter_totais():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Total por amigo
    query = """
        SELECT a.nome, COALESCE(SUM(t.valor), 0) as total
        FROM amigos a
        LEFT JOIN transacoes t ON a.id = t.amigo_id
        GROUP BY a.id, a.nome
    """
    cursor.execute(query)
    totais_amigos = [dict(row) for row in cursor.fetchall()]
    
    # Total por local
    query_locais = """
        SELECT local, COALESCE(SUM(valor), 0) as total
        FROM transacoes
        WHERE valor > 0
        GROUP BY local
    """
    cursor.execute(query_locais)
    totais_locais = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify({'amigos': totais_amigos, 'locais': totais_locais})

# Rota 2: Nova transação
@app.route('/api/transacao', methods=['POST'])
def nova_transacao():
    dados = request.json
    nome_amigo = dados.get('nome')
    local = dados.get('local')
    valor = dados.get('valor')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM amigos WHERE nome = ?", (nome_amigo,))
    amigo = cursor.fetchone()
    
    msg = ''
    if amigo:
        amigo_id = amigo['id']
        cursor.execute(
            "INSERT INTO transacoes (amigo_id, local, valor) VALUES (?, ?, ?)",
            (amigo_id, local, valor)
        )
        conn.commit()
        msg = 'Sucesso!'
    else:
        msg = 'Amigo não encontrado!'
        
    conn.close()
    return jsonify({'mensagem': msg})

# Rota 3: Resetar
@app.route('/api/resetar', methods=['POST'])
def resetar_tudo():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transacoes")
    conn.commit()
    conn.close()
    return jsonify({'mensagem': 'Tudo limpo!'})

if __name__ == '__main__':
    init_db() # Garante que o banco existe antes de ligar
    # use_reloader=False impede que a página recarregue sozinha quando salva dados
    app.run(debug=True, port=5000, use_reloader=False)