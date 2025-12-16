// sistema.js - Sistema de Gerenciamento de Projetos com Controle de Acesso
// Configurações
const API_BASE_URL = 'https://billybulletfortal-github-io-1.onrender.com/api';
const TIPOS_PERMITIDOS = ['secreto', 'comercial', 'público'];

// Estado da aplicação
let usuarioLogado = null;
let projetos = [];

// Elementos DOM
const projetosContainer = document.getElementById('projetos-container');
const loadingElement = document.getElementById('loading');
const mensagemElement = document.getElementById('mensagem');

// ============================================
// 1. FUNÇÕES DE AUTENTICAÇÃO E CONTROLE DE ACESSO
// ============================================

/**
 * Configura o usuário logado (chamado após login)
 * @param {Object} usuario - Objeto com dados do usuário
 */
function configurarUsuario(usuario) {
    usuarioLogado = usuario;
    console.log(`Usuário configurado: ${usuario.nome}, Tipo: ${usuario.tipo}`);
    
    // Mostrar nome do usuário na interface (opcional)
    const userBadge = document.getElementById('user-badge');
    if (userBadge) {
        userBadge.textContent = `${usuario.nome} (${usuario.tipo})`;
    }
}

/**
 * Verifica se o usuário atual é administrador de segurança
 * @returns {boolean} - True se for admin de segurança
 */
function isAdminSeguranca() {
    return usuarioLogado && usuarioLogado.tipo === 'admin_seguranca';
}

/**
 * Mostra mensagem de erro/sucesso
 */
function mostrarMensagem(texto, tipo = 'info') {
    if (mensagemElement) {
        mensagemElement.textContent = texto;
        mensagemElement.className = `mensagem ${tipo}`;
        mensagemElement.style.display = 'block';
        
        setTimeout(() => {
            mensagemElement.style.display = 'none';
        }, 5000);
    }
}

// ============================================
// 2. FUNÇÕES PARA BUSCAR E RENDERIZAR PROJETOS
// ============================================

/**
 * Busca projetos da API
 */
