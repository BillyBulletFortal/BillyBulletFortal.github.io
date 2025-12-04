// Lógica do Dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se usuário está logado
    if (!auth.isLoggedIn()) {
        window.location.href = "index.html";
        return;
    }
    
    const user = auth.getCurrentUser();
    
    // Atualizar saudação
    document.getElementById('userGreeting').textContent = `Olá, ${user.name}!`;
    document.getElementById('userInfo').textContent = 
        `Você está logado como ${getRoleName(user.role)} (${user.email})`;
    
    // Mostrar permissões
    showPermissions(user.role);
    
    // Mostrar/ocultar áreas baseado no role
    setupAreaAccess(user.role);
});

function getRoleName(role) {
    const roles = {
        'vendedor': 'Vendedor',
        'gerente': 'Gerente',
        'engenheiro': 'Engenheiro',
        'admin_projeto': 'Administrador de Projeto'
    };
    return roles[role] || role;
}

function showPermissions(role) {
    const permissionsList = document.getElementById('permissionsList');
    let permissions = [];
    
    switch(role) {
        case 'vendedor':
            permissions = ['Visualizar clientes', 'Registrar vendas', 'Ver relatórios de vendas'];
            break;
        case 'gerente':
            permissions = ['Todas do vendedor', 'Aprovar vendas', 'Visualizar desempenho da equipe', 'Gerar relatórios gerenciais'];
            break;
        case 'engenheiro':
            permissions = ['Visualizar projetos', 'Acessar especificações técnicas', 'Registrar progresso', 'Solicitar recursos'];
            break;
        case 'admin_projeto':
            permissions = ['Acesso total ao sistema', 'Gerenciar usuários', 'Configurar projetos', 'Administrar recursos'];
            break;
    }
    
    permissionsList.innerHTML = '<ul>' + 
        permissions.map(p => `<li>${p}</li>`).join('') + 
        '</ul>';
}

function setupAreaAccess(role) {
    // Mostrar apenas as áreas que o usuário pode acessar
    
    // Admin tem acesso a tudo
    if (role === 'admin_projeto') {
        return; // Todas as áreas já estão visíveis
    }
    
    // Ocultar áreas não permitidas
    if (role !== 'vendedor') {
        document.getElementById('salesArea').classList.add('hidden');
    }
    
    if (role !== 'gerente') {
        document.getElementById('managerArea').classList.add('hidden');
    }
    
    if (role !== 'engenheiro') {
        document.getElementById('engineerArea').classList.add('hidden');
    }
    
    // Admin area só para admins (já é o caso por padrão)
    document.getElementById('adminArea').classList.add('hidden');
}

function accessArea(area) {
    const user = auth.getCurrentUser();
    
    // Verificar permissão
    if (!auth.hasPermission(area) && area !== 'admin_projeto') {
        alert('Você não tem permissão para acessar esta área!');
        return;
    }
    
    // Redirecionar para a área (simulação)
    alert(`Acessando área de ${getRoleName(area)}...`);
    
    // Em um sistema real, aqui redirecionaria para página específica
    // window.location.href = `areas/${area}.html`;
}
