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
        
        console.log(`Usuário: ${usuario.nome} (${usuario.tipo})`);
        return usuario;
        
    } catch (e) {
        console.error("Erro:", e);
        window.location.href = "index.html";
        return null;
    }
}

// ============================================
// 2. EXIBIR PROJETOS FILTRADOS
// ============================================

function exibirProjetosFiltrados(projetos, usuario) {
    const resultadoDiv = document.getElementById('resultado');
    const tituloDiv = document.getElementById('titulo-categoria');
    
    if (!resultadoDiv) {
        console.error("Elemento 'resultado' não encontrado!");
        return;
    }
    
    // Limpa resultados anteriores
    resultadoDiv.innerHTML = '';
    
    // Filtra projetos conforme tipo de usuário
    let projetosFiltrados = [];
    let titulo = '';
    
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
    
    // Atualiza título
    if (tituloDiv) {
        tituloDiv.textContent = titulo;
    }
    
    // Exibe projetos
    if (projetosFiltrados.length === 0) {
        resultadoDiv.innerHTML = '<p>Nenhum projeto encontrado.</p>';
    } else {
        projetosFiltrados.forEach(projeto => {
            const div = document.createElement('div');
            div.className = 'projeto';
            div.innerHTML = `
                <h3>${projeto.nome}</h3>
                <p>${projeto.descricao}</p>
                <p><strong>Tipo:</strong> ${projeto.tipo}</p>
                <p><strong>Acesso:</strong> ${projeto.nivel_acesso}</p>
            `;
            resultadoDiv.appendChild(div);
        });
    }
    
    console.log(`${usuario.nome} vê ${projetosFiltrados.length} projetos`);
}

// ============================================
// 3. CARREGAR PROJETOS DA API
// ============================================

async function carregarProjetos() {
    const usuario = verificarAutenticacao();
    if (!usuario) return;
    
    try {
        // Busca projetos da API
        const resposta = await fetch(`${API_BASE_URL}/api/projetos`);
        
        if (!resposta.ok) {
            throw new Error(`Erro API: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        
        if (dados.success) {
            exibirProjetosFiltrados(dados.projetos, usuario);
        } else {
            alert("Erro ao carregar projetos: " + (dados.error || "Desconhecido"));
        }
        
    } catch (erro) {
        console.error("Erro:", erro);
        alert("Erro de conexão com a API. Tente novamente.");
    }
}

// ============================================
// 4. INICIALIZAÇÃO DO SISTEMA
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Verifica se está na página sistema.html
    if (!window.location.pathname.includes('sistema.html')) {
        return;
    }
    
    const usuario = verificarAutenticacao();
    if (!usuario) return;
    
    // Mostra informações do usuário (se houver elemento)
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <span>Usuário: ${usuario.nome} (${usuario.tipo})</span>
            <button onclick="logout()">Sair</button>
        `;
    }
    
    // Carrega projetos
    carregarProjetos();
    
    // Configura botões de filtro (se existirem)
    configurarFiltros();
});

// ============================================
// 5. FUNÇÕES AUXILIARES
// ============================================

function configurarFiltros() {
    // Se houver botões de filtro, configure-os aqui
    const botoesFiltro = document.querySelectorAll('.aba');
    if (botoesFiltro.length > 0) {
        botoesFiltro.forEach(botao => {
            botao.addEventListener('click', function() {
                // Lógica de filtro pode ser adicionada depois
                console.log("Filtrar por:", this.dataset.categoria);
            });
        });
    }
}

function logout() {
    sessionStorage.removeItem('usuario_logado');
    window.location.href = "index.html";
}

// Torna logout acessível globalmente
window.logout = logout;
