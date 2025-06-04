const Aviso = require('../models/aviso');

module.exports = {
  // Listar todos os avisos
  async index(req, res) {
    try {
      const avisos = await Aviso.findAll();
      return res.json(avisos);
    } catch (error) {
      console.error('Erro ao listar avisos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Listar avisos ativos (data atual entre data_inicio e data_fim)
  async ativos(req, res) {
    try {
      const avisos = await Aviso.findAtivos();
      return res.json(avisos);
    } catch (error) {
      console.error('Erro ao listar avisos ativos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Buscar um aviso específico
  async show(req, res) {
    try {
      const { id } = req.params;
      const aviso = await Aviso.findById(id);

      if (!aviso) {
        return res.status(404).json({ error: 'Aviso não encontrado' });
      }

      return res.json(aviso);
    } catch (error) {
      console.error('Erro ao buscar aviso:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Criar um novo aviso
  async store(req, res) {
    try {
      const { titulo, descricao, link, data_inicio, data_fim } = req.body;
      
      // Validação básica
      if (!titulo) {
        return res.status(400).json({ error: 'Título é obrigatório' });
      }
      
      if (!data_inicio) {
        return res.status(400).json({ error: 'Data de início é obrigatória' });
      }
      
      const aviso = await Aviso.create({
        titulo,
        descricao,
        link,
        data_inicio,
        data_fim
      });
      
      return res.status(201).json(aviso);
    } catch (error) {
      console.error('Erro ao criar aviso:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Atualizar um aviso
  async update(req, res) {
    try {
      const { id } = req.params;
      const { titulo, descricao, link, data_inicio, data_fim } = req.body;

      const aviso = await Aviso.findById(id);

      if (!aviso) {
        return res.status(404).json({ error: 'Aviso não encontrado' });
      }

      const avisoAtualizado = await Aviso.update(id, {
        titulo,
        descricao,
        link,
        data_inicio,
        data_fim
      });

      return res.json(avisoAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar aviso:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Deletar um aviso
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const aviso = await Aviso.findById(id);

      if (!aviso) {
        return res.status(404).json({ error: 'Aviso não encontrado' });
      }

      await Aviso.delete(id);

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar aviso:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}; 