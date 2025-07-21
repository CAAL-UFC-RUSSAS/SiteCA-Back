const express = require('express');
const router = express.Router();
const MembroGestaoController = require('../controllers/MembroGestaoController');
const authMiddleware = require('../middlewares/auth');
const imageValidator = require('../middlewares/imageValidator');

// Rotas públicas
router.get('/membros', MembroGestaoController.index);
router.get('/membros/:id', MembroGestaoController.show);
router.get('/membros-gestoes', MembroGestaoController.gestoes);

// Rotas protegidas (requerem autenticação)
router.post('/membros', authMiddleware, imageValidator, MembroGestaoController.store);
router.put('/membros/:id', authMiddleware, imageValidator, MembroGestaoController.update);
router.delete('/membros/:id', authMiddleware, MembroGestaoController.destroy);
router.post('/membros/reordenar', authMiddleware, MembroGestaoController.reordenar);

module.exports = router; 