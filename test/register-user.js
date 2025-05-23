// Script simples para cadastrar usuário via API
// Usa as rotas /register e /login que já existem no projeto

// Verificar se fetch está disponível
if (typeof fetch === 'undefined') {
    try {
        global.fetch = require('node-fetch');
    } catch (error) {
        console.log('❌ node-fetch não encontrado. Instale com: npm install node-fetch@2');
        process.exit(1);
    }
}

// Dados do usuário para teste
const USER_DATA = {
    email: 'um.caal2.0@gmail.com',
    password: 'porumcaal2.0'
};

const API_URL = 'http://localhost:3333';

async function registerUser() {
    console.log('🚀 Cadastrando usuário via API...');
    console.log('📧 Email:', USER_DATA.email);
    console.log('🔑 Senha:', USER_DATA.password);
    console.log('─'.repeat(50));

    try {
        console.log('📡 Enviando POST /register...');
        
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(USER_DATA)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Usuário cadastrado com sucesso!');
            console.log('📋 Dados:', data);
        } else {
            console.log('⚠️  Resposta da API:');
            console.log('   Status:', response.status);
            console.log('   Erro:', data.error || data.message);
            
            if (data.error === 'User already exists') {
                console.log('💡 Usuário já existe no sistema');
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Servidor não está rodando. Execute: node server.js');
        }
    }
}

async function testLogin() {
    console.log('\n🧪 Testando login...');
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(USER_DATA)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login realizado com sucesso!');
            console.log('👤 Usuário:', data.user?.email);
            console.log('🔑 Token gerado:', data.token ? 'Sim' : 'Não');
        } else {
            console.log('❌ Erro no login:', data.error || data.message);
        }

    } catch (error) {
        console.error('❌ Erro no login:', error.message);
    }
}

// Executar
(async () => {
    await registerUser();
    await testLogin();
    console.log('\n✨ Finalizado!');
})(); 