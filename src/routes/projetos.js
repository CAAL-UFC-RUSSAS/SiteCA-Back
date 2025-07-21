const express = require('express');
const router = express.Router();
const ProjetoCampanhaController = require('../controllers/ProjetoCampanhaController');
const authMiddleware = require('../middlewares/auth');

// Rotas públicas
router.get('/projetos', ProjetoCampanhaController.index);
router.get('/projetos/:id', ProjetoCampanhaController.show);
router.get('/projetos-gestoes', ProjetoCampanhaController.gestoes);

// Rotas protegidas (requerem autenticação)
router.post('/projetos', authMiddleware, ProjetoCampanhaController.store);
router.put('/projetos/:id', authMiddleware, ProjetoCampanhaController.update);
router.delete('/projetos/:id', authMiddleware, ProjetoCampanhaController.destroy);
router.post('/projetos/reordenar', authMiddleware, ProjetoCampanhaController.reordenar);

module.exports = router; 