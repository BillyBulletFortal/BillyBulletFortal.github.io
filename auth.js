// O bando de dados foi gerado e trasferido para Ender.com para ser usado como PAI

const API_BASE_URL = 'https://billybulletfortal-github-io-1.onrender.com';

async function verificarLogin() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");
    
    // Limpa mensagem anterior
    errorMessage.style.display = "none";
    errorMessage.innerHTML = "";
    
    // Validações básicas
    if (!username || !password) {
        mostrarErro("Por favor, preencha usuário e senha.");
        return;
    }
    
    try {
        // 1. Faz login na API
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                senha: password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Erro da API (401, 500, etc)
            mostrarErro(data.error || "ERRO NA AUTENTICAÇÃO");
            return;
        }
        
        if (data.success) {
            // 2. Armazena dados do usuário
            // API retorna: {success: true, id, username, nome, tipo, autenticado: true}
            sessionStorage.setItem('usuario_logado', JSON.stringify(data));
            
            // 3. Redireciona para o sistema
            window.location.href = "sistema.html";
        } else {
            mostrarErro(data.error || "Credenciais inválidas");
        }
        
    } catch (error) {
        console.error("Erro no login:", error);
        mostrarErro("Erro de conexão com a API.");
    }
}

function mostrarErro(mensagem) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerHTML = mensagem;
    errorMessage.style.display = "block";
}

// Configura eventos quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Focar no campo de usuário
    document.getElementById("username").focus();
    
    // Permitir Enter para enviar
    document.getElementById("password").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            verificarLogin();
        }
    });
    
    document.getElementById("username").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            document.getElementById("password").focus();
        }
    });
    
    // Vincular botão de login
    const loginButton = document.querySelector('.login-button');
    if (loginButton) {
        loginButton.addEventListener('click', verificarLogin);
    }
});
