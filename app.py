from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import atexit

app = Flask(__name__)

# CORS mais seguro - permita apenas seu domínio GitHub Pages
CORS(app, origins=[
    "https://billybulletfortal.github.io",
    "http://localhost:8000",  # Para testes locais
    "http://127.0.0.1:8000"
])

# SOLUÇÃO PARA RENDER: SQLite em memória (dados temporários)
# No Render Free, arquivos são perdidos. Use memória ou PostgreSQL
USE_IN_MEMORY_DB = True  # Mude para False se configurar PostgreSQL depois

if USE_IN_MEMORY_DB:
    DATABASE = ':memory:'  # Banco em memória (dados perdidos ao reiniciar)
    print("⚠️  USANDO BANCO EM MEMÓRIA - Dados serão perdidos após reinício")
else:
    DATABASE = '/tmp/database.db'  # Pasta temporária no Render

# Conexão global para o banco em memória
conn = None

def get_db_connection():
    """Cria ou retorna conexão com o banco de dados"""
    global conn
    
    if USE_IN_MEMORY_DB:
        if conn is None:
            conn = sqlite3.connect(DATABASE, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            init_db(conn)
        return conn
    else:
        # Para arquivo em disco
        conn = sqlite3.connect(DATABASE, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        if not os.path.exists(DATABASE):
            init_db(conn)
        return conn

def init_db(connection):
    """Inicializa o banco de dados com tabela e dados de exemplo"""
    cursor = connection.cursor()
    
    # Tabela conforme esperado pelo frontend
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL,
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Verifica se já existem dados
    cursor.execute("SELECT COUNT(*) as count FROM registros")
    count = cursor.fetchone()[0]
    
    # Insere dados iniciais apenas se tabela estiver vazia
    if count == 0:
        cursor.execute("INSERT INTO registros (nome, email) VALUES (?, ?)", 
                      ('João Silva', 'joao@exemplo.com'))
        cursor.execute("INSERT INTO registros (nome, email) VALUES (?, ?)", 
                      ('Maria Santos', 'maria@exemplo.com'))
        connection.commit()
        print(f"✅ Banco inicializado com {cursor.rowcount} registros")
    
    return connection

# Fechar conexão ao encerrar
def close_connection():
    if conn:
        conn.close()
        print("Conexão com banco de dados fechada")

atexit.register(close_connection)

# Rota para verificar se API está rodando
@app.route('/')
def index():
    return jsonify({
        "status": "API está rodando", 
        "service": "BillyBulletFortal Backend",
        "endpoints": {
            "GET /api/data": "Obter todos registros",
            "POST /api/update": "Adicionar novo registro",
            "GET /api/init-db": "Reinicializar banco de dados",
            "GET /api/health": "Verificar saúde da API"
        },
        "database_type": "SQLite em memória" if USE_IN_MEMORY_DB else "SQLite em arquivo"
    })

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
            # Converte sqlite3.Row para dict
            resultado.append({key: registro[key] for key in registro.keys()})
        
        # NÃO fecha conexão se for em memória!
        if not USE_IN_MEMORY_DB:
            conn.close()
        
        print(f"📊 GET /api/data: Retornando {len(resultado)} registros")
        
        return jsonify({
            "success": True,
            "count": len(resultado),
            "data": resultado
        })
    
    except Exception as e:
        print(f"❌ ERRO em /api/data: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Erro ao buscar dados do banco",
            "details": str(e) if os.environ.get('FLASK_ENV') == 'development' else None
        }), 500

# Rota POST para atualizar dados - EXATAMENTE O QUE O FRONTEND ESPERA
@app.route('/api/update', methods=['POST'])
def update_data():
    try:
        # Log da requisição
        print(f"📝 Recebendo POST /api/update")
        
        data = request.get_json()
        
        if not data:
            print("❌ Nenhum JSON recebido")
            return jsonify({
                "success": False,
                "error": "Nenhum dado recebido. Envie JSON com 'nome' e 'email'"
            }), 400
        
        print(f"📦 Dados recebidos: {data}")
        
        # Validação básica
        if 'nome' not in data or 'email' not in data:
            print(f"❌ Campos faltando. Recebido: {list(data.keys())}")
            return jsonify({
                "success": False,
                "error": "Campos 'nome' e 'email' são obrigatórios",
                "received": list(data.keys())
            }), 400
        
        nome = data['nome']
        email = data['email']
        
        # Validação simples
        if not nome.strip() or not email.strip():
            return jsonify({
                "success": False,
                "error": "Nome e email não podem estar vazios"
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insere novo registro
        cursor.execute(
            "INSERT INTO registros (nome, email) VALUES (?, ?)",
            (nome.strip(), email.strip())
        )
        
        conn.commit()
        
        # Pega o ID do novo registro
        novo_id = cursor.lastrowid
        
        # Busca o registro inserido
        cursor.execute("SELECT * FROM registros WHERE id = ?", (novo_id,))
        novo_registro = cursor.fetchone()
        
        # NÃO fecha conexão se for em memória!
        if not USE_IN_MEMORY_DB:
            conn.close()
        
        resultado = {key: novo_registro[key] for key in novo_registro.keys()} if novo_registro else None
        
        print(f"✅ Registro inserido com ID: {novo_id}")
        
        return jsonify({
            "success": True,
            "message": "Dados atualizados com sucesso",
            "id": novo_id,
            "data": resultado
        })
    
    except Exception as e:
        print(f"❌ ERRO em /api/update: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Erro ao salvar dados",
            "details": str(e) if os.environ.get('FLASK_ENV') == 'development' else None
        }), 500

# Rota para criar/reiniciar o banco
@app.route('/api/init-db', methods=['GET'])
def init_database():
    try:
        global conn
        
        # Fecha conexão existente se houver
        if conn:
            conn.close()
            conn = None
        
        # Cria nova conexão (que irá inicializar o banco)
        conn = get_db_connection()
        
        print("✅ Banco de dados reinicializado")
        
        return jsonify({
            "success": True,
            "message": "Banco de dados reinicializado",
            "database": DATABASE
        })
    except Exception as e:
        print(f"❌ ERRO em /api/init-db: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Rota de saúde da API
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        db_ok = cursor.fetchone()[0] == 1
        
        if not USE_IN_MEMORY_DB:
            conn.close()
        
        return jsonify({
            "status": "healthy",
            "database": "connected" if db_ok else "disconnected",
            "timestamp": os.environ.get('RENDER_TIMESTAMP', 'unknown'),
            "service_id": os.environ.get('RENDER_SERVICE_ID', 'local')
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "database": "error",
            "error": str(e)
        }), 500

# Inicializa o banco quando o app iniciar
@app.before_first_request
def initialize():
    print("🚀 Inicializando aplicação Flask...")
    print(f"🔧 Modo: {'Desenvolvimento' if app.debug else 'Produção'}")
    print(f"🗄️  Banco de dados: {'Memória' if USE_IN_MEMORY_DB else 'Arquivo'}")
    print(f"🌐 CORS permitido para: https://billybulletfortal.github.io")

# Handler para erro 404
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint não encontrado",
        "available_endpoints": ["/", "/api/data", "/api/update", "/api/init-db", "/api/health"]
    }), 404

if __name__ == '__main__':
    # Obtém a porta do ambiente (Render fornece via variável PORT)
    port = int(os.environ.get('PORT', 5000))
    
    print(f"🚀 Iniciando servidor na porta {port}...")
    print(f"🔗 URL da API: https://billybulletfortal-github-io-1.onrender.com")
    print(f"📞 Endpoint principal: https://billybulletfortal-github-io-1.onrender.com/api/data")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=port, debug=False)
