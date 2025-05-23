const express = require('express');
const router = express.Router();
const ProdutoController = require('../controllers/ProdutoController');
const authMiddleware = require('../middlewares/auth');
const imageValidator = require('../middlewares/imageValidator');

// Rotas públicas
router.get('/produtos', ProdutoController.index);
router.get('/produtos/:id', ProdutoController.show);

// Rotas protegidas (requerem autenticação) + validação de imagem
router.post('/produtos', authMiddleware, imageValidator, ProdutoController.store);
router.put('/produtos/:id', authMiddleware, imageValidator, ProdutoController.update);
router.delete('/produtos/:id', authMiddleware, ProdutoController.destroy);

module.exports = router; 