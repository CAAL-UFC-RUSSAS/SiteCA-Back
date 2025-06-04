require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const routes = require('./src/routes');
const runMigrations = require('./src/migrations');

const app = express();
const uploadsPath = path.join(__dirname, 'uploads');
const bannersPath = path.join(__dirname, 'uploads', 'banners');

// Configurações de middleware
function setupMiddleware() {
    // Configurar CORS - permitir todas as origens
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204
    }));
    
    // Configurar parsing de dados - LIMITE DE 10MB PARA IMAGENS
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Middleware para log de requisições
    app.use((req, res, next) => {
        const start = Date.now();
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        
        // Interceptar o fim da resposta para logar tempo
        const originalEnd = res.end;
        res.end = function() {
            const duration = Date.now() - start;
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
            originalEnd.apply(res, arguments);
        };
        next();
    });
    
    // Middleware para tratar erros de JSON
    app.use((err, req, res, next) => {
        if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
            console.error('JSON inválido:', err);
            return res.status(400).json({ error: 'JSON inválido', message: 'O formato da requisição é inválido.' });
        }
        next(err);
    });
}

// Configurar rota para servir arquivos de upload
function setupFileRoutes() {
    // Rota para arquivos gerais
    app.get('/uploads/:filename', async (req, res) => {
        const filename = req.params.filename;
        const filePath = path.join(uploadsPath, filename);
        
        try {
            await fs.access(filePath);
            
            // Configurar headers de cache
            res.set({
                'Cache-Control': 'no-store',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Access-Control-Allow-Origin': '*'
            });
            
            // Configurar Content-Type baseado na extensão
            const ext = path.extname(filename).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif'
            };
            res.set('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            
            res.sendFile(filePath);
        } catch (error) {
            console.error('Erro ao servir arquivo:', error.message);
            res.status(404).json({ error: 'Arquivo não encontrado' });
        }
    });
    
    // Rota para arquivos de banners
    app.get('/uploads/banners/:filename', async (req, res) => {
        const filename = req.params.filename;
        const filePath = path.join(bannersPath, filename);
        
        try {
            await fs.access(filePath);
            
            // Configurar headers de cache
            res.set({
                'Cache-Control': 'no-store',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Access-Control-Allow-Origin': '*'
            });
            
            // Configurar Content-Type baseado na extensão
            const ext = path.extname(filename).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif'
            };
            res.set('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            
            res.sendFile(filePath);
        } catch (error) {
            console.error('Erro ao servir arquivo de banner:', error.message);
            res.status(404).json({ error: 'Arquivo de banner não encontrado' });
        }
    });
}

// Garantir que a pasta uploads existe
async function ensureUploadsDir() {
    try {
        await fs.access(uploadsPath);
        console.log('Pasta uploads verificada:', uploadsPath);
    } catch {
        await fs.mkdir(uploadsPath, { recursive: true });
        console.log('Pasta uploads criada:', uploadsPath);
    }
    
    // Garantir que a pasta banners existe
    try {
        await fs.access(bannersPath);
        console.log('Pasta banners verificada:', bannersPath);
    } catch {
        await fs.mkdir(bannersPath, { recursive: true });
        console.log('Pasta banners criada:', bannersPath);
    }
}

// Configurar e iniciar servidor
async function startServer() {
    try {
        // Executar migrações apenas em produção
        if (process.env.NODE_ENV === 'production') {
            await runMigrations();
        }

        // Configurar pasta de uploads
        await ensureUploadsDir();

        // Configurar middlewares e rotas
        setupMiddleware();
        setupFileRoutes();
        app.use(routes);
        
        // Adicionar rota de fallback para 404 em formato JSON
        app.use((req, res) => {
            console.log(`Rota não encontrada: ${req.method} ${req.url}`);
            res.status(404).json({
                error: 'Rota não encontrada',
                message: `A rota ${req.method} ${req.url} não existe nesta API.`,
                success: false
            });
        });
        
        // Middleware de tratamento de erros
        app.use((err, req, res, next) => {
            console.error('Erro na aplicação:', err);
            res.status(500).json({
                error: 'Erro interno',
                message: 'Ocorreu um erro interno no servidor.',
                success: false
            });
        });

        const PORT = process.env.PORT || 3333;
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📁 Uploads: ${uploadsPath}`);
            console.log(`📁 Banners: ${bannersPath}`);
            console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();
