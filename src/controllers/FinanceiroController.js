const knex = require('knex');
const knexConfig = require('../../knexfile');
const db = knex(knexConfig.development);
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class FinanceiroController {
  // ===== CAIXA DO CA =====
  async listarTransacoesCA(req, res) {
    try {
      const transacoes = await db('transacoes_ca')
        .select('*')
        .orderBy('data', 'desc');
      
      return res.json(transacoes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar transações do CA' });
    }
  }

  async adicionarTransacaoCA(req, res) {
    const { descricao, valor, tipo, data } = req.body;

    if (!descricao || !valor || !tipo || !data) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    try {
      const id = await db('transacoes_ca').insert({
        descricao,
        valor,
        tipo, // 'entrada' ou 'saida'
        data,
        usuario_id: req.userId,
        created_at: new Date()
      }).returning('id');

      return res.status(201).json({ id: id[0], message: 'Transação adicionada com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao adicionar transação' });
    }
  }

  async atualizarTransacaoCA(req, res) {
    const { id } = req.params;
    const { descricao, valor, tipo, data } = req.body;

    try {
      await db('transacoes_ca')
        .where({ id })
        .update({
          descricao,
          valor,
          tipo,
          data,
          updated_at: new Date()
        });

      return res.json({ message: 'Transação atualizada com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar transação' });
    }
  }

  async excluirTransacaoCA(req, res) {
    const { id } = req.params;

    try {
      await db('transacoes_ca').where({ id }).del();
      return res.json({ message: 'Transação excluída com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir transação' });
    }
  }

  async gerarRelatorioCA(req, res) {
    try {
      const transacoes = await db('transacoes_ca')
        .select('*')
        .orderBy('data', 'desc');

      const saldoTotal = transacoes.reduce((acc, transacao) => {
        if (transacao.tipo === 'entrada') {
          return acc + parseFloat(transacao.valor);
        } else {
          return acc - parseFloat(transacao.valor);
        }
      }, 0);

      const relatorio = {
        transacoes,
        resumo: {
          saldoTotal,
          totalEntradas: transacoes
            .filter(t => t.tipo === 'entrada')
            .reduce((acc, t) => acc + parseFloat(t.valor), 0),
          totalSaidas: transacoes
            .filter(t => t.tipo === 'saida')
            .reduce((acc, t) => acc + parseFloat(t.valor), 0),
        }
      };

      return res.json(relatorio);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  }

  async gerarRelatorioMensalCA(req, res) {
    const { mes, ano } = req.params;

    try {
      const dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      const dataFim = new Date(parseInt(ano), parseInt(mes), 0);
      
      const transacoes = await db('transacoes_ca')
        .whereBetween('data', [dataInicio.toISOString(), dataFim.toISOString()])
        .orderBy('data', 'asc');

      const doc = new PDFDocument();
      const filename = `relatorio_ca_${mes}_${ano}.pdf`;
      const filepath = path.join(__dirname, '../../uploads', filename);
      
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      // Cabeçalho do relatório
      doc.fontSize(20).text('Relatório Financeiro do CA', {
        align: 'center'
      });
      doc.fontSize(14).text(`Período: ${mes}/${ano}`, {
        align: 'center'
      });
      doc.moveDown();

      // Resumo financeiro
      const totalEntradas = transacoes
        .filter(t => t.tipo === 'entrada')
        .reduce((acc, t) => acc + parseFloat(t.valor), 0);
        
      const totalSaidas = transacoes
        .filter(t => t.tipo === 'saida')
        .reduce((acc, t) => acc + parseFloat(t.valor), 0);
        
      const saldoMes = totalEntradas - totalSaidas;

      doc.fontSize(12).text(`Total de Entradas: R$ ${totalEntradas.toFixed(2)}`);
      doc.fontSize(12).text(`Total de Saídas: R$ ${totalSaidas.toFixed(2)}`);
      doc.fontSize(12).text(`Saldo do Mês: R$ ${saldoMes.toFixed(2)}`);
      doc.moveDown();

      // Tabela de transações
      doc.fontSize(16).text('Detalhamento de Transações:', {
        underline: true
      });
      doc.moveDown();

      // Cabeçalho da tabela
      let yPos = doc.y;
      doc.fontSize(10).text('Data', 50, yPos);
      doc.text('Descrição', 130, yPos);
      doc.text('Tipo', 300, yPos);
      doc.text('Valor (R$)', 370, yPos);
      doc.moveDown();

      // Linhas da tabela
      transacoes.forEach(transacao => {
        const data = new Date(transacao.data).toLocaleDateString('pt-BR');
        yPos = doc.y;
        doc.fontSize(10).text(data, 50, yPos);
        doc.text(transacao.descricao, 130, yPos, { width: 160 });
        doc.text(transacao.tipo === 'entrada' ? 'Entrada' : 'Saída', 300, yPos);
        doc.text(`R$ ${parseFloat(transacao.valor).toFixed(2)}`, 370, yPos);
        doc.moveDown();
      });

      doc.end();

      writeStream.on('finish', () => {
        res.download(filepath, filename, (err) => {
          if (err) {
            console.error('Erro ao enviar arquivo:', err);
            return res.status(500).send('Erro ao enviar o relatório');
          }
          
          // Remover o arquivo após o download
          fs.unlinkSync(filepath);
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao gerar relatório mensal' });
    }
  }

  // ===== CAIXA DA SALA DE DESCANSO =====
  async listarTransacoesDescanso(req, res) {
    try {
      const transacoes = await db('transacoes_descanso')
        .select('*')
        .orderBy('data', 'desc');
      
      return res.json(transacoes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar transações da sala de descanso' });
    }
  }

  async adicionarTransacaoDescanso(req, res) {
    const { descricao, valor, tipo, data } = req.body;

    if (!descricao || !valor || !tipo || !data) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    try {
      const id = await db('transacoes_descanso').insert({
        descricao,
        valor,
        tipo, // 'entrada' ou 'saida'
        data,
        usuario_id: req.userId,
        created_at: new Date()
      }).returning('id');

      return res.status(201).json({ id: id[0], message: 'Transação adicionada com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao adicionar transação' });
    }
  }

  async atualizarTransacaoDescanso(req, res) {
    const { id } = req.params;
    const { descricao, valor, tipo, data } = req.body;

    try {
      await db('transacoes_descanso')
        .where({ id })
        .update({
          descricao,
          valor,
          tipo,
          data,
          updated_at: new Date()
        });

      return res.json({ message: 'Transação atualizada com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar transação' });
    }
  }

  async excluirTransacaoDescanso(req, res) {
    const { id } = req.params;

    try {
      await db('transacoes_descanso').where({ id }).del();
      return res.json({ message: 'Transação excluída com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir transação' });
    }
  }

  async gerarRelatorioDescanso(req, res) {
    try {
      const transacoes = await db('transacoes_descanso')
        .select('*')
        .orderBy('data', 'desc');

      const saldoTotal = transacoes.reduce((acc, transacao) => {
        if (transacao.tipo === 'entrada') {
          return acc + parseFloat(transacao.valor);
        } else {
          return acc - parseFloat(transacao.valor);
        }
      }, 0);

      const relatorio = {
        transacoes,
        resumo: {
          saldoTotal,
          totalEntradas: transacoes
            .filter(t => t.tipo === 'entrada')
            .reduce((acc, t) => acc + parseFloat(t.valor), 0),
          totalSaidas: transacoes
            .filter(t => t.tipo === 'saida')
            .reduce((acc, t) => acc + parseFloat(t.valor), 0),
        }
      };

      return res.json(relatorio);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  }

  async gerarRelatorioMensalDescanso(req, res) {
    const { mes, ano } = req.params;

    try {
      const dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      const dataFim = new Date(parseInt(ano), parseInt(mes), 0);
      
      const transacoes = await db('transacoes_descanso')
        .whereBetween('data', [dataInicio.toISOString(), dataFim.toISOString()])
        .orderBy('data', 'asc');

      const doc = new PDFDocument();
      const filename = `relatorio_descanso_${mes}_${ano}.pdf`;
      const filepath = path.join(__dirname, '../../uploads', filename);
      
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      // Cabeçalho do relatório
      doc.fontSize(20).text('Relatório Financeiro da Sala de Descanso', {
        align: 'center'
      });
      doc.fontSize(14).text(`Período: ${mes}/${ano}`, {
        align: 'center'
      });
      doc.moveDown();

      // Resumo financeiro
      const totalEntradas = transacoes
        .filter(t => t.tipo === 'entrada')
        .reduce((acc, t) => acc + parseFloat(t.valor), 0);
        
      const totalSaidas = transacoes
        .filter(t => t.tipo === 'saida')
        .reduce((acc, t) => acc + parseFloat(t.valor), 0);
        
      const saldoMes = totalEntradas - totalSaidas;

      doc.fontSize(12).text(`Total de Entradas: R$ ${totalEntradas.toFixed(2)}`);
      doc.fontSize(12).text(`Total de Saídas: R$ ${totalSaidas.toFixed(2)}`);
      doc.fontSize(12).text(`Saldo do Mês: R$ ${saldoMes.toFixed(2)}`);
      doc.moveDown();

      // Tabela de transações
      doc.fontSize(16).text('Detalhamento de Transações:', {
        underline: true
      });
      doc.moveDown();

      // Cabeçalho da tabela
      let yPos = doc.y;
      doc.fontSize(10).text('Data', 50, yPos);
      doc.text('Descrição', 130, yPos);
      doc.text('Tipo', 300, yPos);
      doc.text('Valor (R$)', 370, yPos);
      doc.moveDown();

      // Linhas da tabela
      transacoes.forEach(transacao => {
        const data = new Date(transacao.data).toLocaleDateString('pt-BR');
        yPos = doc.y;
        doc.fontSize(10).text(data, 50, yPos);
        doc.text(transacao.descricao, 130, yPos, { width: 160 });
        doc.text(transacao.tipo === 'entrada' ? 'Entrada' : 'Saída', 300, yPos);
        doc.text(`R$ ${parseFloat(transacao.valor).toFixed(2)}`, 370, yPos);
        doc.moveDown();
      });

      doc.end();

      writeStream.on('finish', () => {
        res.download(filepath, filename, (err) => {
          if (err) {
            console.error('Erro ao enviar arquivo:', err);
            return res.status(500).send('Erro ao enviar o relatório');
          }
          
          // Remover o arquivo após o download
          fs.unlinkSync(filepath);
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao gerar relatório mensal' });
    }
  }

  // ===== METAS E ITENS PARA COMPRA =====
  async listarMetas(req, res) {
    try {
      const metas = await db('metas').select('*').orderBy('dataLimite');
      return res.json(metas);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar metas de arrecadação' });
    }
  }
  
  async adicionarMeta(req, res) {
    const { descricao, valorNecessario, valorArrecadado, dataLimite, tipo } = req.body;
    
    if (!descricao || !valorNecessario || !dataLimite || !tipo) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    try {
      const id = await db('metas').insert({
        descricao,
        valorNecessario,
        valorArrecadado: valorArrecadado || 0,
        dataLimite,
        tipo
      }).returning('id');
      
      // Buscar a meta criada usando o valor numérico do ID
      const novaMeta = await db('metas').where({ id: id[0].id || id[0] }).first();
      
      return res.status(201).json(novaMeta);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao adicionar meta' });
    }
  }
  
  async atualizarMeta(req, res) {
    const { id } = req.params;
    const { descricao, valorNecessario, valorArrecadado, dataLimite, tipo } = req.body;
    
    if (!descricao || !valorNecessario || !dataLimite || !tipo) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    try {
      await db('metas')
        .where({ id })
        .update({
          descricao,
          valorNecessario,
          valorArrecadado: valorArrecadado || 0,
          dataLimite,
          tipo,
          updated_at: new Date()
        });
      
      const metaAtualizada = await db('metas').where({ id }).first();
      
      return res.json(metaAtualizada);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar meta' });
    }
  }
  
  async excluirMeta(req, res) {
    const { id } = req.params;
    
    try {
      await db('metas').where({ id }).del();
      return res.json({ message: 'Meta excluída com sucesso', id: parseInt(id) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir meta' });
    }
  }
  
  async listarItensCompra(req, res) {
    try {
      const itensCompra = await db('itens_compra').select('*').orderBy('prioridade', 'desc');
      return res.json(itensCompra);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar itens para compra' });
    }
  }
  
  async adicionarItemCompra(req, res) {
    const { nome, descricao, prioridade, valorEstimado, tipo } = req.body;
    
    if (!nome || !descricao || !prioridade || !valorEstimado || !tipo) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    try {
      const [id] = await db('itens_compra').insert({
        nome,
        descricao,
        prioridade,
        valorEstimado,
        tipo
      }).returning('id');
      
      // Buscar o item criado usando o valor numérico do ID
      const novoItem = await db('itens_compra').where({ id: id.id || id }).first();
      
      return res.status(201).json(novoItem);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao adicionar item' });
    }
  }
  
  async atualizarItemCompra(req, res) {
    const { id } = req.params;
    const { nome, descricao, prioridade, valorEstimado, tipo } = req.body;
    
    if (!nome || !descricao || !prioridade || !valorEstimado || !tipo) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    try {
      await db('itens_compra')
        .where({ id })
        .update({
          nome,
          descricao,
          prioridade,
          valorEstimado,
          tipo,
          updated_at: new Date()
        });
      
      const itemAtualizado = await db('itens_compra').where({ id }).first();
      
      return res.json(itemAtualizado);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar item' });
    }
  }
  
  async excluirItemCompra(req, res) {
    const { id } = req.params;
    
    try {
      await db('itens_compra').where({ id }).del();
      return res.json({ message: 'Item excluído com sucesso', id: parseInt(id) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir item' });
    }
  }
  
  // ===== TRANSPARÊNCIA =====
  async obterDadosTransparencia(req, res) {
    try {
      // Dados do caixa do CA
      const transacoesCA = await db('transacoes_ca')
        .select('*')
        .orderBy('data', 'desc');

      // Dados do caixa da sala de descanso
      const transacoesDescanso = await db('transacoes_descanso')
        .select('*')
        .orderBy('data', 'desc');

      // Calcular resumos
      const resumoCA = {
        saldoTotal: transacoesCA.reduce((acc, t) => {
          return t.tipo === 'entrada' 
            ? acc + parseFloat(t.valor) 
            : acc - parseFloat(t.valor);
        }, 0),
        totalEntradas: transacoesCA
          .filter(t => t.tipo === 'entrada')
          .reduce((acc, t) => acc + parseFloat(t.valor), 0),
        totalSaidas: transacoesCA
          .filter(t => t.tipo === 'saida')
          .reduce((acc, t) => acc + parseFloat(t.valor), 0),
      };

      const resumoDescanso = {
        saldoTotal: transacoesDescanso.reduce((acc, t) => {
          return t.tipo === 'entrada' 
            ? acc + parseFloat(t.valor) 
            : acc - parseFloat(t.valor);
        }, 0),
        totalEntradas: transacoesDescanso
          .filter(t => t.tipo === 'entrada')
          .reduce((acc, t) => acc + parseFloat(t.valor), 0),
        totalSaidas: transacoesDescanso
          .filter(t => t.tipo === 'saida')
          .reduce((acc, t) => acc + parseFloat(t.valor), 0),
      };

      return res.json({
        ca: {
          transacoes: transacoesCA,
          resumo: resumoCA
        },
        descanso: {
          transacoes: transacoesDescanso,
          resumo: resumoDescanso
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao obter dados de transparência' });
    }
  }

  async obterDadosTransparenciaCompletos(req, res) {
    try {
      // Dados do caixa do CA
      const transacoesCA = await db('transacoes_ca')
        .select('*')
        .orderBy('data', 'desc');

      // Dados do caixa da sala de descanso
      const transacoesDescanso = await db('transacoes_descanso')
        .select('*')
        .orderBy('data', 'desc');

      // Calcular resumos
      const resumoCA = {
        saldoTotal: transacoesCA.reduce((acc, t) => {
          return t.tipo === 'entrada' 
            ? acc + parseFloat(t.valor) 
            : acc - parseFloat(t.valor);
        }, 0),
        totalEntradas: transacoesCA
          .filter(t => t.tipo === 'entrada')
          .reduce((acc, t) => acc + parseFloat(t.valor), 0),
        totalSaidas: transacoesCA
          .filter(t => t.tipo === 'saida')
          .reduce((acc, t) => acc + parseFloat(t.valor), 0),
      };

      const resumoDescanso = {
        saldoTotal: transacoesDescanso.reduce((acc, t) => {
          return t.tipo === 'entrada' 
            ? acc + parseFloat(t.valor) 
            : acc - parseFloat(t.valor);
        }, 0),
        totalEntradas: transacoesDescanso
          .filter(t => t.tipo === 'entrada')
          .reduce((acc, t) => acc + parseFloat(t.valor), 0),
        totalSaidas: transacoesDescanso
          .filter(t => t.tipo === 'saida')
          .reduce((acc, t) => acc + parseFloat(t.valor), 0),
      };
      
      // Buscar metas do banco de dados
      const metas = await db('metas').select('*').orderBy('dataLimite');
      
      // Buscar itens de compra do banco de dados
      const itensCompra = await db('itens_compra').select('*').orderBy('prioridade', 'desc');

      return res.json({
        ca: {
          transacoes: transacoesCA,
          resumo: resumoCA
        },
        descanso: {
          transacoes: transacoesDescanso,
          resumo: resumoDescanso
        },
        metas,
        itensCompra
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao obter dados de transparência' });
    }
  }

  async marcarMetaConcluida(req, res) {
    const { id } = req.params;
    
    try {
      // Obter a meta atual
      const meta = await db('metas').where({ id }).first();
      
      if (!meta) {
        return res.status(404).json({ error: 'Meta não encontrada' });
      }
      
      // Atualizar a meta para igualar o valor arrecadado ao necessário
      await db('metas')
        .where({ id })
        .update({
          valorArrecadado: meta.valorNecessario,
          updated_at: new Date()
        });
      
      const metaAtualizada = await db('metas').where({ id }).first();
      
      return res.json(metaAtualizada);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao marcar meta como concluída' });
    }
  }

  async atualizarProgressoMetas(req, res) {
    const { tipo } = req.params; // 'ca' ou 'descanso'
    
    try {
      // Obter o saldo atual do tipo especificado
      let saldoAtual = 0;
      
      if (tipo === 'ca') {
        const transacoesCA = await db('transacoes_ca').select('*');
        saldoAtual = transacoesCA.reduce((acc, t) => {
          return t.tipo === 'entrada' 
            ? acc + parseFloat(t.valor) 
            : acc - parseFloat(t.valor);
        }, 0);
      } else if (tipo === 'descanso') {
        const transacoesDescanso = await db('transacoes_descanso').select('*');
        saldoAtual = transacoesDescanso.reduce((acc, t) => {
          return t.tipo === 'entrada' 
            ? acc + parseFloat(t.valor) 
            : acc - parseFloat(t.valor);
        }, 0);
      }
      
      // Obter metas do tipo especificado que não estão concluídas (valor arrecadado < valor necessário)
      const metas = await db('metas')
        .where({ tipo })
        .whereRaw('CAST("valorArrecadado" AS DECIMAL) < CAST("valorNecessario" AS DECIMAL)')
        .orderBy('dataLimite');
      
      // Atualizar o progresso de cada meta com base no saldo disponível
      let saldoRestante = saldoAtual;
      const metasAtualizadas = [];
      
      for (const meta of metas) {
        if (saldoRestante > 0) {
          const valorArrecadadoAtual = Math.min(meta.valorNecessario, saldoRestante);
          await db('metas')
            .where({ id: meta.id })
            .update({ 
              valorArrecadado: valorArrecadadoAtual,
              updated_at: new Date()
            });
          
          saldoRestante -= valorArrecadadoAtual;
          
          const metaAtualizada = await db('metas').where({ id: meta.id }).first();
          metasAtualizadas.push(metaAtualizada);
        }
      }
      
      return res.json({
        saldoAtual,
        metasAtualizadas
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar progresso das metas' });
    }
  }
}

module.exports = new FinanceiroController(); 