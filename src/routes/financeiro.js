const express = require('express');
const router = express.Router();
const FinanceiroController = require('../controllers/FinanceiroController');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para transparência financeira (pública)
router.get('/transparencia', FinanceiroController.obterDadosTransparencia);
router.get('/transparencia/completa', FinanceiroController.obterDadosTransparenciaCompletos);
router.get('/ca/relatorio/:mes/:ano', FinanceiroController.gerarRelatorioMensalCA);
router.get('/descanso/relatorio/:mes/:ano', FinanceiroController.gerarRelatorioMensalDescanso);

// Todas as rotas financeiras abaixo requerem autenticação
router.use(authMiddleware);

// Rotas para o caixa do CA
router.get('/ca', FinanceiroController.listarTransacoesCA);
router.post('/ca', FinanceiroController.adicionarTransacaoCA);
router.put('/ca/:id', FinanceiroController.atualizarTransacaoCA);
router.delete('/ca/:id', FinanceiroController.excluirTransacaoCA);
router.get('/ca/relatorio', FinanceiroController.gerarRelatorioCA);

// Rotas para o caixa da sala de descanso
router.get('/descanso', FinanceiroController.listarTransacoesDescanso);
router.post('/descanso', FinanceiroController.adicionarTransacaoDescanso);
router.put('/descanso/:id', FinanceiroController.atualizarTransacaoDescanso);
router.delete('/descanso/:id', FinanceiroController.excluirTransacaoDescanso);
router.get('/descanso/relatorio', FinanceiroController.gerarRelatorioDescanso);

// Rotas para metas e itens para compra
router.get('/metas', FinanceiroController.listarMetas);
router.post('/metas', FinanceiroController.adicionarMeta);
router.put('/metas/:id', FinanceiroController.atualizarMeta);
router.delete('/metas/:id', FinanceiroController.excluirMeta);
router.put('/metas/:id/concluir', FinanceiroController.marcarMetaConcluida);
router.get('/metas/progresso/:tipo', FinanceiroController.atualizarProgressoMetas);

router.get('/itens-compra', FinanceiroController.listarItensCompra);
router.post('/itens-compra', FinanceiroController.adicionarItemCompra);
router.put('/itens-compra/:id', FinanceiroController.atualizarItemCompra);
router.delete('/itens-compra/:id', FinanceiroController.excluirItemCompra);

module.exports = router; 