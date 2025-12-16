// sistema.js - Trabalho de Curso com Autenticação ÚNICA
// Apenas este arquivo verifica o login e aplica as permissões

document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // 1. VERIFICAÇÃO ÚNICA DE LOGIN
    // ============================================
    
    // Recupera os dados do usuário da sessionStorage
    // APENAS UMA CHAVE é verificada: 'usuarioLogado'
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    
    // Se não houver usuário logado, volta para a página de login
    if (!usuarioLogado) {
        alert('Por favor, faça login primeiro.');
        window.location.href = 'index.html';
        return; // Para a execução do resto do código
    }
    
    // ============================================
    // 2. APLICAR PERMISSÕES POR TIPO DE USUÁRIO
    // ============================================
    
    function aplicarPermissoes() {
        const abas = document.querySelectorAll('.navegacao .aba');
        const permissoes = usuarioLogado.permissoes;
        
        console.log(`Aplicando permissões para ${usuarioLogado.tipo}:`, permissoes);
        
        // Para cada aba, verifica se o usuário tem permissão
        abas.forEach(aba => {
            const categoria = aba.getAttribute('data-categoria');
            let permitido = false;
            
            // Verifica permissões baseado no tipo de usuário
            if (usuarioLogado.tipo === 'VENDEDOR') {
                permitido = (categoria === 'publico');
            } else if (usuarioLogado.tipo === 'GERENTE') {
                permitido = (categoria === 'comercial' || categoria === 'publico');
            } else if (usuarioLogado.tipo === 'ADMINISTRADOR_SEGURANCA') {
                permitido = true; // Admin vê tudo
            }
            
            // Aplica ou remove a visibilidade
            if (!permitido) {
                aba.style.display = 'none';
                console.log(`Ocultando aba: ${categoria}`);
            } else {
                aba.style.display = 'inline-block';
            }
        });
        
        // Mostra mensagem de permissão
        mostrarMensagemPermissao();
    }
    
    function mostrarMensagemPermissao() {
        const mensagem = document.createElement('div');
        mensagem.id = 'mensagem-permissao';
        mensagem.style.cssText = `
            background-color: #e9f7fe;
            padding: 10px 15px;
            margin: 10px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
            font-size: 14px;
        `;
        
        let texto = '';
        if (usuarioLogado.tipo === 'VENDEDOR') {
            texto = '🔸 PERFIL VENDEDOR: Você tem acesso apenas a "projetos públicos".';
        } else if (usuarioLogado.tipo === 'GERENTE') {
            texto = '🔷 PERFIL GERENTE: Você tem acesso a "projetos comerciais" e "projetos públicos".';
        } else if (usuarioLogado.tipo === 'ADMINISTRADOR_SEGURANCA') {
            texto = '🔴 ADMINISTRADOR DE SEGURANÇA: Você tem acesso a todos os processos.';
        }
        
        mensagem.innerHTML = `<strong>${texto}</strong>`;
        
        // Insere a mensagem após o header
        const header = document.querySelector('header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(mensagem, header.nextSibling);
        }
    }
    
    // ============================================
    // 3. MOSTRAR INFORMAÇÕES DO USUÁRIO
    // ============================================
    
    function mostrarUsuarioLogado() {
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
        
        const userText = document.createElement('span');
        userText.innerHTML = `👤 Logado como: <strong>${usuarioLogado.nome}</strong> (${usuarioLogado.tipo})`;
        
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
            sessionStorage.removeItem('usuarioLogado');
            window.location.href = 'index.html';
        };
        
        userInfoDiv.appendChild(userText);
        userInfoDiv.appendChild(logoutBtn);
        
        // Insere no início do body
        document.body.insertBefore(userInfoDiv, document.body.firstChild);
    }
    
    // ============================================
    // 4. INICIALIZAÇÃO DO SISTEMA
    // ============================================
    
    function inicializarSistema() {
        // 1. Mostra quem está logado
        mostrarUsuarioLogado();
        
        // 2. Aplica as permissões
        aplicarPermissoes();
        
        // 3. Mantém a funcionalidade original (seu código de API, etc.)
        console.log('Sistema inicializado para:', usuarioLogado.username);
        
        // SEU CÓDIGO ORIGINAL AQUI (chamadas à API, etc.)
        // ...
    }
    
    // Inicia o sistema
    inicializarSistema();
});
