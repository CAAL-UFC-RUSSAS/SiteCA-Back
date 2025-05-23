const express = require('express');
const router = express.Router();
const ProdutoController = require('../controllers/ProdutoController');
const authMiddleware = require('../middlewares/auth');

// Rotas públicas
router.get('/produtos', ProdutoController.index);
router.get('/produtos/:id', ProdutoController.show);

// Rotas protegidas (requerem autenticação)
router.post('/produtos', authMiddleware, ProdutoController.store);
router.put('/produtos/:id', authMiddleware, ProdutoController.update);
router.delete('/produtos/:id', authMiddleware, ProdutoController.destroy);

module.exports = router; 