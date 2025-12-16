// sistema.js - Trabalho de Curso com Autenticação ÚNICA e API
document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // 1. VERIFICAÇÃO ÚNICA DE LOGIN
    // ============================================
    
    // Recupera os dados do usuário da sessionStorage
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    
    // Se não houver usuário logado, volta para a página de login
    if (!usuarioLogado) {
        alert('Por favor, faça login primeiro.');
        window.location.href = 'index.html';
        return;
    }
    
    // ============================================
    // 2. VARIÁVEIS GLOBAIS DA API
    // ============================================
    
    const resultado = document.querySelector("#resultado");
    const pesquisa = document.querySelector("#pesquisa");
    const tituloCategoria = document.querySelector("#titulo-categoria");
    const abas = document.querySelectorAll(".aba");
    
    let categoriaAtual = "comercial";
    const API_BASE = 'https://billybulletfortal-github-io-1.onrender.com/api';
    
    // Mapeamento de tipos para compatibilidade
    const tipoMapping = {
        'comercial': 'comercial',
        'secreto': 'secreto', 
        'publico': 'publico',
        'todos': ''
    };
    
    // ============================================
    // 3. APLICAR PERMISSÕES POR TIPO DE USUÁRIO
    // ============================================
    
    function aplicarPermissoes() {
        console.log(`Aplicando permissões para ${usuarioLogado.tipo}`);
        
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
    // 4. MOSTRAR INFORMAÇÕES DO USUÁRIO
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
    // 5. FUNÇÕES DA API (do código anterior)
    // ============================================
    
    // Função adaptada para buscar da API existente
    async function buscarProjetos(categoria = "comercial") {
      try {
        const url = categoria === 'todos' 
          ? `${API_BASE}/projetos`
          : `${API_BASE}/projetos?tipo=${categoria}`;
    
        console.log(`🔗 Buscando: ${url}`);
        
        const resposta = await fetch(url);
        
        if (!resposta.ok) {
          throw new Error(`API retornou status ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        console.log("📦 Dados recebidos:", dados);
        
        if (dados.success) {
          exibirProjetos(dados.projetos);
        } else {
          console.error("Erro na API:", dados.error);
          resultado.innerHTML = `<p>Erro na API: ${dados.error || 'Desconhecido'}</p>`;
        }
      } catch (erro) {
        console.error("Erro ao buscar projetos:", erro);
        resultado.innerHTML = `
          <div class="error">
            <p>⚠️ Erro de conexão com a API</p>
            <p><small>${erro.message}</small></p>
            <button onclick="buscarProjetos('${categoria}')">🔄 Tentar novamente</button>
            <p class="small">
              API Status: <a href="${API_BASE}/health" target="_blank">Testar</a> | 
              Projetos: <a href="${API_BASE}/projetos" target="_blank">Ver JSON</a>
            </p>
          </div>
        `;
      }
    }
    
    // Busca simplificada (não suportada pela API atual)
    async function buscarProjetosPorTermo(termo) {
      if (termo.trim() === "") {
        buscarProjetos(categoriaAtual);
        return;
      }
      
      try {
        const url = `${API_BASE}/projetos/buscar?termo=${encodeURIComponent(termo)}`;
        console.log(`🔍 Buscando termo: ${termo} - URL: ${url}`);
        
        const resposta = await fetch(url);
        
        if (!resposta.ok) {
          throw new Error(`Busca retornou status ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        
        if (dados.success) {
          exibirProjetos(dados.projetos);
        } else {
          console.error("Erro na busca:", dados.error);
          resultado.innerHTML = `<p>Erro na busca: ${dados.error || 'Desconhecido'}</p>`;
        }
      } catch (erro) {
        console.error("Erro ao buscar projetos:", erro);
        resultado.innerHTML = `<p>Erro na busca: ${erro.message}</p>`;
        // Fallback: mostrar todos
        buscarProjetos(categoriaAtual);
      }
    }
    
    // Função para exibir projetos (MANTIDA IGUAL)
    function exibirProjetos(projetos) {
      resultado.innerHTML = "";
      
      if (projetos.length === 0) {
        resultado.innerHTML = "<p>Nenhum projeto encontrado.</p>";
        return;
      }
      
      projetos.forEach((projeto) => {
        const novo_card = document.createElement("div");
        novo_card.className = "card";
        
        let corTipo = "";
        switch(projeto.tipo) {
          case 'comercial':
            corTipo = "#2E8B57";
            break;
          case 'secreto':
            corTipo = "#B22222";
            break;
          case 'publico':
            corTipo = "#1E90FF";
            break;
          default:
            corTipo = "#666";
        }
        
        novo_card.innerHTML = `
          <div class='informacoes'>
            <h2>${projeto.nome}</h2>
            <p class="descricao">${projeto.descricao}</p>
            <div class="detalhes">
              <span class="tipo-projeto" style="background-color: ${corTipo}">${projeto.tipo.toUpperCase()}</span>
              <span class="nivel-acesso">Acesso: ${projeto.nivel_acesso}</span>
            </div>
          </div>
        `;
        
        resultado.append(novo_card);
      });
    }
    
    // Converte dados da API (nome, email) para formato de projetos
    function converterDadosParaProjetos(dados, categoriaFiltro) {
      if (!dados || !Array.isArray(dados)) return [];
      
      // Mapeamento de nomes para tipos de projeto
      const tipoPorNome = {
        'joão': 'comercial',
        'maria': 'publico', 
        'exemplo': 'secreto'
      };
      
      return dados
        .filter(item => {
          if (categoriaFiltro === 'todos') return true;
          
          const nomeLower = item.nome.toLowerCase();
          // Determina tipo baseado no nome
          for (const [key, tipo] of Object.entries(tipoPorNome)) {
            if (nomeLower.includes(key)) {
              return tipo === categoriaFiltro;
            }
          }
          return categoriaFiltro === 'comercial'; // padrão
        })
        .map(item => ({
          nome: item.nome || 'Projeto',
          descricao: `Email: ${item.email || 'Não informado'} | Criado em: ${item.data_criacao || 'Data desconhecida'}`,
          tipo: determinarTipo(item.nome),
          nivel_acesso: determinarNivelAcesso(item.nome)
        }));
    }
    
    function determinarTipo(nome) {
      const nomeLower = (nome || '').toLowerCase();
      if (nomeLower.includes('joão')) return 'comercial';
      if (nomeLower.includes('maria')) return 'publico';
      if (nomeLower.includes('exemplo')) return 'secreto';
      return 'comercial'; // padrão
    }
    
    function determinarNivelAcesso(nome) {
      const nomeLower = (nome || '').toLowerCase();
      if (nomeLower.includes('joão')) return 'Restrito';
      if (nomeLower.includes('maria')) return 'Público';
      if (nomeLower.includes('exemplo')) return 'Confidencial';
      return 'Restrito';
    }
    
    // ============================================
    // 6. CONFIGURAR EVENTOS DAS ABAS E PESQUISA
    // ============================================
    
    function configurarEventos() {
        // Evento de pesquisa
        pesquisa.addEventListener("input", (e) => {
            buscarProjetosPorTermo(e.target.value);
        });
        
        // Eventos das abas (somente para abas visíveis)
        abas.forEach(aba => {
            if (aba.style.display !== 'none') {
                aba.addEventListener("click", (e) => {
                    e.preventDefault();
                    
                    // Remove classe ativa de todas as abas
                    abas.forEach(a => a.classList.remove("ativa"));
                    
                    // Adiciona classe ativa na aba clicada
                    aba.classList.add("ativa");
                    
                    // Atualiza categoria atual
                    categoriaAtual = aba.getAttribute("data-categoria");
                    
                    // Atualiza título da categoria
                    const titulos = {
                        "comercial": "Projetos Comerciais",
                        "secreto": "Projetos Secretos", 
                        "publico": "Projetos Públicos",
                        "todos": "Todos os Projetos"
                    };
                    
                    tituloCategoria.textContent = titulos[categoriaAtual];
                    
                    // Busca projetos da nova categoria
                    buscarProjetos(categoriaAtual);
                });
            }
        });
    }
    
    // ============================================
    // 7. INICIALIZAÇÃO DO SISTEMA
    // ============================================
    
    function inicializarSistema() {
        // 1. Mostra quem está logado
        mostrarUsuarioLogado();
        
        // 2. Aplica as permissões
        aplicarPermissoes();
        
        // 3. Configura os eventos
        configurarEventos();
        
        // 4. Busca os projetos iniciais
        console.log('Sistema inicializado para:', usuarioLogado.username);
        buscarProjetos(categoriaAtual);
    }
    
    // ============================================
    // 8. FUNÇÕES GLOBAIS PARA DEBUG
    // ============================================
    
    // Função para testar a API (acessível pelo console)
    window.testarAPI = function() {
        console.log('Testando API...');
        fetch(`${API_BASE}/health`)
            .then(r => r.json())
            .then(data => console.log('Status API:', data))
            .catch(err => console.error('Erro API:', err));
    };
    
    window.recarregarProjetos = function() {
        console.log('Recarregando projetos...');
        buscarProjetos(categoriaAtual);
    };
    
    // ============================================
    // 9. INICIAR O SISTEMA
    // ============================================
    
    inicializarSistema();
});
