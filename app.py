"""
API do Sistema Wayne Industries - Versão Consolidada
Arquivo: app.py
Serviço: https://billybulletfortal-github-io-1.onrender.com
"""

from flask import Flask, jsonify, request, g
from flask_cors import CORS
import sqlite3
import os
import atexit
import hashlib
import base64

# ============================================
# CONFIGURAÇÃO INICIAL
# ============================================

app = Flask(__name__)

# Configuração CORS - Permitir frontend do GitHub Pages
CORS(app, origins=[
    "https://billybulletfortal.github.io",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
])

# Configuração do Banco de Dados
DATABASE_PATH = '/tmp/wayne_industries.db'

# ============================================
# FUNÇÕES DO BANCO DE DADOS
# ============================================

def get_db():
    """Obtém conexão com o banco de dados"""
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
        g.db.row_factory = sqlite3.Row
    return g.db

def init_database():
    """Inicializa o banco de dados com tabelas e dados de exemplo"""
    db = get_db()
    cursor = db.cursor()
    
    # Tabela de Projetos
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
    
    # Tabela de Usuários
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            nome TEXT NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('vendedor', 'gerente', 'admin_seguranca')),
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Verificar e inserir dados de exemplo
    cursor.execute("SELECT COUNT(*) FROM projetos")
    if cursor.fetchone()[0] == 0:
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
        cursor.executemany("INSERT INTO projetos (nome, descricao, tipo, nivel_acesso) VALUES (?, ?, ?, ?)", projetos_exemplo)
        print(f"✅ {len(projetos_exemplo)} projetos inseridos")
    
    cursor.execute("SELECT COUNT(*) FROM usuarios")
    if cursor.fetchone()[0] == 0:
        usuarios_exemplo = [
            ("vendedor1", hashlib.sha256("valetudo".encode()).hexdigest(), "Vendedor 01", "vendedor"),
            ("gerente01", hashlib.sha256("precisodeaumento".encode()).hexdigest(), "Gerente 01", "gerente"),
            ("adminiseg1", hashlib.sha256("bat1234".encode()).hexdigest(), "Admin Segurança 01", "admin_seguranca")
        ]
        cursor.executemany("INSERT INTO usuarios (username, senha_hash, nome, tipo) VALUES (?, ?, ?, ?)", usuarios_exemplo)
        print(f"✅ {len(usuarios_exemplo)} usuários inseridos")
    
    db.commit()
    print("📊 Banco de dados inicializado com sucesso")

def close_db(e=None):
    """Fecha a conexão com o banco de dados"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

# ============================================
# FUNÇÕES DE AUTENTICAÇÃO E AUTORIZAÇÃO
# ============================================

def autenticar_usuario(username, senha):
    """Autentica um usuário e retorna seus dados"""
    try:
        db = get_db()
        cursor = db.cursor()
        senha_hash = hashlib.sha256(senha.encode()).hexdigest()
        
        cursor.execute(
            "SELECT id, username, nome, tipo FROM usuarios WHERE username = ? AND senha_hash = ?",
            (username, senha_hash)
        )
        
        usuario = cursor.fetchone()
        if usuario:
            return {
                "success": True,
                "id": usuario['id'],
                "username": usuario['username'],
                "nome": usuario['nome'],
                "tipo": usuario['tipo'],
                "autenticado": True
            }
        return {"success": False, "error": "Credenciais inválidas"}
    except Exception as e:
        print(f"❌ Erro na autenticação: {str(e)}")
        return {"success": False, "error": "Erro no servidor"}

def extrair_credenciais_auth_header():
    """Extrai username e senha do cabeçalho Authorization"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, None
    
    try:
        auth_data = auth_header.replace('Bearer ', '').strip()
        decoded = base64.b64decode(auth_data).decode('utf-8')
        username, senha = decoded.split(':', 1)
        return username, senha
    except:
        return None, None

def verificar_admin(username, senha):
    """Verifica se o usuário é administrador de segurança"""
    usuario = autenticar_usuario(username, senha)
    return usuario.get('success') and usuario.get('tipo') == 'admin_seguranca'

