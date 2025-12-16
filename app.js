from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import atexit
import hashlib

app = Flask(__name__)

# CORS - permitir seu domínio GitHub Pages
CORS(app, origins=[
    "https://billybulletfortal.github.io",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
])

# Banco em memória para Render Free
USE_IN_MEMORY_DB = False
DATABASE = ':memory:' if USE_IN_MEMORY_DB else '/tmp/database.db'
conn = None
db_initialized = False

# ============================================
# FUNÇÕES DO BANCO DE DADOS
# ============================================

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
    
    # TABELA DE PROJETOS (mantida)
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
    
    # TABELA DE USUÁRIOS (nova)
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
    
    # Verifica se já existem dados
    cursor.execute("SELECT COUNT(*) as count FROM projetos")
    projetos_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) as count FROM usuarios")
    usuarios_count = cursor.fetchone()[0]
    
    # Insere dados de exemplo se tabela de projetos estiver vazia
    if projetos_count == 0:
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
        
        print(f"✅ Tabela 'projetos' inicializada com {len(projetos_exemplo)} registros")
    
    # Insere usuários de exemplo se tabela de usuários estiver vazia
    if usuarios_count == 0:
        usuarios_exemplo = [
            ("vendedor1", "senhavaletudo", "Vendedor 01", "vendedor"),
            ("gerente01", "senhaprecisodeaumento", "Gerente 01", "gerente"),
            ("adminiseg1", "senhabat1234", "Admin Segurança 01", "admin_seguranca")
        ]
        
        for usuario in usuarios_exemplo:
            username, senha, nome, tipo = usuario
            # Cria hash simples da senha (para fins didáticos)
            senha_hash = hashlib.sha256(senha.encode()).hexdigest()
            
            cursor.execute(
                "INSERT INTO usuarios (username, senha_hash, nome, tipo) VALUES (?, ?, ?, ?)",
                (username, senha_hash, nome, tipo)
            )
        
        print(f"✅ Tabela 'usuarios' inicializada com {len(usuarios_exemplo)} registros")
    
    conn.commit()
    print(f"📊 Banco inicializado - Projetos: {projetos_count}, Usuários: {usuarios_count}")
    
    db_initialized = True
    return conn

def get_db_connection():
    """Retorna conexão com o banco, inicializando se necessário"""
    global conn
    if conn is None:
        return init_db()
    return conn

# ============================================
# FUNÇÕES DE AUTENTICAÇÃO
# ============================================

