from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)  # Permitir requisições do GitHub Pages

# Configuração do banco de dados
DATABASE = 'database.db'

def init_db():
    """Inicializa o banco de dados se não existir"""
    if not os.path.exists(DATABASE):
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS registros (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT NOT NULL,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insere alguns dados iniciais (opcional)
        cursor.execute("INSERT INTO registros (nome, email) VALUES (?, ?)", 
                      ('Exemplo Usuário', 'exemplo@email.com'))
        
        conn.commit()
        conn.close()
        print(f"Banco de dados '{DATABASE}' criado com sucesso!")

def get_db_connection():
    """Cria uma conexão com o banco de dados"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # Para retornar dicionários
    return conn

# Rota para a página principal (opcional)
@app.route('/')
def index():
    return jsonify({"status": "API está rodando", "mensagem": "Use /api/data para obter dados"})

# Rota GET para obter dados - EXATAMENTE O QUE O FRONTEND ESPERA
@app.route('/api/data', methods=['GET'])
def get_data():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM registros ORDER BY id DESC")
        registros = cursor.fetchall()
        
        # Converte para lista de dicionários
        resultado = []
        for registro in registros:
            resultado.append(dict(registro))
        
        conn.close()
        
        return jsonify({
            "success": True,
            "data": resultado
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Rota POST para atualizar dados - EXATAMENTE O QUE O FRONTEND ESPERA
@app.route('/api/update', methods=['POST'])
def update_data():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "Nenhum dado recebido"
            }), 400
        
        # Validação básica
        if 'nome' not in data or 'email' not in data:
            return jsonify({
                "success": False,
                "error": "Campos 'nome' e 'email' são obrigatórios"
            }), 400
        
        nome = data['nome']
        email = data['email']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insere novo registro
        cursor.execute(
            "INSERT INTO registros (nome, email) VALUES (?, ?)",
            (nome, email)
        )
        
        conn.commit()
        
        # Pega o ID do novo registro
        novo_id = cursor.lastrowid
        
        # Busca o registro inserido
        cursor.execute("SELECT * FROM registros WHERE id = ?", (novo_id,))
        novo_registro = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Dados atualizados com sucesso",
            "data": dict(novo_registro) if novo_registro else None
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Rota para criar a tabela manualmente (útil para testes)
@app.route('/api/init-db', methods=['GET'])
def init_database():
    try:
        init_db()
        return jsonify({
            "success": True,
            "message": f"Banco de dados '{DATABASE}' inicializado"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Inicializa o banco quando o app iniciar
@app.before_first_request
def initialize():
    init_db()

if __name__ == '__main__':
    # Obtém a porta do ambiente (Render fornece via variável PORT)
    port = int(os.environ.get('PORT', 5000))
    
    # Inicia o servidor
    print(f"Iniciando servidor na porta {port}...")
    print(f"URL da API: entre api aqui")
    
    app.run(host='0.0.0.0', port=port, debug=False)
