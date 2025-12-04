// Sistema de Autenticação Básico
// Usa localStorage como "banco de dados" simples
// Para um sistema real, isso seria substituído por um backend

class AuthSystem {
    constructor() {
        this.users = this.getUsersFromStorage();
        this.currentUser = null;
        this.ADMIN_CODE = "TrueLife"; // Código secreto para admin
        
        // Inicializar usuário padrão para teste
        if (this.users.length === 0) {
            this.createDefaultUsers();
        }
    }

    // Buscar usuários do localStorage
    getUsersFromStorage() {
        const usersJson = localStorage.getItem('wayne_users');
        if (usersJson) {
            return JSON.parse(usersJson);
        }
        return [];
    }

    // Salvar usuários no localStorage
    saveUsersToStorage() {
        localStorage.setItem('wayne_users', JSON.stringify(this.users));
    }

    // Criar usuários padrão para demonstração
    createDefaultUsers() {
        const defaultUsers = [
            {
                id: 1,
                name: "Bruce Wayne",
                email: "bruce@wayne.com",
                password: "admin123", // Em sistema real, isso seria hasheado
                role: "admin_projeto",
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: "Lucius Fox",
                email: "lucius@wayne.com",
                password: "eng123",
                role: "engenheiro",
                createdAt: new Date().toISOString()
            }
        ];

        this.users = defaultUsers;
        this.saveUsersToStorage();
    }

    // Login simples
    login(email, password) {
        // Buscar usuário pelo email
        const user = this.users.find(u => u.email === email);
        
        if (!user) {
            return {
                success: false,
                message: "Usuário não encontrado"
            };
        }

        // Verificar senha (em sistema real, comparar hash)
        if (user.password !== password) {
            return {
                success: false,
                message: "Senha incorreta"
            };
        }

        // Salvar usuário na sessão (remover senha por segurança)
        const userSession = { ...user };
        delete userSession.password;
        
        this.currentUser = userSession;
        localStorage.setItem('current_user', JSON.stringify(userSession));

        return {
            success: true,
            user: userSession
        };
    }

    // Registro de novo usuário
    register(userData) {
        // Validar dados básicos
        if (!userData.name || !userData.email || !userData.password || !userData.role) {
            return {
                success: false,
                message: "Todos os campos são obrigatórios"
            };
        }

        // Verificar se email já existe
        if (this.users.some(u => u.email === userData.email)) {
            return {
                success: false,
                message: "Este email já está cadastrado"
            };
        }

        // Verificar código secreto para admin
        if (userData.role === "admin_projeto") {
            if (userData.adminCode !== this.ADMIN_CODE) {
                return {
                    success: false,
                    message: "Código secreto inválido para administrador de projeto"
                };
            }
        }

        // Criar novo usuário
        const newUser = {
            id: this.users.length + 1,
            name: userData.name,
            email: userData.email,
            password: userData.password, // Em sistema real, hashear aqui
            role: userData.role,
            createdAt: new Date().toISOString()
        };

        // Adicionar à lista
        this.users.push(newUser);
        this.saveUsersToStorage();

        // Fazer login automático
        return this.login(userData.email, userData.password);
    }

    // Verificar se usuário está logado
    isLoggedIn() {
        const userJson = localStorage.getItem('current_user');
        if (userJson) {
            this.currentUser = JSON.parse(userJson);
            return true;
        }
        return false;
    }

    // Obter usuário atual
    getCurrentUser() {
        return this.currentUser;
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('current_user');
        window.location.href = "index.html";
    }

    // Verificar permissões
    hasPermission(requiredRole) {
        if (!this.currentUser) return false;
        
        // Admin tem acesso a tudo
        if (this.currentUser.role === "admin_projeto") {
            return true;
        }
        
        // Verificar role específico
        return this.currentUser.role === requiredRole;
    }
}

// Criar instância global
const auth = new AuthSystem();
