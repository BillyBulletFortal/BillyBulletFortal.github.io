const resultado = document.querySelector("#resultado");
const pesquisa = document.querySelector("#pesquisa");
const tituloCategoria = document.querySelector("#titulo-categoria");
const abas = document.querySelectorAll(".aba");

let categoriaAtual = "comercial";
const API_BASE_URL = 'https://billybulletfortal-github-io-1.onrender.com/api';

// Mapeamento de tipos para compatibilidade
const tipoMapping = {
    'comercial': 'comercial',
    'secreto': 'secreto', 
    'publico': 'publico',
    'todos': ''
};

// Função adaptada para buscar da API existente
async function buscarProjetos(categoria = "comercial") {
  try {
    // Se for "todos", busca todos os dados
    const url = categoria === 'todos' 
      ? `${API_BASE_URL}/data`
      : `${API_BASE_URL}/data`;
    
    const resposta = await fetch(url);
    const dados = await resposta.json();
    
    if (dados.success) {
      // Converte dados da API para formato esperado pelo frontend
      const projetosConvertidos = converterDadosParaProjetos(dados.data, categoria);
      exibirProjetos(projetosConvertidos);
    } else {
      console.error("Erro na API:", dados.error);
      resultado.innerHTML = "<p>Erro ao carregar dados. Tente novamente mais tarde.</p>";
    }
  } catch (erro) {
    console.error("Erro ao buscar dados:", erro);
    resultado.innerHTML = "<p>Erro de conexão. Verifique se a API está rodando.</p>";
  }
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

// Busca simplificada (não suportada pela API atual)
async function buscarProjetosPorTermo(termo) {
  if (termo.trim() === "") {
    buscarProjetos(categoriaAtual);
    return;
  }
  
  try {
    // Como a API atual não tem busca, filtramos localmente
    const resposta = await fetch(`${API_BASE_URL}/data`);
    const dados = await resposta.json();
    
    if (dados.success) {
      const filtrados = dados.data.filter(item => 
        item.nome.toLowerCase().includes(termo.toLowerCase()) ||
        item.email.toLowerCase().includes(termo.toLowerCase())
      );
      
      const projetosConvertidos = converterDadosParaProjetos(filtrados, categoriaAtual);
      exibirProjetos(projetosConvertidos);
    }
  } catch (erro) {
    console.error("Erro na busca:", erro);
    buscarProjetos(categoriaAtual); // fallback
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

// Eventos (MANTIDOS IGUAIS)
pesquisa.addEventListener("input", (e) => {
  buscarProjetosPorTermo(e.target.value);
});

abas.forEach(aba => {
  aba.addEventListener("click", (e) => {
    e.preventDefault();
    
    abas.forEach(a => a.classList.remove("ativa"));
    aba.classList.add("ativa");
    
    categoriaAtual = aba.getAttribute("data-categoria");
    
    const titulos = {
      "comercial": "Projetos Comerciais",
      "secreto": "Projetos Secretos",
      "publico": "Projetos Públicos",
      "todos": "Todos os Projetos"
    };
    
    tituloCategoria.textContent = titulos[categoriaAtual];
    buscarProjetos(categoriaAtual);
  });
});

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  buscarProjetos(categoriaAtual);
});
