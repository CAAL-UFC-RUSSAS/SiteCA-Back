const express = require('express');
const router = express.Router();
const AvisoController = require('../controllers/AvisoController');
const authMiddleware = require('../middlewares/auth');

// Rotas públicas
router.get('/avisos', AvisoController.index);
router.get('/avisos/ativos', AvisoController.ativos);
router.get('/avisos/:id', AvisoController.show);

// Rotas protegidas (requerem autenticação)
router.post('/avisos', authMiddleware, AvisoController.store);
router.put('/avisos/:id', authMiddleware, AvisoController.update);
router.delete('/avisos/:id', authMiddleware, AvisoController.destroy);

module.exports = router; 