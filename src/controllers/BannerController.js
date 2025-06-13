const Banner = require('../models/Banner');

module.exports = {
  // Listar todos os banners
  async index(req, res) {
    try {
      console.log('🏁 Iniciando listagem de banners');
      const banners = await Banner.findAll();
      
      console.log(`📋 ${banners.length} banners encontrados`);
      
      // Adicionar URL da imagem em base64 para cada banner
      const bannersComUrl = banners.map(banner => ({
        ...banner,
        imagem_url: banner.imagem_base64 ? `data:${banner.imagem_mime};base64,${banner.imagem_base64}` : null
      }));
      
      return res.json(bannersComUrl);
    } catch (error) {
      console.error('❌ Erro ao listar banners:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Buscar banners ativos
  async ativos(req, res) {
    try {
      console.log('🏁 Iniciando listagem de banners ativos');
      const banners = await Banner.findAtivos();
      
      console.log(`📋 ${banners.length} banners ativos encontrados`);
      
      // Adicionar URL da imagem em base64 para cada banner
      const bannersComUrl = banners.map(banner => ({
        ...banner,
        imagem_url: banner.imagem_base64 ? `data:${banner.imagem_mime};base64,${banner.imagem_base64}` : null
      }));
      
      return res.json(bannersComUrl);
    } catch (error) {
      console.error('❌ Erro ao listar banners ativos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Buscar um banner específico
  async show(req, res) {
    try {
      const { id } = req.params;
      const banner = await Banner.findById(id);

      if (!banner) {
        return res.status(404).json({ error: 'Banner não encontrado' });
      }

      // Adicionar URL da imagem em base64
      const bannerComUrl = {
        ...banner,
        imagem_url: banner.imagem_base64 ? `data:${banner.imagem_mime};base64,${banner.imagem_base64}` : null
      };

      return res.json(bannerComUrl);
    } catch (error) {
      console.error('Erro ao buscar banner:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Criar um novo banner
  async store(req, res) {
    try {
      const { titulo, descricao, link, tipo, ativo, posicao, imagem } = req.body;
      
      let imagem_base64 = null;
      let imagem_mime = null;
      
      if (imagem) {
        try {
          // Extrair os dados da imagem
          let base64Data = imagem;
          let mimeType = 'image/jpeg'; // Tipo padrão
          
          if (imagem.startsWith('data:')) {
            const [header, data] = imagem.split(',');
            if (!header || !data) {
              throw new Error('Formato de imagem inválido');
            }
            
            const mimeMatch = header.match(/data:([^;]+);/);
            if (mimeMatch) {
              mimeType = mimeMatch[1];
            }
            base64Data = data;
          }
          
          // Converter base64 para buffer e verificar tamanho
          const imagemBuffer = Buffer.from(base64Data, 'base64');
          const tamanhoMB = imagemBuffer.length / (1024 * 1024);
          const LIMITE_MB = 10;
          
          if (tamanhoMB > LIMITE_MB) {
            throw new Error(`Imagem muito grande. Limite: ${LIMITE_MB}MB. Atual: ${tamanhoMB.toFixed(2)}MB`);
          }
          
          imagem_mime = mimeType;
          imagem_base64 = base64Data;
        } catch (error) {
          console.error('Erro ao processar imagem do banner:', error);
          throw new Error('Erro ao processar imagem: ' + error.message);
        }
      }
      
      const banner = await Banner.create({
        titulo,
        descricao,
        link,
        tipo: tipo || 'principal',
        imagem_base64,
        imagem_mime,
        posicao: posicao || 0,
        ativo: ativo !== undefined ? ativo : true
      });
      
      // Adicionar a URL da imagem na resposta
      const bannerComUrl = {
        ...banner,
        imagem_url: banner.imagem_base64 ? `data:${banner.imagem_mime};base64,${banner.imagem_base64}` : null
      };
      
      res.status(201).json(bannerComUrl);
    } catch (error) {
      console.error('Erro ao criar banner:', error);
      res.status(500).json({ error: 'Erro ao criar banner: ' + error.message });
    }
  },

  // Atualizar um banner
  async update(req, res) {
    try {
      const { id } = req.params;
      const { titulo, descricao, link, tipo, ativo, posicao, imagem } = req.body;

      const banner = await Banner.findById(id);

      if (!banner) {
        return res.status(404).json({ error: 'Banner não encontrado' });
      }

      let imagem_base64 = banner.imagem_base64;
      let imagem_mime = banner.imagem_mime;
      
      if (imagem) {
        try {
          // Extrair os dados da imagem
          let base64Data = imagem;
          let mimeType = 'image/jpeg'; // Tipo padrão
          
          if (imagem.startsWith('data:')) {
            const [header, data] = imagem.split(',');
            if (!header || !data) {
              throw new Error('Formato de imagem inválido');
            }
            
            const mimeMatch = header.match(/data:([^;]+);/);
            if (mimeMatch) {
              mimeType = mimeMatch[1];
            }
            base64Data = data;
          }
          
          // Converter base64 para buffer e verificar tamanho
          const imagemBuffer = Buffer.from(base64Data, 'base64');
          const tamanhoMB = imagemBuffer.length / (1024 * 1024);
          const LIMITE_MB = 10;
          
          if (tamanhoMB > LIMITE_MB) {
            throw new Error(`Imagem muito grande. Limite: ${LIMITE_MB}MB. Atual: ${tamanhoMB.toFixed(2)}MB`);
          }
          
          imagem_mime = mimeType;
          imagem_base64 = base64Data;
        } catch (error) {
          console.error('Erro ao processar imagem do banner:', error);
          throw new Error('Erro ao processar imagem: ' + error.message);
        }
      }
      
      const bannerAtualizado = await Banner.update(id, {
        titulo: titulo !== undefined ? titulo : banner.titulo,
        descricao: descricao !== undefined ? descricao : banner.descricao,
        link: link !== undefined ? link : banner.link,
        tipo: tipo !== undefined ? tipo : banner.tipo,
        imagem_base64,
        imagem_mime,
        posicao: posicao !== undefined ? posicao : banner.posicao,
        ativo: ativo !== undefined ? ativo : banner.ativo
      });
      
      // Adicionar a URL da imagem na resposta
      const bannerComUrl = {
        ...bannerAtualizado,
        imagem_url: bannerAtualizado.imagem_base64 ? `data:${bannerAtualizado.imagem_mime};base64,${bannerAtualizado.imagem_base64}` : null
      };
      
      res.json(bannerComUrl);
    } catch (error) {
      console.error('Erro ao atualizar banner:', error);
      res.status(500).json({ error: 'Erro ao atualizar banner: ' + error.message });
    }
  },

  // Excluir um banner
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const banner = await Banner.findById(id);

      if (!banner) {
        return res.status(404).json({ error: 'Banner não encontrado' });
      }

      await Banner.delete(id);
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir banner:', error);
      return res.status(500).json({ error: 'Erro ao excluir banner' });
    }
  },
  
  // Reordenar banners
  async reordenar(req, res) {
    try {
      const { bannerIds } = req.body;
      
      if (!Array.isArray(bannerIds) || bannerIds.length === 0) {
        return res.status(400).json({ error: 'Lista de IDs inválida' });
      }
      
      await Banner.reordenar(bannerIds);
      return res.json({ success: true });
    } catch (error) {
      console.error('Erro ao reordenar banners:', error);
      return res.status(500).json({ error: 'Erro ao reordenar banners' });
    }
  }
}; 