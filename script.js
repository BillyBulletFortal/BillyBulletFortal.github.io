const resultado = document.querySelector("#resultado");
const pesquisa = document.querySelector("#pesquisa");
const tituloCategoria = document.querySelector("#titulo-categoria");
const abas = document.querySelectorAll(".aba");

let categoriaAtual = "comercial";
const API_BASE = "http://localhost:5000/api";

// Função para buscar projetos por categoria
async function buscarProjetos(categoria = "comercial") {
  try {
    const url = categoria === 'todos' 
      ? `${API_BASE}/projetos`
      : `${API_BASE}/projetos?tipo=${categoria}`;

    const resposta = await fetch(url);
    const dados = await resposta.json();
    
    if (dados.success) {
      exibirProjetos(dados.projetos);
    } else {
      console.error("Erro na API:", dados.error);
      resultado.innerHTML = "<p>Erro ao carregar projetos. Tente novamente mais tarde.</p>";
    }
  } catch (erro) {
    console.error("Erro ao buscar projetos:", erro);
    resultado.innerHTML = "<p>Erro de conexão. Verifique se o servidor está rodando.</p>";
  }
}

// Função para buscar projetos por termo de pesquisa
async function buscarProjetosPorTermo(termo) {
  if (termo.trim() === "") {
    buscarProjetos(categoriaAtual);
    return;
  }
  
  try {
    const resposta = await fetch(`${API_BASE}/projetos/buscar?termo=${encodeURIComponent(termo)}`);
    const dados = await resposta.json();
    
    if (dados.success) {
      exibirProjetos(dados.projetos);
    } else {
      console.error("Erro na busca:", dados.error);
      resultado.innerHTML = "<p>Erro na busca. Tente novamente.</p>";
    }
  } catch (erro) {
    console.error("Erro ao buscar projetos:", erro);
    resultado.innerHTML = "<p>Erro de conexão na busca.</p>";
  }
}

// Função para exibir projetos na tela
function exibirProjetos(projetos) {
  resultado.innerHTML = "";
  
  if (projetos.length === 0) {
    resultado.innerHTML = "<p>Nenhum projeto encontrado.</p>";
    return;
  }
  
  projetos.forEach((projeto) => {
    const novo_card = document.createElement("div");
    novo_card.className = "card";
    
    // Determinar cor baseada no tipo de projeto
    let corTipo = "";
    switch(projeto.tipo) {
      case 'comercial':
        corTipo = "#2E8B57"; // Verde
        break;
      case 'secreto':
        corTipo = "#B22222"; // Vermelho
        break;
      case 'publico':
        corTipo = "#1E90FF"; // Azul
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

// Evento de input na barra de pesquisa
pesquisa.addEventListener("input", (e) => {
  buscarProjetosPorTermo(e.target.value);
});

// Eventos para as abas de navegação
abas.forEach(aba => {
  aba.addEventListener("click", (e) => {
    e.preventDefault();
    
    // Atualiza a aba ativa
    abas.forEach(a => a.classList.remove("ativa"));
    aba.classList.add("ativa");
    
    // Atualiza a categoria e busca os projetos
    categoriaAtual = aba.getAttribute("data-categoria");
    
    // Atualiza o título da categoria
    const titulos = {
      "comercial": "Projetos Comerciais",
      "secreto": "Projetos Secretos",
      "publico": "Projetos Públicos",
      "todos": "Todos os Projetos"
    };
    
    tituloCategoria.textContent = titulos[categoriaAtual];
    
    // Busca os projetos da categoria selecionada
    buscarProjetos(categoriaAtual);
  });
});

// Carrega os projetos ao iniciar
document.addEventListener('DOMContentLoaded', function() {
  buscarProjetos(categoriaAtual);
});