// Lógica da área de administração
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se é admin
    if (!auth.hasPermission('admin_projeto')) {
        alert('Acesso restrito a administradores!');
        window.location.href = "dashboard.html";
        return;
    }
    
    loadUsersList();
    loadStats();
});

function loadUsersList() {
    // Buscar usuários do sistema
    const users = JSON.parse(localStorage.getItem('wayne_users') || '[]');
    
    if (users.length === 0) {
        document.getElementById('usersList').innerHTML = '<p>Nenhum usuário cadastrado</p>';
        return;
    }
    
    let html = '<table>';
    html += '<tr><th>ID</th><th>Nome</th><th>Email</th><th>Cargo</th><th>Cadastro</th></tr>';
    
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${getRoleName(user.role)}</td>
                <td>${new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
            </tr>
        `;
    });
    
    html += '</table>';
    document.getElementById('usersList').innerHTML = html;
}

function loadStats() {
    const users = JSON.parse(localStorage.getItem('wayne_users') || '[]');
    
    // Contar usuários por cargo
    const counts = {
        vendedor: 0,
        gerente: 0,
        engenheiro: 0,
        admin_projeto: 0
    };
    
    users.forEach(user => {
        if (counts[user.role] !== undefined) {
            counts[user.role]++;
        }
    });
    
    let html = '<ul>';
    html += `<li><strong>Total de Usuários:</strong> ${users.length}</li>`;
    html += `<li><strong>Vendedores:</strong> ${counts.vendedor}</li>`;
    html += `<li><strong>Gerentes:</strong> ${counts.gerente}</li>`;
    html += `<li><strong>Engenheiros:</strong> ${counts.engenheiro}</li>`;
    html += `<li><strong>Administradores:</strong> ${counts.admin_projeto}</li>`;
    html += '</ul>';
    
    document.getElementById('stats').innerHTML = html;
}

function showAddUserForm() {
    alert('Funcionalidade de adicionar usuário seria implementada aqui.\n\nEm um sistema real, isso abriria um formulário para cadastrar novos usuários com diferentes cargos.');
}

function getRoleName(role) {
    const roles = {
        'vendedor': 'Vendedor',
        'gerente': 'Gerente',
        'engenheiro': 'Engenheiro',
        'admin_projeto': 'Administrador'
    };
    return roles[role] || role;
}
