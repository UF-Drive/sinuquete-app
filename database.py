import sqlite3
import os

DB_NAME = 'sinuquete.db'

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB_NAME):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Tabela Amigos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS amigos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL
            )
        ''')
        
        # Tabela Transações
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
        
        # Dados Iniciais
        amigos_iniciais = ['Augusto', 'Daniel', 'Fernanda', 'Zé', 'Rafael']
        for nome in amigos_iniciais:
            cursor.execute("INSERT INTO amigos (nome) VALUES (?)", (nome,))
        
        conn.commit()
        conn.close()
        print("Banco de dados organizado e criado com sucesso!")

# Funções auxiliares para limpar o app.py
def buscar_totais_amigos():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT a.nome, COALESCE(SUM(t.valor), 0) as total
        FROM amigos a
        LEFT JOIN transacoes t ON a.id = t.amigo_id
        GROUP BY a.id, a.nome
    """
    cursor.execute(query)
    resultado = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return resultado

def buscar_totais_locais():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT local, COALESCE(SUM(valor), 0) as total
        FROM transacoes
        WHERE valor > 0
        GROUP BY local
    """
    cursor.execute(query)
    resultado = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return resultado

def registrar_transacao(nome_amigo, local, valor):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM amigos WHERE nome = ?", (nome_amigo,))
    amigo = cursor.fetchone()
    
    msg = 'Amigo não encontrado!'
    if amigo:
        cursor.execute(
            "INSERT INTO transacoes (amigo_id, local, valor) VALUES (?, ?, ?)",
            (amigo['id'], local, valor)
        )
        conn.commit()
        msg = 'Sucesso!'
    
    conn.close()
    return msg

def limpar_banco():
    conn = get_db_connection()
    conn.execute("DELETE FROM transacoes")
    conn.commit()
    conn.close()