async function carregarProjetos() {
    try {
        if (loadingElement) loadingElement.style.display = 'block';
        
        const response = await fetch(`${API_BASE_URL}/projetos`);
        const data = await response.json();
        
        if (data.success) {
            projetos = data.projetos;
            renderizarProjetos();
        } else {
            mostrarMensagem('Erro ao carregar projetos', 'erro');
        }
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        mostrarMensagem('Erro de conexão com a API', 'erro');
    } finally {
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

/**
 * Renderiza todos os projetos na tela
 */
function renderizarProjetos() {
    if (!projetosContainer) return;
    
    projetosContainer.innerHTML = '';
    
    if (projetos.length === 0) {
        projetosContainer.innerHTML = '<p class="sem-projetos">Nenhum projeto encontrado</p>';
        return;
    }
    
    projetos.forEach(projeto => {
        const projetoCard = criarCardProjeto(projeto);
        projetosContainer.appendChild(projetoCard);
    });
}

/**
 * Cria o card HTML para um projeto
 */
function criarCardProjeto(projeto) {
    const card = document.createElement('div');
    card.className = 'projeto-card';
    card.dataset.id = projeto.id;
    
    // Define cor baseada no tipo
    const tipoClass = {
        'secreto': 'tipo-secreto',
        'comercial': 'tipo-comercial', 
        'público': 'tipo-publico'
    }[projeto.tipo] || '';
    
    card.innerHTML = `
        <div class="projeto-header ${tipoClass}">
            <h3 class="projeto-nome">${projeto.nome}</h3>
            <span class="projeto-tipo">${projeto.tipo.toUpperCase()}</span>
        </div>
        <div class="projeto-body">
            <p class="projeto-descricao">${projeto.descricao}</p>
            <div class="projeto-info">
                <span class="nivel-acesso">🔒 ${projeto.nivel_acesso}</span>
                <span class="data-criacao">📅 ${formatarData(projeto.data_criacao)}</span>
            </div>
        </div>
        <div class="projeto-footer">
            <!-- Botão Alterar (visível apenas para admin_seguranca) -->
            <button class="btn-alterar" onclick="iniciarEdicao(${projeto.id})">
                ✏️ Alterar
            </button>
        </div>
    `;
    
    return card;
}

/**
 * Formata data para exibição
 */
function formatarData(dataString) {
    if (!dataString) return 'Data desconhecida';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// ============================================
// 3. FUNÇÕES DE EDIÇÃO (APENAS ADMIN_SEGURANCA)
// ============================================

/**
 * Inicia o modo de edição para um projeto
 */
function iniciarEdicao(projetoId) {
    // Verifica permissão
    if (!isAdminSeguranca()) {
        mostrarMensagem('❌ Não autorizado. Apenas administradores de segurança podem alterar projetos.', 'erro');
        return;
    }
    
    // Encontra o projeto
    const projeto = projetos.find(p => p.id === projetoId);
    if (!projeto) {
        mostrarMensagem('Projeto não encontrado', 'erro');
        return;
    }
    
    // Encontra o card do projeto
    const card = document.querySelector(`.projeto-card[data-id="${projetoId}"]`);
    if (!card) return;
    
    // Substitui o conteúdo do card pelo formulário de edição
    card.innerHTML = `
        <div class="edicao-container">
            <h4>✏️ Editando: ${projeto.nome}</h4>
            
            <div class="form-group">
                <label for="descricao-${projetoId}">Nova Descrição:</label>
                <textarea 
                    id="descricao-${projetoId}" 
                    class="campo-descricao"
                    rows="3"
                    maxlength="500"
                >${projeto.descricao}</textarea>
                <small class="contador-caracteres">0/500 caracteres</small>
            </div>
            
            <div class="form-group">
                <label for="tipo-${projetoId}">Novo Tipo:</label>
                <select id="tipo-${projetoId}" class="campo-tipo">
                    ${TIPOS_PERMITIDOS.map(tipo => `
                        <option value="${tipo}" ${tipo === projeto.tipo ? 'selected' : ''}>
                            ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="botoes-edicao">
                <button class="btn-salvar" onclick="salvarAlteracoes(${projetoId})">
                    💾 Salvar Alterações
                </button>
                <button class="btn-cancelar" onclick="cancelarEdicao(${projetoId})">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `;
    
    // Configura contador de caracteres
    const textarea = document.getElementById(`descricao-${projetoId}`);
    const contador = card.querySelector('.contador-caracteres');
    
    textarea.addEventListener('input', function() {
        contador.textContent = `${this.value.length}/500 caracteres`;
    });
    
    // Inicializa contador
    contador.textContent = `${textarea.value.length}/500 caracteres`;
}

/**
 * Salva as alterações no servidor
 */
async function salvarAlteracoes(projetoId) {
    if (!isAdminSeguranca()) {
        mostrarMensagem('Permissão negada', 'erro');
        return;
    }
    
    const novaDescricao = document.getElementById(`descricao-${projetoId}`).value.trim();
    const novoTipo = document.getElementById(`tipo-${projetoId}`).value;
    
    // Validações
    if (!novaDescricao) {
        mostrarMensagem('A descrição não pode estar vazia', 'erro');
        return;
    }
    
    if (!TIPOS_PERMITIDOS.includes(novoTipo)) {
        mostrarMensagem('Tipo inválido selecionado', 'erro');
        return;
    }
    
    try {
        mostrarMensagem('Salvando alterações...', 'info');
        
        // ATENÇÃO: Você precisará implementar este endpoint no app.py
        const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                descricao: novaDescricao,
                tipo: novoTipo
            })
        });
        
        const data = await.response.json();
        
        if (data.success) {
            mostrarMensagem('✅ Alterações salvas com sucesso!', 'sucesso');
            
            // Atualiza o projeto localmente
            const projetoIndex = projetos.findIndex(p => p.id === projetoId);
            if (projetoIndex !== -1) {
                projetos[projetoIndex].descricao = novaDescricao;
                projetos[projetoIndex].tipo = novoTipo;
            }
            
            // Recarrega a lista (ou pode apenas atualizar o card específico)
            carregarProjetos();
        } else {
            mostrarMensagem(`❌ Erro: ${data.error || 'Falha ao salvar'}`, 'erro');
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        mostrarMensagem('❌ Erro de conexão ao salvar', 'erro');
    }
}

/**
 * Cancela a edição e volta ao card normal
 */
function cancelarEdicao(projetoId) {
    // Encontra o projeto original
    const projeto = projetos.find(p => p.id === projetoId);
    if (!projeto) return;
    
    // Recria o card
    const card = document.querySelector(`.projeto-card[data-id="${projetoId}"]`);
    if (card) {
        const novoCard = criarCardProjeto(projeto);
        card.parentNode.replaceChild(novoCard, card);
    }
    
    mostrarMensagem('Edição cancelada', 'info');
}

// ============================================
// 4. INICIALIZAÇÃO DO SISTEMA
// ============================================

/**
 * Inicializa o sistema
 */
function inicializarSistema() {
    console.log('Sistema de gerenciamento de projetos inicializando...');
    
    // 1. Verificar se há usuário logado (você precisa integrar com seu auth.js)
    const usuarioSalvo = localStorage.getItem('usuario_logado');
    if (usuarioSalvo) {
        try {
            configurarUsuario(JSON.parse(usuarioSalvo));
        } catch (e) {
            console.error('Erro ao parsear usuário:', e);
        }
    }
    
    // 2. Carregar projetos
    carregarProjetos();
    
    // 3. Configurar eventos (se necessário)
    configurarEventos();
}

/**
 * Configura eventos adicionais
 */
function configurarEventos() {
    // Exemplo: Botão para recarregar projetos
    const btnRecarregar = document.getElementById('btn-recarregar');
    if (btnRecarregar) {
        btnRecarregar.addEventListener('click', carregarProjetos);
    }
}
