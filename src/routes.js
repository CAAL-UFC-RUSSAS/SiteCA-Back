const express = require('express');
const router = express.Router();
const AuthController = require('./controllers/AuthController');
const produtosRoutes = require('./routes/produtos');
const authMiddleware = require('./middleware/authMiddleware');

// Rotas de autenticação
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Rotas de produtos
router.use(produtosRoutes);

router.get('/private', authMiddleware, (req, res) => {
  console.log(req.userId);
  return res.json({ message: `Hello User ${req.userId}` });
});

module.exports = router;