# ============================================
# ENDPOINTS DA API
# ============================================

@app.route('/')
def index():
    """Página inicial da API"""
    return jsonify({
        "status": "API Wayne Industries está online",
        "service": "BillyBulletFortal API v2.0",
        "endpoints": {
            "POST /api/login": "Autenticar usuário",
            "GET /api/projetos": "Listar todos os projetos",
            "GET /api/projetos?tipo={tipo}": "Filtrar projetos por tipo",
            "GET /api/projetos/buscar?termo={termo}": "Buscar projetos",
            "PUT /api/projetos/{id}": "Atualizar projeto (apenas admin_seguranca)",
            "GET /api/health": "Verificar status da API"
        },
        "note": "Render Free Tier - Pode levar até 30s para iniciar"
    })

@app.route('/api/login', methods=['POST'])
def login():
    """Endpoint de login"""
    try:
        dados = request.get_json()
        if not dados or 'username' not in dados or 'senha' not in dados:
            return jsonify({"success": False, "error": "Username e senha são obrigatórios"}), 400
        
        resultado = autenticar_usuario(dados['username'], dados['senha'])
        
        if resultado['success']:
            print(f"✅ Login bem-sucedido: {resultado['nome']} ({resultado['tipo']})")
            return jsonify(resultado)
        else:
            print(f"❌ Login falhou para: {dados['username']}")
            return jsonify(resultado), 401
    
    except Exception as e:
        print(f"❌ Erro em /api/login: {str(e)}")
        return jsonify({"success": False, "error": "Erro interno no servidor"}), 500

@app.route('/api/projetos', methods=['GET'])
def listar_projetos():
    """Lista projetos, com filtro opcional por tipo"""
    try:
        tipo = request.args.get('tipo', '').lower()
        db = get_db()
        cursor = db.cursor()
        
        if tipo in ['comercial', 'secreto', 'publico']:
            cursor.execute("SELECT * FROM projetos WHERE tipo = ? ORDER BY id DESC", (tipo,))
        else:
            cursor.execute("SELECT * FROM projetos ORDER BY id DESC")
        
        projetos = cursor.fetchall()
        resultado = [
            {
                "id": p['id'],
                "nome": p['nome'],
                "descricao": p['descricao'],
                "tipo": p['tipo'],
                "nivel_acesso": p['nivel_acesso'],
                "data_criacao": p['data_criacao']
            }
            for p in projetos
        ]
        
        print(f"📊 Projetos listados: {len(resultado)} (tipo: '{tipo}')")
        return jsonify({"success": True, "count": len(resultado), "projetos": resultado})
    
    except Exception as e:
        print(f"❌ Erro em /api/projetos: {str(e)}")
        return jsonify({"success": False, "error": "Erro ao buscar projetos"}), 500

@app.route('/api/projetos/buscar', methods=['GET'])
def buscar_projetos():
    """Busca projetos por termo"""
    try:
        termo = request.args.get('termo', '').strip()
        if not termo:
            return jsonify({"success": True, "projetos": [], "count": 0})
        
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "SELECT * FROM projetos WHERE LOWER(nome) LIKE ? OR LOWER(descricao) LIKE ? ORDER BY id DESC",
            (f'%{termo.lower()}%', f'%{termo.lower()}%')
        )
        
        projetos = cursor.fetchall()
        resultado = [
            {
                "id": p['id'],
                "nome": p['nome'],
                "descricao": p['descricao'],
                "tipo": p['tipo'],
                "nivel_acesso": p['nivel_acesso']
            }
            for p in projetos
        ]
        
        print(f"🔍 Busca por '{termo}': {len(resultado)} resultados")
        return jsonify({"success": True, "count": len(resultado), "projetos": resultado})
    
    except Exception as e:
        print(f"❌ Erro em /api/projetos/buscar: {str(e)}")
        return jsonify({"success": False, "error": "Erro na busca"}), 500

