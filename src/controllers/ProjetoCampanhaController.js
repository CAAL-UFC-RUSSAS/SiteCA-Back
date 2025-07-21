const ProjetoCampanha = require('../models/ProjetoCampanha');

module.exports = {
  // Listar projetos com filtros opcionais
  async index(req, res) {
    try {
      const { gestao, status } = req.query;
      let projetos;

      if (gestao && status) {
        projetos = await ProjetoCampanha.findByGestao(gestao);
        projetos = projetos.filter(p => p.status === status);
      } else if (gestao) {
        projetos = await ProjetoCampanha.findByGestao(gestao);
      } else if (status) {
        projetos = await ProjetoCampanha.findByStatus(status);
      } else {
        projetos = await ProjetoCampanha.findAtivos();
      }

      return res.json(projetos);
    } catch (error) {
      console.error('Erro ao listar projetos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Buscar projeto por ID
  async show(req, res) {
    try {
      const { id } = req.params;
      const projeto = await ProjetoCampanha.findById(id);

      if (!projeto) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }

      return res.json(projeto);
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Criar novo projeto
  async store(req, res) {
    try {
      const { titulo, descricao, status, progresso, gestao, ordem } = req.body;

      // Validar campos obrigatórios
      if (!titulo || !descricao || !gestao) {
        return res.status(400).json({ 
          error: 'Título, descrição e gestão são obrigatórios' 
        });
      }

      // Validar status
      const statusValidos = ['planejado', 'em andamento', 'concluído'];
      if (status && !statusValidos.includes(status)) {
        return res.status(400).json({ 
          error: 'Status deve ser: planejado, em andamento ou concluído' 
        });
      }

      // Validar progresso
      if (progresso !== undefined && (progresso < 0 || progresso > 100)) {
        return res.status(400).json({ 
          error: 'Progresso deve estar entre 0 e 100' 
        });
      }

      const projetoData = {
        titulo,
        descricao,
        status: status || 'planejado',
        progresso: progresso !== undefined ? progresso : 0,
        gestao,
        ordem: ordem || 0,
        ativo: true
      };

      const projeto = await ProjetoCampanha.create(projetoData);
      return res.status(201).json(projeto);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Atualizar projeto
  async update(req, res) {
    try {
      const { id } = req.params;
      const { titulo, descricao, status, progresso, gestao, ordem, ativo } = req.body;

      const projetoExistente = await ProjetoCampanha.findById(id);
      if (!projetoExistente) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }

      // Validar campos obrigatórios se fornecidos
      if (titulo !== undefined && !titulo) {
        return res.status(400).json({ error: 'Título não pode estar vazio' });
      }

      if (descricao !== undefined && !descricao) {
        return res.status(400).json({ error: 'Descrição não pode estar vazia' });
      }

      if (gestao !== undefined && !gestao) {
        return res.status(400).json({ error: 'Gestão não pode estar vazia' });
      }

      // Validar status se fornecido
      const statusValidos = ['planejado', 'em andamento', 'concluído'];
      if (status && !statusValidos.includes(status)) {
        return res.status(400).json({ 
          error: 'Status deve ser: planejado, em andamento ou concluído' 
        });
      }

      // Validar progresso se fornecido
      if (progresso !== undefined && (progresso < 0 || progresso > 100)) {
        return res.status(400).json({ 
          error: 'Progresso deve estar entre 0 e 100' 
        });
      }

      const projetoData = {};
      if (titulo !== undefined) projetoData.titulo = titulo;
      if (descricao !== undefined) projetoData.descricao = descricao;
      if (status !== undefined) projetoData.status = status;
      if (progresso !== undefined) projetoData.progresso = progresso;
      if (gestao !== undefined) projetoData.gestao = gestao;
      if (ordem !== undefined) projetoData.ordem = ordem;
      if (ativo !== undefined) projetoData.ativo = ativo;

      const projeto = await ProjetoCampanha.update(id, projetoData);
      return res.json(projeto);
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Deletar projeto
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const projeto = await ProjetoCampanha.findById(id);
      if (!projeto) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }

      await ProjetoCampanha.delete(id);
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Reordenar projetos
  async reordenar(req, res) {
    try {
      const { projetos } = req.body;

      if (!Array.isArray(projetos) || projetos.length === 0) {
        return res.status(400).json({ 
          error: 'Lista de projetos é obrigatória' 
        });
      }

      await ProjetoCampanha.reordenar(projetos);
      return res.json({ message: 'Projetos reordenados com sucesso' });
    } catch (error) {
      console.error('Erro ao reordenar projetos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Listar gestões distintas
  async gestoes(req, res) {
    try {
      const gestoes = await ProjetoCampanha.findGestoes();
      return res.json(gestoes);
    } catch (error) {
      console.error('Erro ao buscar gestões:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}; 