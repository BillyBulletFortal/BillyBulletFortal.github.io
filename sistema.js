// sistema.js - Trabalho de Curso com Autenticação
// Versão atualizada para verificar login e mostrar informações do usuário

document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // 1. VERIFICAÇÃO DE LOGIN
    // ============================================
    
    // Recupera os dados do usuário da sessionStorage
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    
    // Se não houver usuário logado, volta para a página de login
    if (!usuarioLogado) {
        alert('Por favor, faça login primeiro.');
        window.location.href = 'index.html';
        return; // Para a execução do resto do código
    }
    
    // ============================================
    // 2. CONFIGURAÇÕES DA API
    // ============================================
    
    // URL da sua API no Render (substitua pela sua URL real se for diferente)
    const API_URL = 'https://billybulletfortal-github-io-1.onrender.com/api';
    
    // ============================================
    // 3. EXIBIR INFORMAÇÕES DO USUÁRIO LOGADO
    // ============================================
    
    // Cria um elemento para mostrar quem está logado
    function mostrarUsuarioLogado() {
        // Tenta encontrar onde colocar a informação do usuário
        const header = document.querySelector('header') || document.body;
        
        // Cria a div de informações do usuário
        const userInfoDiv = document.createElement('div');
        userInfoDiv.id = 'user-info';
        userInfoDiv.style.cssText = `
            background-color: #f8f9fa;
            padding: 10px 15px;
            border-bottom: 1px solid #dee2e6;
            font-size: 14px;
            color: #495057;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        // Texto com informações do usuário
        const userText = document.createElement('span');
        userText.innerHTML = `👤 Logado como: <strong>${usuarioLogado.nome}</strong> (${usuarioLogado.tipo})`;
        
        // Botão de logout
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Sair';
        logoutBtn.style.cssText = `
            background-color: #6c757d;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        logoutBtn.onclick = function() {
            // Remove os dados do usuário
            sessionStorage.removeItem('usuarioLogado');
            // Redireciona para o login
            window.location.href = 'index.html';
        };
        
        // Adiciona os elementos
        userInfoDiv.appendChild(userText);
        userInfoDiv.appendChild(logoutBtn);
        
        // Insere no início da página
        if (header === document.body) {
            document.body.insertBefore(userInfoDiv, document.body.firstChild);
        } else {
            header.insertBefore(userInfoDiv, header.firstChild);
        }
        
        // Mostra mensagem de boas-vindas no console também
        console.log(`Bem-vindo, ${usuarioLogado.nome} (${usuarioLogado.tipo})!`);
    }
    
    // ============================================
    // 4. FUNÇÕES PARA CONSUMIR A API (DO CÓDIGO ORIGINAL)
    // ============================================
    
    // Função para buscar dados da API
    async function buscarDadosDaAPI(endpoint) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            return null;
        }
    }
    
    // Função para exibir dados na página
    function exibirDados(dados, elementoId) {
        const elemento = document.getElementById(elementoId);
        if (!elemento || !dados) return;
        
        // Converte os dados para string JSON formatada
        elemento.textContent = JSON.stringify(dados, null, 2);
    }
    
    // ============================================
    // 5. EXIBIR CONTEÚDO BASEADO NO TIPO DE USUÁRIO
    // ============================================
    
    function mostrarConteudoPorTipoUsuario() {
        const mensagemTipo = document.createElement('div');
        mensagemTipo.id = 'tipo-usuario-mensagem';
        mensagemTipo.style.cssText = `
            margin: 15px;
            padding: 10px;
            border-radius: 5px;
            font-weight: bold;
        `;
        
        // Define cor e mensagem baseado no tipo de usuário
        switch(usuarioLogado.tipo) {
            case 'VENDEDOR':
                mensagemTipo.style.backgroundColor = '#d4edda';
                mensagemTipo.style.color = '#155724';
                mensagemTipo.textContent = '🔸 PERFIL VENDEDOR: Você tem acesso às funções de venda e visualização de produtos.';
                break;
                
            case 'GERENTE':
                mensagemTipo.style.backgroundColor = '#cce5ff';
                mensagemTipo.style.color = '#004085';
                mensagemTipo.textContent = '🔷 PERFIL GERENTE: Você tem acesso completo aos relatórios e gestão da equipe.';
                break;
                
            case 'ADMINISTRADOR_SEGURANCA':
                mensagemTipo.style.backgroundColor = '#f8d7da';
                mensagemTipo.style.color = '#721c24';
                mensagemTipo.textContent = '🔴 PERFIL ADMINISTRADOR DE SEGURANÇA: Você tem acesso total ao sistema, incluindo configurações de segurança.';
                break;
                
            default:
                mensagemTipo.style.backgroundColor = '#fff3cd';
                mensagemTipo.style.color = '#856404';
                mensagemTipo.textContent = '⚠ PERFIL DESCONHECIDO';
        }
        
        // Encontra um bom lugar para inserir a mensagem
        const userInfoDiv = document.getElementById('user-info');
        if (userInfoDiv && userInfoDiv.nextSibling) {
            userInfoDiv.parentNode.insertBefore(mensagemTipo, userInfoDiv.nextSibling);
        } else {
            document.body.insertBefore(mensagemTipo, document.body.firstChild);
        }
    }
    
    // ============================================
    // 6. INICIALIZAÇÃO DO SISTEMA
    // ============================================
    
    // Executa quando a página carrega
    function inicializarSistema() {
        // 1. Mostra quem está logado
        mostrarUsuarioLogado();
        
        // 2. Mostra conteúdo específico por tipo de usuário
        mostrarConteudoPorTipoUsuario();
        
        // 3. Mantém a funcionalidade original da API
        console.log('Sistema inicializado para:', usuarioLogado.username);
        
        // 4. Exemplo de uso da API (mantendo sua lógica original)
        // Você pode manter suas chamadas de API originais aqui
        
        // Exemplo: buscar dados da API quando a página carrega
        buscarDadosDaAPI('/api/dados')
            .then(dados => {
                if (dados) {
                    console.log('Dados recebidos da API:', dados);
                    
                    // Se você tiver um elemento para mostrar os dados
                    const dadosContainer = document.getElementById('dados-api');
                    if (dadosContainer) {
                        exibirDados(dados, 'dados-api');
                    }
                    
                    // Pode também mostrar em um alerta formatado
                    if (usuarioLogado.tipo === 'GERENTE' || usuarioLogado.tipo === 'ADMINISTRADOR_SEGURANCA') {
                        console.log('Usuário com perfil elevado tem acesso completo aos dados.');
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao carregar dados iniciais:', error);
            });
    }
    
    // ============================================
    // 7. FUNÇÕES AUXILIARES PARA TESTES
    // ============================================
    
    // Função para testar diferentes endpoints da API
    window.testarEndpoint = function(endpoint) {
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        
        buscarDadosDaAPI(endpoint)
            .then(dados => {
                alert(`Dados de ${endpoint}:\n${JSON.stringify(dados, null, 2)}`);
            })
            .catch(error => {
                alert(`Erro ao acessar ${endpoint}: ${error.message}`);
            });
    };
    
    // Função para ver informações da sessão (útil para debug)
    window.mostrarInfoSessao = function() {
        const info = {
            usuarioLogado: usuarioLogado,
            sessionStorage: sessionStorage.getItem('usuarioLogado'),
            timestamp: new Date().toLocaleString()
        };
        
        console.log('Informações da sessão:', info);
        alert(`Usuário: ${usuarioLogado.nome}\nTipo: ${usuarioLogado.tipo}\nLogin em: ${info.timestamp}`);
    };
    
    // ============================================
    // 8. INICIALIZAR TUDO
    // ============================================
    
    // Inicia o sistema
    inicializarSistema();
    
    // Adiciona um listener para atualizar a cada 30 segundos (opcional)
    setInterval(() => {
        console.log('Sistema ativo - Usuário:', usuarioLogado.username);
    }, 30000);
});