@app.route('/api/projetos/<int:projeto_id>', methods=['PUT'])
def atualizar_projeto(projeto_id):
    """Atualiza um projeto (apenas para admin_seguranca)"""
    try:
        # Verificar autenticação
        username, senha = extrair_credenciais_auth_header()
        if not username or not senha:
            return jsonify({"success": False, "error": "Autenticação necessária"}), 401
        
        if not verificar_admin(username, senha):
            return jsonify({"success": False, "error": "Acesso restrito a administradores de segurança"}), 403
        
        # Validar dados
        dados = request.get_json()
        if not dados:
            return jsonify({"success": False, "error": "Dados de atualização necessários"}), 400
        
        campos_permitidos = ['descricao', 'tipo']
        campos_recebidos = [k for k in dados.keys() if k in campos_permitidos]
        
        if not campos_recebidos:
            return jsonify({"success": False, "error": "Nenhum campo válido para atualização"}), 400
        
        # Validar valores
        if 'descricao' in dados and (not dados['descricao'].strip() or len(dados['descricao']) > 500):
            return jsonify({"success": False, "error": "Descrição inválida"}), 400
        
        if 'tipo' in dados and dados['tipo'].lower() not in ['comercial', 'secreto', 'publico']:
            return jsonify({"success": False, "error": "Tipo inválido"}), 400
        
        # Verificar existência do projeto
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT id FROM projetos WHERE id = ?", (projeto_id,))
        if not cursor.fetchone():
            return jsonify({"success": False, "error": f"Projeto {projeto_id} não encontrado"}), 404
        
        # Construir e executar atualização
        campos_set = [f"{campo} = ?" for campo in campos_recebidos]
        valores = [dados[campo] if campo != 'tipo' else dados[campo].lower() for campo in campos_recebidos]
        valores.append(projeto_id)
        
        query = f"UPDATE projetos SET {', '.join(campos_set)} WHERE id = ?"
        cursor.execute(query, valores)
        db.commit()
        
        # Retornar projeto atualizado
        cursor.execute("SELECT * FROM projetos WHERE id = ?", (projeto_id,))
        projeto = cursor.fetchone()
        resultado = {k: projeto[k] for k in projeto.keys()}
        
        print(f"✅ Projeto {projeto_id} atualizado por {username}")
        return jsonify({
            "success": True,
            "message": "Projeto atualizado com sucesso",
            "projeto": resultado
        })
    
    except Exception as e:
        print(f"❌ Erro em /api/projetos/{projeto_id}: {str(e)}")
        return jsonify({"success": False, "error": f"Erro ao atualizar: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica a saúde da API"""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT COUNT(*) FROM projetos")
        projetos_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        usuarios_count = cursor.fetchone()[0]
        
        return jsonify({
            "status": "healthy",
            "projetos_count": projetos_count,
            "usuarios_count": usuarios_count,
            "service": "wayne-industries-api",
            "database": "SQLite"
        })
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    """Handler para endpoints não encontrados"""
    return jsonify({
        "success": False,
        "error": "Endpoint não encontrado",
        "available_endpoints": [
            "GET /",
            "POST /api/login",
            "GET /api/projetos",
            "GET /api/projetos/buscar",
            "PUT /api/projetos/{id}",
            "GET /api/health"
        ]
    }), 404

# ============================================
# CONFIGURAÇÃO DO SERVIDOR
# ============================================

@app.before_first_request
def before_first_request():
    """Inicializa o banco antes da primeira requisição"""
    init_database()

@app.teardown_appcontext
def teardown_db(exception=None):
    """Fecha a conexão com o banco após cada requisição"""
    close_db()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 60)
    print("🚀 Wayne Industries API - Sistema de Projetos")
    print(f"🔗 URL: https://billybulletfortal-github-io-1.onrender.com")
    print(f"📁 Endpoints principais:")
    print(f"   • POST /api/login")
    print(f"   • GET /api/projetos")
    print(f"   • PUT /api/projetos/{{id}} (admin_seguranca)")
    print(f"   • GET /api/health")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=False)
