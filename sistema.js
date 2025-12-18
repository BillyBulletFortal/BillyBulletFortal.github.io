// sistema.js - Sistema de Gerenciamento de Projetos Wayne Industries
const API_BASE_URL = 'https://billybulletfortal-github-io-1.onrender.com';

// ============================================
// 1. VERIFICAÇÃO DE AUTENTICAÇÃO
// ============================================

function verificarAutenticacao() {
    const usuarioSalvo = sessionStorage.getItem('usuario_logado');
    
    if (!usuarioSalvo) {
        window.location.href = "index.html";
        return null;
    }
    
    try {
        const usuario = JSON.parse(usuarioSalvo);
        
        if (!usuario.autenticado) {
            window.location.href = "index.html";
            return null;
        }
        
        console.log(`Usuário autenticado: ${usuario.nome} (${usuario.tipo})`);
        return usuario;
        
    } catch (e) {
        console.error("Erro ao verificar autenticação:", e);
        window.location.href = "index.html";
        return null;
    }
}

// ============================================
// 2. CARREGAR PROJETOS DA API
// ============================================

async function carregarProjetos() {
    const usuario = verificarAutenticacao();
    if (!usuario) return;
    
    try {
        console.log(`Carregando projetos da API: ${API_BASE_URL}/api/projetos`);
        const resposta = await fetch(`${API_BASE_URL}/api/projetos`);
        
        if (!resposta.ok) {
            throw new Error(`Erro API: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        
        if (dados.success) {
            console.log(`${dados.count || dados.projetos.length} projetos carregados da API`);
            exibirProjetosFiltrados(dados.projetos, usuario);
        } else {
            alert("Erro ao carregar projetos: " + (dados.error || "Desconhecido"));
        }
        
    } catch (erro) {
        console.error("Erro na conexão com API:", erro);
        alert("Erro de conexão com a API. Tente novamente.");
    }
}

// ============================================
// 3. EXIBIR PROJETOS FILTRADOS (DADOS DA API)
// ============================================

function exibirProjetosFiltrados(projetos, usuario) {
    const resultadoDiv = document.getElementById('resultado');
    const tituloDiv = document.getElementById('titulo-categoria');
    
    if (!resultadoDiv) {
        console.error("Elemento 'resultado' não encontrado!");
        return;
    }
    
    resultadoDiv.innerHTML = '';
    
    let projetosFiltrados = [];
    let titulo = '';
    
    // CORREÇÃO: A API retorna 'secreto' não 'confidencial'
    if (usuario.tipo === 'vendedor') {
        projetosFiltrados = projetos.filter(p => p.tipo === 'publico');
        titulo = 'Projetos Públicos';
        
    } else if (usuario.tipo === 'gerente') {
        projetosFiltrados = projetos.filter(p => 
            p.tipo === 'comercial' || p.tipo === 'publico'
        );
        titulo = 'Projetos Comerciais e Públicos';
        
    } else if (usuario.tipo === 'admin_seguranca') {
        projetosFiltrados = projetos;
        titulo = 'Todos os Projetos';
        
    } else {
        projetosFiltrados = projetos;
        titulo = 'Projetos';
    }
    
    if (tituloDiv) {
        tituloDiv.textContent = titulo;
    }
    
    if (projetosFiltrados.length === 0) {
        resultadoDiv.innerHTML = '<p>Nenhum projeto encontrado na API.</p>';
    } else {
        projetosFiltrados.forEach(projeto => {
            const div = document.createElement('div');
            div.className = 'projeto';
            div.innerHTML = `
                <h3>${projeto.nome}</h3>
                <p>${projeto.descricao}</p>
                <p><strong>Tipo:</strong> ${projeto.tipo}</p>
                <p><strong>Acesso:</strong> ${projeto.nivel_acesso}</p>
                ${usuario.tipo === 'admin_seguranca' ? `<p><small>ID: ${projeto.id}</small></p>` : ''}
            `;
            resultadoDiv.appendChild(div);
        });
    }
    
    console.log(`${usuario.nome} vê ${projetosFiltrados.length} projetos da API`);
}

// ============================================
// 4. FUNÇÕES DE GERENCIAMENTO DE SESSÃO
// ============================================

function realizarLogoff() {
    sessionStorage.removeItem('usuario_logado');
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
}

function logout() {
    realizarLogoff();
}

// ============================================
// 5. INICIALIZAÇÃO DO SISTEMA
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('sistema.html')) {
        return;
    }
    
    const usuario = verificarAutenticacao();
    if (!usuario) return;
    
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <span>Usuário: ${usuario.nome} (${usuario.tipo})</span>
            <button onclick="logout()">Sair</button>
        `;
    }
    
    carregarProjetos();
});

// ============================================
// 6. EXPORTAR FUNÇÕES
// ============================================

window.carregarProjetos = carregarProjetos;
window.realizarLogoff = realizarLogoff;
window.logout = logout;
