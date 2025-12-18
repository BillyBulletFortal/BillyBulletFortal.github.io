"""
API Wayne Industries - Sistema de Projetos
Versão simplificada para trabalho acadêmico
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import hashlib

# ============================================
# 1. CONFIGURAÇÃO INICIAL
# ============================================

app = Flask(__name__)

# Configuração CORS - Permitir frontend do GitHub Pages
CORS(app, origins=[
    "https://billybulletfortal.github.io",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
])

# Caminho do banco de dados
DATABASE = '/tmp/wayne_industries.db'

# ============================================
# 2. FUNÇÕES DO BANCO DE DADOS
# ============================================

def criar_conexao():
    """Cria conexão com o banco de dados"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def criar_tabelas():
    """Cria as tabelas se não existirem"""
    conn = criar_conexao()
    cursor = conn.cursor()
    
    # Tabela de projetos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projetos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT NOT NULL,
            tipo TEXT CHECK(tipo IN ('comercial', 'secreto', 'publico')),
            nivel_acesso TEXT NOT NULL
        )
    ''')
    
    # Tabela de usuários
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            nome TEXT NOT NULL,
            tipo TEXT CHECK(tipo IN ('vendedor', 'gerente', 'admin_seguranca'))
        )
    ''')
    
    # Verifica se já tem dados
    cursor.execute("SELECT COUNT(*) FROM projetos")
    projetos_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM usuarios")
    usuarios_count = cursor.fetchone()[0]
    
    # Insere projetos de exemplo se tabela estiver vazia
    if projetos_count == 0:
        projetos = [
            ("Site E-commerce", "Loja virtual com carrinho de compras", "comercial", "Restrito"),
            ("Projeto Alpha", "Desenvolvimento de IA", "secreto", "Confidencial"),
            ("Portal do Cidadão", "Serviços públicos online", "publico", "Público")
        ]
        
        for projeto in projetos:
            cursor.execute(
                "INSERT INTO projetos (nome, descricao, tipo, nivel_acesso) VALUES (?, ?, ?, ?)",
                projeto
            )
        print("✅ Projetos de exemplo inseridos")
    
    # Insere usuários de exemplo se tabela estiver vazia
    if usuarios_count == 0:
        usuarios = [
            ("vendedor1", hashlib.sha256("valetudo".encode()).hexdigest(), "Vendedor 01", "vendedor"),
            ("gerente01", hashlib.sha256("precisodeaumento".encode()).hexdigest(), "Gerente 01", "gerente"),
            ("adminiseg1", hashlib.sha256("bat1234".encode()).hexdigest(), "Admin Segurança 01", "admin_seguranca")
        ]
        
        for usuario in usuarios:
            cursor.execute(
                "INSERT INTO usuarios (username, senha_hash, nome, tipo) VALUES (?, ?, ?, ?)",
                usuario
            )
        print("✅ Usuários de exemplo inseridos")
    
    conn.commit()
    conn.close()
    print("📊 Banco de dados pronto para uso")

# ============================================
# 3. FUNÇÕES DE AUTENTICAÇÃO
# ============================================

def verificar_login(username, senha):
    """Verifica se usuário e senha são válidos"""
    try:
        conn = criar_conexao()
        cursor = conn.cursor()
        
        # Cria o hash da senha para comparar
        senha_hash = hashlib.sha256(senha.encode()).hexdigest()
        
        cursor.execute(
            "SELECT id, username, nome, tipo FROM usuarios WHERE username = ? AND senha_hash = ?",
            (username, senha_hash)
        )
        
        usuario = cursor.fetchone()
        conn.close()
        
        if usuario:
            return {
                "success": True,
                "id": usuario['id'],
                "username": usuario['username'],
                "nome": usuario['nome'],
                "tipo": usuario['tipo']
            }
        else:
            return {"success": False, "error": "Usuário ou senha incorretos"}
            
    except Exception as e:
        print(f"❌ Erro no login: {e}")
        return {"success": False, "error": "Erro no servidor"}

def verificar_admin(username, senha):
    """Verifica se o usuário é administrador"""
    resultado = verificar_login(username, senha)
    if resultado['success'] and resultado['tipo'] == 'admin_seguranca':
        return True
    return False

# ============================================
# 4. ENDPOINTS DA API
# ============================================

