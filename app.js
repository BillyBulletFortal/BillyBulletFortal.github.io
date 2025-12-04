// Funções da interface
function showTab(tabName) {
    // Esconder todas as tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar tab selecionada
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Ativar botão correspondente
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName)) {
            btn.classList.add('active');
        }
    });
}

function toggleAdminCode() {
    const roleSelect = document.getElementById('regRole');
    const adminCodeGroup = document.getElementById('adminCodeGroup');
    
    if (roleSelect.value === 'admin_projeto') {
        adminCodeGroup.style.display = 'block';
    } else {
        adminCodeGroup.style.display = 'none';
    }
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    const result = auth.login(email, password);
    
    if (result.success) {
        showMessage('Login realizado com sucesso!', 'success');
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);
    } else {
        showMessage(result.message, 'error');
    }
}

function register() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    const adminCode = document.getElementById('adminCode').value;
    
    if (!name || !email || !password) {
        showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    const userData = {
        name,
        email,
        password,
        role
    };
    
    if (role === 'admin_projeto') {
        userData.adminCode = adminCode;
    }
    
    const result = auth.register(userData);
    
    if (result.success) {
        showMessage('Cadastro realizado com sucesso!', 'success');
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);
    } else {
        showMessage(result.message, 'error');
    }
}

function showMessage(message, type) {
    // Remover mensagens anteriores
    const existingMsg = document.querySelector('.message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Inserir após o card
    const card = document.querySelector('.card');
    card.parentNode.insertBefore(messageDiv, card.nextSibling);
    
    // Remover após 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Se já estiver logado, redirecionar para dashboard
    if (auth.isLoggedIn() && window.location.pathname.includes('index.html')) {
        window.location.href = "dashboard.html";
    }
});
