const express = require('express');
const router = express.Router();
const EmailController = require('../controllers/EmailController');

// Rota para enviar email de contato
router.post('/contato', EmailController.enviarEmail);

module.exports = router; 