@app.route('/')
def pagina_inicial():
    """Página inicial da API"""
    return jsonify({
        "status": "API Wayne Industries Online",
        "endpoints": {
            "POST /api/login": "Fazer login",
            "GET /api/projetos": "Ver projetos",
            "GET /api/projetos?tipo=TIPO": "Filtrar projetos",
            "PUT /api/projetos/ID": "Editar projeto (admin)"
        }
    })

@app.route('/api/login', methods=['POST'])
def login():
    """Endpoint para fazer login"""
    try:
        dados = request.get_json()
        
        if not dados or 'username' not in dados or 'senha' not in dados:
            return jsonify({
                "success": False,
                "error": "Informe usuário e senha"
            }), 400
        
        resultado = verificar_login(dados['username'], dados['senha'])
        
        if resultado['success']:
            print(f"✅ Login: {resultado['nome']} ({resultado['tipo']})")
            return jsonify(resultado)
        else:
            print(f"❌ Login falhou: {dados['username']}")
            return jsonify(resultado), 401
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return jsonify({
            "success": False,
            "error": "Erro no servidor"
        }), 500

@app.route('/api/projetos', methods=['GET'])
def listar_projetos():
    """Retorna lista de projetos"""
    try:
        tipo = request.args.get('tipo', '').lower()
        
        conn = criar_conexao()
        cursor = conn.cursor()
        
        if tipo in ['comercial', 'secreto', 'publico']:
            cursor.execute("SELECT * FROM projetos WHERE tipo = ?", (tipo,))
        else:
            cursor.execute("SELECT * FROM projetos")
        
        projetos = cursor.fetchall()
        conn.close()
        
        # Converte para lista de dicionários
        lista_projetos = []
        for projeto in projetos:
            lista_projetos.append({
                "id": projeto['id'],
                "nome": projeto['nome'],
                "descricao": projeto['descricao'],
                "tipo": projeto['tipo'],
                "nivel_acesso": projeto['nivel_acesso']
            })
        
        return jsonify({
            "success": True,
            "projetos": lista_projetos,
            "total": len(lista_projetos)
        })
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return jsonify({
            "success": False,
            "error": "Erro ao buscar projetos"
        }), 500

@app.route('/api/projetos/<int:projeto_id>', methods=['PUT'])
def editar_projeto(projeto_id):
    """Edita um projeto (apenas admin)"""
    try:
        # Verifica autenticação básica (simplificada)
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Basic '):
            return jsonify({
                "success": False,
                "error": "Autenticação necessária"
            }), 401
        
        # Extrai usuário e senha (formato: Basic base64(username:password))
        import base64
        auth_data = auth_header.replace('Basic ', '')
        decoded = base64.b64decode(auth_data).decode('utf-8')
        username, senha = decoded.split(':', 1)
        
        # Verifica se é admin
        if not verificar_admin(username, senha):
            return jsonify({
                "success": False,
                "error": "Apenas administradores podem editar"
            }), 403
        
        # Processa os dados
        dados = request.get_json()
        
        if not dados or 'descricao' not in dados:
            return jsonify({
                "success": False,
                "error": "Informe a nova descrição"
            }), 400
        
        # Atualiza no banco
        conn = criar_conexao()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE projetos SET descricao = ? WHERE id = ?",
            (dados['descricao'], projeto_id)
        )
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({
                "success": False,
                "error": "Projeto não encontrado"
            }), 404
        
        conn.commit()
        conn.close()
        
        print(f"✅ Projeto {projeto_id} editado por {username}")
        
        return jsonify({
            "success": True,
            "message": "Projeto atualizado com sucesso"
        })
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return jsonify({
            "success": False,
            "error": "Erro ao editar projeto"
        }), 500

@app.route('/api/health', methods=['GET'])
def verificar_saude():
    """Verifica se a API está funcionando"""
    try:
        conn = criar_conexao()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM projetos")
        projetos = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        usuarios = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            "status": "online",
            "projetos": projetos,
            "usuarios": usuarios
        })
        
    except Exception as e:
        return jsonify({
            "status": "erro",
            "mensagem": str(e)
        }), 500

# ============================================
# 5. INICIALIZAÇÃO
# ============================================

# Cria tabelas quando o servidor inicia
criar_tabelas()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 50)
    print("🚀 API Wayne Industries - Sistema de Projetos")
    print(f"🔗 Endpoint login: POST /api/login")
    print(f"🔗 Endpoint projetos: GET /api/projetos")
    print(f"🔗 Edição projetos: PUT /api/projetos/ID (apenas admin)")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=port, debug=False)
