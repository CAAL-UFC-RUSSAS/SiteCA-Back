const MembroGestao = require('../models/MembroGestao');

module.exports = {
  // Listar todos os membros
  async index(req, res) {
    try {
      const { gestao, status } = req.query;
      
      let membros;
      
      if (gestao) {
        membros = await MembroGestao.findByGestao(gestao);
      } else if (status) {
        membros = await MembroGestao.findByStatus(status);
      } else {
        membros = await MembroGestao.findAtivos();
      }
      
      // Adicionar URL da foto em base64 para cada membro
      const membrosComUrl = membros.map(membro => ({
        ...membro,
        foto_url: membro.foto_base64 ? `data:${membro.foto_mime};base64,${membro.foto_base64}` : null
      }));
      
      return res.json(membrosComUrl);
    } catch (error) {
      console.error('Erro ao listar membros:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Buscar um membro específico
  async show(req, res) {
    try {
      const { id } = req.params;
      const membro = await MembroGestao.findById(id);

      if (!membro) {
        return res.status(404).json({ error: 'Membro não encontrado' });
      }

      // Adicionar a URL da foto na resposta
      const membroComUrl = {
        ...membro,
        foto_url: membro.foto_base64 ? `data:${membro.foto_mime};base64,${membro.foto_base64}` : null
      };

      return res.json(membroComUrl);
    } catch (error) {
      console.error('Erro ao buscar membro:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Criar um novo membro
  async store(req, res) {
    try {
      const { nome, cargo, area, descricao, contato, gestao, status, ordem, ativo, foto } = req.body;
      
      // Validação básica
      if (!nome || !cargo || !area || !descricao || !gestao || !foto) {
        return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
      }
      
      let foto_base64 = null;
      let foto_mime = null;
      
      if (foto) {
        try {
          // Extrair os dados da foto
          let base64Data = foto;
          let mimeType = 'image/jpeg'; // Tipo padrão
          
          if (foto.startsWith('data:')) {
            const [header, data] = foto.split(',');
            if (!header || !data) {
              throw new Error('Formato de foto inválido');
            }
            
            const mimeMatch = header.match(/data:([^;]+);/);
            if (mimeMatch) {
              mimeType = mimeMatch[1];
            }
            base64Data = data;
          }
          
          // Converter base64 para buffer e verificar tamanho
          const fotoBuffer = Buffer.from(base64Data, 'base64');
          const tamanhoMB = fotoBuffer.length / (1024 * 1024);
          const LIMITE_MB = 5;
          
          if (tamanhoMB > LIMITE_MB) {
            throw new Error(`Foto muito grande. Limite: ${LIMITE_MB}MB. Atual: ${tamanhoMB.toFixed(2)}MB`);
          }
          
          foto_mime = mimeType;
          foto_base64 = base64Data;
        } catch (error) {
          console.error('Erro ao processar foto do membro:', error);
          throw new Error('Erro ao processar foto: ' + error.message);
        }
      }
      
      const membro = await MembroGestao.create({
        nome,
        cargo,
        area,
        descricao,
        contato,
        foto_base64,
        foto_mime,
        gestao,
        status: status || 'atual',
        ordem: ordem || 0,
        ativo: ativo !== undefined ? ativo : true
      });
      
      // Adicionar a URL da foto na resposta
      const membroComUrl = {
        ...membro,
        foto_url: membro.foto_base64 ? `data:${membro.foto_mime};base64,${membro.foto_base64}` : null
      };
      
      return res.status(201).json(membroComUrl);
    } catch (error) {
      console.error('Erro ao criar membro:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
  },

  // Atualizar um membro
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nome, cargo, area, descricao, contato, gestao, status, ordem, ativo, foto } = req.body;
      
      const membroExistente = await MembroGestao.findById(id);
      if (!membroExistente) {
        return res.status(404).json({ error: 'Membro não encontrado' });
      }
      
      let foto_base64 = membroExistente.foto_base64;
      let foto_mime = membroExistente.foto_mime;
      
      // Se uma nova foto foi enviada, processar
      if (foto && foto !== membroExistente.foto_url) {
        try {
          let base64Data = foto;
          let mimeType = 'image/jpeg';
          
          if (foto.startsWith('data:')) {
            const [header, data] = foto.split(',');
            if (!header || !data) {
              throw new Error('Formato de foto inválido');
            }
            
            const mimeMatch = header.match(/data:([^;]+);/);
            if (mimeMatch) {
              mimeType = mimeMatch[1];
            }
            base64Data = data;
          }
          
          const fotoBuffer = Buffer.from(base64Data, 'base64');
          const tamanhoMB = fotoBuffer.length / (1024 * 1024);
          const LIMITE_MB = 5;
          
          if (tamanhoMB > LIMITE_MB) {
            throw new Error(`Foto muito grande. Limite: ${LIMITE_MB}MB. Atual: ${tamanhoMB.toFixed(2)}MB`);
          }
          
          foto_mime = mimeType;
          foto_base64 = base64Data;
        } catch (error) {
          console.error('Erro ao processar nova foto:', error);
          throw new Error('Erro ao processar foto: ' + error.message);
        }
      }
      
      const membro = await MembroGestao.update(id, {
        nome,
        cargo,
        area,
        descricao,
        contato,
        foto_base64,
        foto_mime,
        gestao,
        status,
        ordem,
        ativo
      });
      
      // Adicionar a URL da foto na resposta
      const membroComUrl = {
        ...membro,
        foto_url: membro.foto_base64 ? `data:${membro.foto_mime};base64,${membro.foto_base64}` : null
      };
      
      return res.json(membroComUrl);
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
  },

  // Deletar um membro
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const membro = await MembroGestao.findById(id);

      if (!membro) {
        return res.status(404).json({ error: 'Membro não encontrado' });
      }

      await MembroGestao.delete(id);
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar membro:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Reordenar membros
  async reordenar(req, res) {
    try {
      const { membroIds } = req.body;
      
      if (!Array.isArray(membroIds)) {
        return res.status(400).json({ error: 'IDs dos membros devem ser um array' });
      }
      
      await MembroGestao.reordenar(membroIds);
      return res.json({ message: 'Membros reordenados com sucesso' });
    } catch (error) {
      console.error('Erro ao reordenar membros:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Buscar gestões disponíveis
  async gestoes(req, res) {
    try {
      const gestoes = await MembroGestao.findGestoes();
      return res.json(gestoes);
    } catch (error) {
      console.error('Erro ao buscar gestões:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}; 