def verificar_usuario(username, senha):
    """Verifica se as credenciais são válidas e retorna dados do usuário"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        senha_hash = hashlib.sha256(senha.encode()).hexdigest()
        
        cursor.execute(
            "SELECT id, username, nome, tipo FROM usuarios WHERE username = ? AND senha_hash = ?",
            (username, senha_hash)
        )
        
        usuario = cursor.fetchone()
        
        if usuario:
            return {
                "id": usuario['id'],
                "username": usuario['username'],
                "nome": usuario['nome'],
                "tipo": usuario['tipo'],
                "autenticado": True
            }
        else:
            return {"autenticado": False, "erro": "Credenciais inválidas"}
    
    except Exception as e:
        print(f"❌ ERRO em verificar_usuario: {str(e)}")
        return {"autenticado": False, "erro": "Erro no servidor"}

def verificar_permissao_admin(usuario_data):
    """Verifica se o usuário é administrador de segurança"""
    return usuario_data.get('autenticado', False) and usuario_data.get('tipo') == 'admin_seguranca'

# ============================================
# MIDDLEWARE E CONFIGURAÇÕES
# ============================================

# Middleware para inicializar DB na primeira requisição
@app.before_request
def initialize_on_first_request():
    """Inicializa o banco na primeira requisição recebida"""
    global db_initialized
    if not db_initialized:
        init_db()

# Fechar conexão ao encerrar
def close_connection():
    global conn
    if conn:
        conn.close()
        print("🔌 Conexão com banco de dados fechada")

atexit.register(close_connection)

# ============================================
# ENDPOINTS DA API
# ============================================

# Rota para verificar status
@app.route('/')
def index():
    return jsonify({
        "status": "API de Projetos está rodando",
        "service": "BillyBulletFortal API",
        "version": "2.0",
        "endpoints": {
            "POST /api/login": "Autenticar usuário",
            "GET /api/projetos": "Obter todos projetos",
            "GET /api/projetos?tipo={tipo}": "Filtrar por tipo",
            "GET /api/projetos/buscar?termo={termo}": "Buscar por termo",
            "PUT /api/projetos/{id}": "Atualizar projeto (apenas admin_seguranca)",
            "GET /api/health": "Verificar saúde da API"
        },
        "note": "Render Free Tier - Banco editável em /tmp/database.db"
    })

# ENDPOINT DE LOGIN
@app.route('/api/login', methods=['POST'])
def login():
    try:
        dados = request.get_json()
        
        if not dados or 'username' not in dados or 'senha' not in dados:
            return jsonify({
                "success": False,
                "error": "Username e senha são obrigatórios"
            }), 400
        
        usuario = verificar_usuario(dados['username'], dados['senha'])
        
        if usuario['autenticado']:
            print(f"✅ Login bem-sucedido: {usuario['nome']} ({usuario['tipo']})")
            
            # Remove o hash da senha da resposta por segurança
            resposta = {k: v for k, v in usuario.items() if k != 'senha_hash'}
            resposta['success'] = True
            
            return jsonify(resposta)
        else:
            print(f"❌ Tentativa de login falhou: {dados['username']}")
            return jsonify({
                "success": False,
                "error": usuario.get('erro', 'Credenciais inválidas')
            }), 401
    
    except Exception as e:
        print(f"❌ ERRO em /api/login: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Erro interno no servidor"
        }), 500

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
                "nivel_acesso": projeto['nivel_acesso'],
                "data_criacao": projeto['data_criacao']
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

# ENDPOINT DE ATUALIZAÇÃO: /api/projetos/<id> - PUT (apenas admin_seguranca)
@app.route('/api/projetos/<int:projeto_id>', methods=['PUT'])
def atualizar_projeto(projeto_id):
    try:
        # 1. Verificar autenticação via cabeçalho
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                "success": False,
                "error": "Token de autenticação necessário"
            }), 401
        
        # Em um sistema real, você validaria um token JWT aqui
        # Para simplificação, vamos usar um esquema básico:
        # Bearer username:senha (codificado em base64)
        
        # 2. Extrair e verificar credenciais
        auth_data = auth_header.replace('Bearer ', '')
        
        # Decodificação básica (para fins didáticos)
        try:
            import base64
            decoded = base64.b64decode(auth_data).decode('utf-8')
            username, senha = decoded.split(':', 1)
        except:
            return jsonify({
                "success": False,
                "error": "Formato de autenticação inválido"
            }), 401
        
        # 3. Verificar usuário e permissão
        usuario = verificar_usuario(username, senha)
        
        if not usuario['autenticado']:
            return jsonify({
                "success": False,
                "error": "Credenciais inválidas"
            }), 401
        
        if not verificar_permissao_admin(usuario):
            return jsonify({
                "success": False,
                "error": "Apenas administradores de segurança podem alterar projetos"
            }), 403
        
        # 4. Obter dados da requisição
        dados = request.get_json()
        
        if not dados:
            return jsonify({
                "success": False,
                "error": "Dados de atualização necessários"
            }), 400
        
        # 5. Validar campos
        campos_permitidos = ['descricao', 'tipo']
        campos_recebidos = list(dados.keys())
        
        # Verifica se há campos não permitidos
        campos_invalidos = [campo for campo in campos_recebidos if campo not in campos_permitidos]
        
        if campos_invalidos:
            return jsonify({
                "success": False,
                "error": f"Campos não permitidos: {', '.join(campos_invalidos)}",
                "campos_permitidos": campos_permitidos
            }), 400
        
        # Valida descrição (se fornecida)
        if 'descricao' in dados:
            nova_descricao = dados['descricao'].strip()
            if not nova_descricao or len(nova_descricao) > 500:
                return jsonify({
                    "success": False,
                    "error": "Descrição inválida (deve ter entre 1 e 500 caracteres)"
                }), 400
        
        # Valida tipo (se fornecido)
        if 'tipo' in dados:
            novoTipo = dados['tipo'].lower()
            if novoTipo not in ['comercial', 'secreto', 'publico']:
                return jsonify({
                    "success": False,
                    "error": "Tipo inválido. Use: 'comercial', 'secreto' ou 'publico'"
                }), 400
        
        # 6. Verificar se o projeto existe
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM projetos WHERE id = ?", (projeto_id,))
        projeto = cursor.fetchone()
        
        if not projeto:
            return jsonify({
                "success": False,
                "error": f"Projeto com ID {projeto_id} não encontrado"
            }), 404
        
        # 7. Construir query de atualização dinâmica
        campos_para_atualizar = []
        valores = []
        
        if 'descricao' in dados:
            campos_para_atualizar.append("descricao = ?")
            valores.append(dados['descricao'])
        
        if 'tipo' in dados:
            campos_para_atualizar.append("tipo = ?")
            valores.append(dados['tipo'].lower())
        
        # Se nenhum campo válido foi fornecido
        if not campos_para_atualizar:
            return jsonify({
                "success": False,
                "error": "Nenhum campo válido para atualização fornecido"
            }), 400
        
        # Adiciona o ID no final dos valores
        valores.append(projeto_id)
        
        # 8. Executar atualização
        query = f"UPDATE projetos SET {', '.join(campos_para_atualizar)} WHERE id = ?"
        cursor.execute(query, valores)
        conn.commit()
        
        # 9. Retornar projeto atualizado
        cursor.execute("SELECT * FROM projetos WHERE id = ?", (projeto_id,))
        projeto_atualizado = cursor.fetchone()
        
        resultado = {
            "id": projeto_atualizado['id'],
            "nome": projeto_atualizado['nome'],
            "descricao": projeto_atualizado['descricao'],
            "tipo": projeto_atualizado['tipo'],
            "nivel_acesso": projeto_atualizado['nivel_acesso'],
            "data_criacao": projeto_atualizado['data_criacao']
        }
        
        print(f"✅ PUT /api/projetos/{projeto_id} - Atualizado por: {usuario['nome']}")
        print(f"   Campos alterados: {', '.join(campos_para_atualizar)}")
        
        return jsonify({
            "success": True,
            "message": "Projeto atualizado com sucesso",
            "projeto": resultado,
            "atualizado_por": usuario['nome']
        })
    
    except Exception as e:
        print(f"❌ ERRO em /api/projetos/{projeto_id}: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Erro ao atualizar projeto: {str(e)}"
        }), 500

# Rota de saúde
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM projetos")
        projetos_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        usuarios_count = cursor.fetchone()[0]
        
        return jsonify({
            "status": "healthy",
            "projetos_count": projetos_count,
            "usuarios_count": usuarios_count,
            "service": "billybulletfortal-github-io-1",
            "database": "SQLite em memória" if USE_IN_MEMORY_DB else "SQLite em arquivo",
            "initialized": db_initialized,
            "endpoints_ativos": {
                "GET /api/projetos": "Funcional",
                "PUT /api/projetos/{id}": "Funcional (apenas admin_seguranca)",
                "POST /api/login": "Funcional"
            }
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
        "available_endpoints": [
            "/",
            "/api/login (POST)",
            "/api/projetos (GET)",
            "/api/projetos/buscar (GET)",
            "/api/projetos/{id} (PUT)",
            "/api/health (GET)"
        ]
    }), 404

# ============================================
# INICIALIZAÇÃO DO SERVIDOR
# ============================================

if __name__ == '__main__':
    # Inicializa o banco antes de iniciar o servidor
    init_db()
    
    port = int(os.environ.get('PORT', 5000))
    
    print("=" * 60)
    print("🚀 Iniciando API de Projetos - BillyBulletFortal v2.0")
    print(f"🔗 URL: https://billybulletfortal-github-io-1.onrender.com")
    print(f"📁 Endpoint principal: /api/projetos")
    print(f"🔐 Endpoint de login: /api/login")
    print(f"✏️  Endpoint de edição: /api/projetos/{{id}} (PUT - apenas admin_seguranca)")
    print(f"🩺 Health check: /api/health")
    print(f"🔧 Banco de dados: {'Memória' if USE_IN_MEMORY_DB else 'Arquivo (/tmp/database.db)'}")
    print(f"🌐 CORS permitido para: https://billybulletfortal.github.io")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=False)
