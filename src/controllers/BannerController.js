const Banner = require('../models/Banner');
const fs = require('fs').promises;
const path = require('path');

// Definir o caminho da pasta banners
const BANNERS_DIR = path.join(__dirname, '..', '..', 'uploads', 'banners');

module.exports = {
  // Listar todos os banners
  async index(req, res) {
    try {
      console.log('🏁 Iniciando listagem de banners');
      const banners = await Banner.findAll();
      
      console.log(`📋 ${banners.length} banners encontrados`);
      
      // Adicionar URL completa para cada banner
      const bannersComUrl = banners.map(banner => ({
        ...banner,
        imagem_url: banner.imagem_nome ? `${req.protocol}://${req.get('host')}/uploads/banners/${banner.imagem_nome}` : null
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
      
      // Adicionar URL completa para cada banner
      const bannersComUrl = banners.map(banner => ({
        ...banner,
        imagem_url: banner.imagem_nome ? `${req.protocol}://${req.get('host')}/uploads/banners/${banner.imagem_nome}` : null
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

      // Adicionar URL da imagem
      const bannerComUrl = {
        ...banner,
        imagem_url: banner.imagem_nome ? `${req.protocol}://${req.get('host')}/uploads/banners/${banner.imagem_nome}` : null
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
      
      // Verificar se a pasta de banners existe
      try {
        await fs.access(BANNERS_DIR);
        console.log('Pasta banners já existe em:', BANNERS_DIR);
      } catch {
        await fs.mkdir(BANNERS_DIR, { recursive: true });
        console.log('Pasta banners criada em:', BANNERS_DIR);
      }
      
      let imagem_nome = null;
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
          const extensao = mimeType.split('/')[1];
          
          // Gerar nome único para o arquivo
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(7);
          imagem_nome = `banner-${timestamp}-${randomStr}.${extensao}`;
          
          // Salvar a imagem
          const imagemPath = path.join(BANNERS_DIR, imagem_nome);
          
          await fs.writeFile(imagemPath, imagemBuffer);
          console.log('Banner salvo com sucesso em:', imagemPath);
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
        imagem_nome,
        imagem_mime,
        posicao: posicao || 0,
        ativo: ativo !== undefined ? ativo : true
      });
      
      // Adicionar a URL da imagem na resposta
      const bannerComUrl = {
        ...banner,
        imagem_url: imagem_nome ? `${req.protocol}://${req.get('host')}/uploads/banners/${imagem_nome}` : null
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

      let imagem_nome = banner.imagem_nome;
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
          
          // Se houver uma imagem anterior, excluí-la
          if (banner.imagem_nome) {
            try {
              const imagemAnteriorPath = path.join(BANNERS_DIR, banner.imagem_nome);
              await fs.unlink(imagemAnteriorPath);
              console.log('Imagem anterior excluída:', imagemAnteriorPath);
            } catch (error) {
              console.error('Erro ao excluir imagem anterior:', error);
              // Não interrompe o fluxo em caso de erro na exclusão
            }
          }
          
          imagem_mime = mimeType;
          const extensao = mimeType.split('/')[1];
          
          // Gerar nome único para o arquivo
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(7);
          imagem_nome = `banner-${timestamp}-${randomStr}.${extensao}`;
          
          // Salvar a imagem
          const imagemPath = path.join(BANNERS_DIR, imagem_nome);
          
          await fs.writeFile(imagemPath, imagemBuffer);
          console.log('Banner atualizado com sucesso em:', imagemPath);
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
        imagem_nome,
        imagem_mime,
        posicao: posicao !== undefined ? posicao : banner.posicao,
        ativo: ativo !== undefined ? ativo : banner.ativo
      });
      
      // Adicionar a URL da imagem na resposta
      const bannerComUrl = {
        ...bannerAtualizado,
        imagem_url: imagem_nome ? `${req.protocol}://${req.get('host')}/uploads/banners/${imagem_nome}` : null
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

      // Excluir a imagem associada, se existir
      if (banner.imagem_nome) {
        try {
          const imagemPath = path.join(BANNERS_DIR, banner.imagem_nome);
          await fs.unlink(imagemPath);
          console.log('Imagem excluída:', imagemPath);
        } catch (error) {
          console.error('Erro ao excluir imagem:', error);
          // Não interrompe o fluxo em caso de erro na exclusão
        }
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