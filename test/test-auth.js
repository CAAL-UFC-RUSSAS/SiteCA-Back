// Script para testar autenticação completa
// Testa as rotas /register e /login

// Verificar se fetch está disponível
if (typeof fetch === 'undefined') {
    try {
        global.fetch = require('node-fetch');
    } catch (error) {
        console.log('❌ node-fetch não encontrado. Instale com: npm install node-fetch@2');
        process.exit(1);
    }
}

const USER_DATA = {
    email: 'um.caal2.0@gmail.com',
    password: 'porumcaal2.0'
};

const API_URL = 'http://localhost:3333';

async function testRegister() {
    console.log('🧪 TESTE: Cadastro de usuário');
    console.log('─'.repeat(40));
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER_DATA)
        });

        const data = await response.json();
        console.log('Status:', response.status);

        if (response.ok) {
            console.log('✅ Usuário cadastrado:', data);
            return data;
        } else {
            if (data.error === 'User already exists') {
                console.log('⚠️  Usuário já existe - OK para continuar');
                return { exists: true };
            } else {
                console.log('❌ Erro:', data.error);
                throw new Error(data.error);
            }
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
        throw error;
    }
}

async function testLogin() {
    console.log('\n🧪 TESTE: Login');
    console.log('─'.repeat(40));
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER_DATA)
        });

        const data = await response.json();
        console.log('Status:', response.status);

        if (response.ok) {
            console.log('✅ Login realizado!');
            console.log('👤 Usuário:', data.user?.email);
            console.log('🔑 Token:', data.token ? 'Gerado' : 'Não gerado');
            return data;
        } else {
            console.log('❌ Erro no login:', data.error);
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
        throw error;
    }
}

async function checkServer() {
    console.log('🌐 Verificando servidor...');
    
    try {
        const response = await fetch(API_URL);
        console.log('✅ Servidor está rodando\n');
        return true;
    } catch (error) {
        console.log('❌ Servidor não está rodando');
        console.log('💡 Execute: node server.js\n');
        return false;
    }
}

// Executar testes
(async () => {
    console.log('🚀 Testando autenticação completa');
    console.log('📧 Email:', USER_DATA.email);
    console.log('🔑 Senha:', USER_DATA.password);
    console.log('═'.repeat(50));
    
    try {
        // Verificar servidor
        const serverOk = await checkServer();
        if (!serverOk) return;
        
        // Testar registro
        await testRegister();
        
        // Testar login
        await testLogin();
        
        console.log('\n═'.repeat(50));
        console.log('✨ Todos os testes passaram!');
        
    } catch (error) {
        console.log('\n❌ Teste falhou:', error.message);
        
        if (error.message.includes('connect')) {
            console.log('💡 Verifique se o servidor está rodando');
        }
    }
})(); 