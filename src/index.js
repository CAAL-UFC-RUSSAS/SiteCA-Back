const express = require('express');
const cors = require('cors');

const app = express();

// Configuração de CORS com base em variável de ambiente ou fallback para desenvolvimento
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisições sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);
    
    // Verificar se a origem está na lista de permitidos
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log('Origem bloqueada pelo CORS:', origin);
      callback(new Error('Não permitido pela política de CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ... rest of the code ... 