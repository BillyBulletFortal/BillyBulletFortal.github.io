// sistema.js - Sistema de Gerenciamento de Projetos

const API_BASE_URL = 'https://billybulletfortal-github-io-1.onrender.com/api';

// ============================================
// 1. VERIFICAÇÃO DE AUTENTICAÇÃO
// ============================================

function verificarAutenticacao() {
    const usuarioSalvo = sessionStorage.getItem('usuario_logado');
    
    if (!usuarioSalvo) {
        // Não está logado, redireciona para login
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
        console.error("Erro ao parsear usuário:", e);
        window.location.href = "index.html";
        return null;
    }
}

// ============================================
// 2. CARREGAR E EXIBIR PROJETOS
// ============================================

async function carregarProjetos() {
    const usuario = verificarAutenticacao();
    if (!usuario) return;
    
    try {
        // Faz requisição para API
        const response = await fetch(`${API_BASE_URL}/projetos`);
        const data = await response.json();
        
        if (data.success) {
            renderizarProjetos(data.projetos, usuario);
        } else {
            mostrarMensagem("Erro ao carregar projetos", "erro");
        }
    } catch (error) {
        console.error("Erro:", error);
        mostrarMensagem("Erro de conexão com a API", "erro");
    }
}

// ============================================
// 3. INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos na página sistema.html
    if (window.location.pathname.includes('sistema.html')) {
        const usuario = verificarAutenticacao();
        if (usuario) {
            // Mostra informações do usuário
            const userInfo = document.getElementById('user-info');
            if (userInfo) {
                userInfo.innerHTML = `
                    <span>Usuário: ${usuario.nome} (${usuario.tipo})</span>
                    <button onclick="logout()">Sair</button>
                `;
            }
            
            // Carrega projetos
            carregarProjetos();
        }
    }
});

function logout() {
    sessionStorage.removeItem('usuario_logado');
    window.location.href = "index.html";
}

// Exportar para uso global
window.logout = logout;
