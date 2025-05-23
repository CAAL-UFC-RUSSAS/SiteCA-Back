require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const routes = require('./src/routes');
const runMigrations = require('./src/migrations');

const app = express();
const uploadsPath = path.join(__dirname, 'uploads');

// Configurações de middleware
function setupMiddleware() {
    // Configurar CORS
    if (process.env.NODE_ENV === 'production') {    
        app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
    }else{
        app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
    }
    
    // Configurar parsing de dados
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Middleware para log de requisições (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
        app.use((req, res, next) => {
            console.log(`${req.method} ${req.url}`);
            next();
        });
    }
}

// Configurar rota para servir arquivos de upload
function setupFileRoutes() {
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

        const PORT = process.env.PORT || 3333;
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📁 Uploads: ${uploadsPath}`);
            console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();
