const express = require('express');
const router = express.Router();
const CalendarioController = require('../controllers/CalendarioController');

// Rota para obter o calendário acadêmico da UFC
// Não precisamos mais do .bind pois o controller usa função de seta
router.get('/ufc', CalendarioController.getCalendarioUFC);

module.exports = router; 