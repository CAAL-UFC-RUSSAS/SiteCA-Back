const express = require('express');
const router = express.Router();
const AuthController = require('./controllers/AuthController');
const produtosRoutes = require('./routes/produtos');
const bannersRoutes = require('./routes/banners');
const avisosRoutes = require('./routes/avisos');
const calendarioRoutes = require('./routes/calendario');
const emailRoutes = require('./routes/email');
const financeiroRoutes = require('./routes/financeiro');
const authMiddleware = require('./middleware/authMiddleware');

// Rotas de autenticação
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Rotas de produtos
router.use(produtosRoutes);

// Rotas de banners
router.use(bannersRoutes);

// Rotas de avisos
router.use(avisosRoutes);

// Rotas de calendário
router.use('/calendario', calendarioRoutes);

// Rotas de email/contato
router.use('/email', emailRoutes);

// Rotas financeiras
router.use('/financeiro', financeiroRoutes);

// Rota direta para testes de contato
const EmailController = require('./controllers/EmailController');
router.post('/contato', EmailController.enviarEmail);

router.get('/private', authMiddleware, (req, res) => {
  console.log(req.userId);
  return res.json({ message: `Hello User ${req.userId}` });
});

module.exports = router;