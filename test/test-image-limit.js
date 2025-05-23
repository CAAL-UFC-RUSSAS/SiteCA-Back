// Teste simples para verificar limitação de tamanho de imagem

// Verificar se fetch está disponível
if (typeof fetch === 'undefined') {
    try {
        global.fetch = require('node-fetch');
    } catch (error) {
        console.log('❌ node-fetch não encontrado. Instale com: npm install node-fetch@2');
        process.exit(1);
    }
}

const API_URL = 'http://localhost:3333';

// Simular uma imagem base64 pequena (menor que 10MB)
function generateSmallImage() {
    // Criar uma string base64 pequena que representa uma imagem fictícia
    const smallData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    return `data:image/png;base64,${smallData}`;
}

// Simular uma imagem base64 grande (maior que 10MB)
function generateLargeImage() {
    // Criar uma string base64 grande (aproximadamente 12MB)
    const size = 12 * 1024 * 1024; // 12MB em bytes
    // Como base64 é ~75% eficiente, precisamos de ~16MB de dados base64 para 12MB reais
    const largeData = 'A'.repeat(Math.floor(size * 1.33));
    return `data:image/png;base64,${largeData}`;
}

async function testImageLimits() {
    console.log('🧪 Testando limitação de tamanho de imagem (10MB)');
    console.log('═'.repeat(55));
    
    try {
        // Primeiro, fazer login para obter token
        console.log('🔐 Fazendo login...');
        const loginResponse = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'um.caal2.0@gmail.com',
                password: 'porumcaal2.0'
            })
        });
        
        if (!loginResponse.ok) {
            throw new Error('Não foi possível fazer login. Execute o teste de registro primeiro.');
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Login realizado com sucesso!');
        
        // Teste 1: Imagem pequena (deve passar)
        console.log('\n🧪 TESTE 1: Imagem pequena (deve passar)');
        console.log('─'.repeat(45));
        
        const smallImageResponse = await fetch(`${API_URL}/produtos`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nome: 'Produto Teste - Imagem Pequena',
                descricao: 'Teste com imagem pequena',
                preco: 1000,
                quantidade: 1,
                disponivel: true,
                tags: ['teste'],
                imagem: generateSmallImage()
            })
        });
        
        if (smallImageResponse.ok) {
            console.log('✅ Imagem pequena aceita (correto)');
        } else {
            const error = await smallImageResponse.json();
            console.log('❌ Imagem pequena rejeitada (erro):', error.error);
        }
        
        // Teste 2: Imagem grande (deve ser rejeitada)
        console.log('\n🧪 TESTE 2: Imagem grande (deve ser rejeitada)');
        console.log('─'.repeat(45));
        
        const largeImageResponse = await fetch(`${API_URL}/produtos`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nome: 'Produto Teste - Imagem Grande',
                descricao: 'Teste com imagem grande',
                preco: 1000,
                quantidade: 1,
                disponivel: true,
                tags: ['teste'],
                imagem: generateLargeImage()
            })
        });
        
        if (!largeImageResponse.ok) {
            const error = await largeImageResponse.json();
            console.log('✅ Imagem grande rejeitada (correto):', error.error);
        } else {
            console.log('❌ Imagem grande aceita (erro - deveria ser rejeitada)');
        }
        
        console.log('\n═'.repeat(55));
        console.log('✨ Teste de limitação de imagem concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        
        if (error.message.includes('connect')) {
            console.log('💡 Verifique se o servidor está rodando: node server.js');
        }
        if (error.message.includes('login')) {
            console.log('💡 Execute primeiro: node test/register-user.js');
        }
    }
}

// Executar teste
testImageLimits(); 