from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import atexit

app = Flask(__name__)

# CORS - permitir seu domínio GitHub Pages
CORS(app, origins=[
    "https://billybulletfortal.github.io",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
])

# Banco em memória para Render Free
USE_IN_MEMORY_DB = True
DATABASE = ':memory:' if USE_IN_MEMORY_DB else '/tmp/database.db'
conn = None
db_initialized = False

def init_db():
    """Inicializa o banco de dados uma vez"""
    global conn, db_initialized
    
    if db_initialized and conn:
        return conn
    
    print("🔧 Inicializando banco de dados...")
    
    if USE_IN_MEMORY_DB:
        conn = sqlite3.connect(DATABASE, check_same_thread=False)
        conn.row_factory = sqlite3.Row
    else:
        conn = sqlite3.connect(DATABASE, check_same_thread=False)
        conn.row_factory = sqlite3.Row
    
    cursor = conn.cursor()
    
    # TABELA DE PROJETOS
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projetos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('comercial', 'secreto', 'publico')),
            nivel_acesso TEXT NOT NULL,
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insere dados de exemplo se tabela estiver vazia
    cursor.execute("SELECT COUNT(*) as count FROM projetos")
    count = cursor.fetchone()[0]
    
    if count == 0:
        projetos_exemplo = [
            ("Site E-commerce", "Loja virtual completa com carrinho de compras", "comercial", "Restrito"),
            ("Sistema de Gestão", "ERP para controle empresarial", "comercial", "Restrito"),
            ("Projeto Alpha", "Desenvolvimento de IA avançada", "secreto", "Confidencial"),
            ("Portal do Cidadão", "Sistema de serviços públicos online", "publico", "Público"),
            ("App Mobile", "Aplicativo para dispositivos móveis", "comercial", "Restrito"),
            ("Pesquisa Científica", "Estudo sobre novas tecnologias", "publico", "Público"),
            ("Sistema de Segurança", "Controle de acesso e monitoramento", "secreto", "Confidencial"),
            ("Plataforma Educacional", "Cursos online e aprendizagem", "publico", "Público")
        ]
        
        for projeto in projetos_exemplo:
            cursor.execute(
                "INSERT INTO projetos (nome, descricao, tipo, nivel_acesso) VALUES (?, ?, ?, ?)",
                projeto
            )
        
        conn.commit()
        print(f"✅ Banco inicializado com {len(projetos_exemplo)} projetos")
    else:
        print(f"📊 Banco já contém {count} projetos")
    
    db_initialized = True
    return conn

def get_db_connection():
    """Retorna conexão com o banco, inicializando se necessário"""
    global conn
    if conn is None:
        return init_db()
    return conn

# Fechar conexão
def close_connection():
    global conn
    if conn:
        conn.close()
        print("🔌 Conexão com banco de dados fechada")

atexit.register(close_connection)

# Rota para verificar status
@app.route('/')
def index():
    return jsonify({
        "status": "API de Projetos está rodando",
        "service": "BillyBulletFortal API",
        "endpoints": {
            "GET /api/projetos": "Obter todos projetos",
            "GET /api/projetos?tipo={tipo}": "Filtrar por tipo",
            "GET /api/projetos/buscar?termo={termo}": "Buscar por termo",
            "POST /api/projetos": "Adicionar novo projeto",
            "GET /api/health": "Verificar saúde da API"
        },
        "note": "Render Free Tier - pode levar 30s para iniciar na primeira vez"
    })

# Middleware para inicializar DB na primeira requisição
@app.before_request
def initialize_on_first_request():
    """Inicializa o banco na primeira requisição recebida"""
    global db_initialized
    if not db_initialized:
        init_db()

# ENDPOINT PRINCIPAL: /api/projetos - GET (com filtro por tipo)
@app.route('/api/projetos', methods=['GET'])
def get_projetos():
    try:
        tipo = request.args.get('tipo', '').lower()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if tipo and tipo in ['comercial', 'secreto', 'publico']:
            cursor.execute("SELECT * FROM projetos WHERE tipo = ? ORDER BY id DESC", (tipo,))
        else:
            cursor.execute("SELECT * FROM projetos ORDER BY id DESC")
        
        projetos = cursor.fetchall()
        
        # Converte para lista de dicionários
        resultado = []
        for projeto in projetos:
            resultado.append({
                "id": projeto['id'],
                "nome": projeto['nome'],
                "descricao": projeto['descricao'],
                "tipo": projeto['tipo'],
                "nivel_acesso": projeto['nivel_acesso'],
                "data_criacao": projeto['data_criacao']
            })
        
        print(f"📊 GET /api/projetos - tipo: '{tipo}' - encontrados: {len(resultado)}")
        
        return jsonify({
            "success": True,
            "count": len(resultado),
            "projetos": resultado
        })
    
    except Exception as e:
        print(f"❌ ERRO em /api/projetos: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Erro ao buscar projetos"
        }), 500

# ENDPOINT DE BUSCA: /api/projetos/buscar - GET
@app.route('/api/projetos/buscar', methods=['GET'])
def buscar_projetos():
    try:
        termo = request.args.get('termo', '').strip()
        
        if not termo:
            return jsonify({
                "success": True,
                "projetos": [],
                "count": 0
            })
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM projetos 
            WHERE LOWER(nome) LIKE ? OR LOWER(descricao) LIKE ? 
            ORDER BY id DESC
        ''', (f'%{termo.lower()}%', f'%{termo.lower()}%'))
        
        projetos = cursor.fetchall()
        
        resultado = []
        for projeto in projetos:
            resultado.append({
                "id": projeto['id'],
                "nome": projeto['nome'],
                "descricao": projeto['descricao'],
                "tipo": projeto['tipo'],
                "nivel_acesso": projeto['nivel_acesso']
            })
        
        print(f"🔍 GET /api/projetos/buscar - termo: '{termo}' - encontrados: {len(resultado)}")
        
        return jsonify({
            "success": True,
            "count": len(resultado),
            "projetos": resultado
        })
    
    except Exception as e:
        print(f"❌ ERRO em /api/projetos/buscar: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Erro na busca"
        }), 500

# Rota de saúde
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM projetos")
        count = cursor.fetchone()[0]
        
        return jsonify({
            "status": "healthy",
            "projetos_count": count,
            "service": "billybulletfortal-github-io-1",
            "database": "SQLite em memória" if USE_IN_MEMORY_DB else "SQLite em arquivo",
            "initialized": db_initialized
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

# Handler para erro 404
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint não encontrado",
        "available_endpoints": ["/", "/api/projetos", "/api/projetos/buscar", "/api/health"]
    }), 404

if __name__ == '__main__':
    # Inicializa o banco antes de iniciar o servidor
    init_db()
    
    port = int(os.environ.get('PORT', 5000))
    
    print("=" * 50)
    print("🚀 Iniciando API de Projetos - BillyBulletFortal")
    print(f"🔗 URL: https://billybulletfortal-github-io-1.onrender.com")
    print(f"📁 Endpoint principal: /api/projetos")
    print(f"🩺 Health check: /api/health")
    print(f"🔧 Banco de dados: {'Memória' if USE_IN_MEMORY_DB else 'Arquivo'}")
    print(f"🌐 CORS permitido para: https://billybulletfortal.github.io")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=port, debug=False)
