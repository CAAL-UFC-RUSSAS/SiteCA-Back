const express = require('express');
const router = express.Router();
const BannerController = require('../controllers/BannerController');
const authMiddleware = require('../middlewares/auth');
const imageValidator = require('../middlewares/imageValidator');

// Rotas públicas (sem autenticação)
router.get('/banners', BannerController.index);
router.get('/banners/ativos', BannerController.ativos);
router.get('/banners/:id', BannerController.show);

// Temporariamente tornando todas as rotas públicas para testes
router.post('/banners', imageValidator, BannerController.store);
router.put('/banners/:id', imageValidator, BannerController.update);
router.delete('/banners/:id', BannerController.destroy);
router.post('/banners/reordenar', BannerController.reordenar);

// Comentando as rotas protegidas temporariamente
// router.post('/banners', authMiddleware, imageValidator, BannerController.store);
// router.put('/banners/:id', authMiddleware, imageValidator, BannerController.update);
// router.delete('/banners/:id', authMiddleware, BannerController.destroy);
// router.post('/banners/reordenar', authMiddleware, BannerController.reordenar);

module.exports = router; 