const Produto = require('../models/Produto');
const fs = require('fs').promises;
const path = require('path');

// Definir o caminho da pasta uploads
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// URL base para imagens - usar variável de ambiente ou fallback para localhost
const BASE_URL = process.env.BASE_URL || 'http://localhost:3333';

module.exports = {
  // Listar todos os produtos
  async index(req, res) {
    try {
      const produtos = await Produto.findAll();
      
      // Adicionar URLs completas para as imagens
      const produtosComUrl = produtos.map(produto => ({
        ...produto,
        imagem_url: produto.imagem_nome ? `${BASE_URL}/uploads/${produto.imagem_nome}` : null
      }));
      
      return res.json(produtosComUrl);
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Buscar um produto específico
  async show(req, res) {
    try {
      const { id } = req.params;
      const produto = await Produto.findById(id);

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Adicionar URL completa para a imagem
      const produtoComUrl = {
        ...produto,
        imagem_url: produto.imagem_nome ? `${BASE_URL}/uploads/${produto.imagem_nome}` : null
      };

      return res.json(produtoComUrl);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Criar um novo produto
  async store(req, res) {
    try {
      const { nome, descricao, preco, quantidade, disponivel, tags, imagem } = req.body;
      
      console.log('Recebendo requisição para criar produto:', {
        nome,
        temImagem: !!imagem,
        tamanhoImagem: imagem ? imagem.length : 0,
        tags
      });
      
      // Verificar se a pasta uploads existe
      try {
        await fs.access(UPLOADS_DIR);
        console.log('Pasta uploads já existe em:', UPLOADS_DIR);
      } catch {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        console.log('Pasta uploads criada em:', UPLOADS_DIR);
      }
      
      let imagem_nome = null;
      let imagem_mime = null;
      
      if (imagem) {
        try {
          // Verificar se a imagem está em formato base64
          if (typeof imagem !== 'string') {
            throw new Error('Formato de imagem inválido');
          }

          // Se a imagem não começar com data:, assumir que é base64 puro
          let base64Data = imagem;
          let mimeType = 'image/png'; // Tipo padrão para PNG

          if (imagem.startsWith('data:')) {
            // Extrair os dados da imagem
            const [header, data] = imagem.split(',');
            if (!header || !data) {
              throw new Error('Formato de imagem inválido');
            }

            // Extrair o tipo MIME e a extensão
            const mimeMatch = header.match(/data:([^;]+);/);
            if (mimeMatch) {
              mimeType = mimeMatch[1];
            }
            base64Data = data;
          }

          // VALIDAÇÃO DE TAMANHO: Converter base64 para buffer e verificar tamanho
          const imagemBuffer = Buffer.from(base64Data, 'base64');
          const tamanhoMB = imagemBuffer.length / (1024 * 1024); // Converter para MB
          const LIMITE_MB = 10;
          
          if (tamanhoMB > LIMITE_MB) {
            throw new Error(`Imagem muito grande. Tamanho máximo: ${LIMITE_MB}MB. Tamanho atual: ${tamanhoMB.toFixed(2)}MB`);
          }

          imagem_mime = mimeType;
          const extensao = mimeType.split('/')[1];
          
          // Gerar nome único para o arquivo
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(7);
          imagem_nome = `${timestamp}-${randomStr}.${extensao}`;
          
          // Salvar a imagem
          const imagemPath = path.join(UPLOADS_DIR, imagem_nome);
          
          console.log('Salvando imagem:', {
            nome: imagem_nome,
            mime: imagem_mime,
            tamanho: `${tamanhoMB.toFixed(2)}MB`,
            caminho: imagemPath
          });
          
          await fs.writeFile(imagemPath, imagemBuffer);
          console.log('Imagem salva com sucesso em:', imagemPath);
          
          // Verificar se o arquivo foi salvo corretamente
          const stats = await fs.stat(imagemPath);
          console.log('Arquivo verificado:', {
            nome: imagem_nome,
            tamanho: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`,
            criado: stats.birthtime,
            modificado: stats.mtime
          });
          
          // Verificar se o arquivo pode ser lido
          const fileContent = await fs.readFile(imagemPath);
          console.log('Arquivo pode ser lido, tamanho:', `${(fileContent.length / (1024 * 1024)).toFixed(2)}MB`);
        } catch (error) {
          console.error('Erro ao processar imagem:', error);
          throw new Error('Erro ao processar imagem: ' + error.message);
        }
      }
      
      // Garantir que tags seja um array válido
      const tagsArray = Array.isArray(tags) ? tags : [];
      
      const produto = await Produto.create({
        nome,
        descricao,
        preco,
        quantidade,
        disponivel,
        tags: JSON.stringify(tagsArray), // Converter para string JSON
        imagem_nome,
        imagem_mime
      });
      
      // Adicionar a URL da imagem na resposta
      const produtoComUrl = {
        ...produto,
        imagem_url: imagem_nome ? `${BASE_URL}/uploads/${imagem_nome}` : null
      };
      
      console.log('Produto criado com sucesso:', produtoComUrl);
      res.status(201).json(produtoComUrl);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({ error: 'Erro ao criar produto: ' + error.message });
    }
  },

  // Atualizar um produto
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        nome,
        descricao,
        preco,
        imagem,
        imagem_mime,
        tags,
        disponivel,
        quantidade
      } = req.body;

      const produto = await Produto.findById(id);

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      let imagem_nome = produto.imagem_nome;
      
      if (imagem && imagem_mime) {
        // Decodificar base64 e salvar arquivo
        const base64Data = imagem.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // VALIDAÇÃO DE TAMANHO: Verificar se a imagem não excede 10MB
        const tamanhoMB = buffer.length / (1024 * 1024);
        const LIMITE_MB = 10;
        
        if (tamanhoMB > LIMITE_MB) {
          throw new Error(`Imagem muito grande. Tamanho máximo: ${LIMITE_MB}MB. Tamanho atual: ${tamanhoMB.toFixed(2)}MB`);
        }
        
        // Gerar nome único para o arquivo
        imagem_nome = `${Date.now()}-${Math.random().toString(36).substring(7)}.${imagem_mime.split('/')[1]}`;
        
        // Garantir que a pasta uploads existe
        try {
          await fs.access(UPLOADS_DIR);
        } catch {
          await fs.mkdir(UPLOADS_DIR, { recursive: true });
        }
        
        // Se houver uma imagem antiga, deletá-la
        if (produto.imagem_nome) {
          try {
            const oldFilePath = path.join(UPLOADS_DIR, produto.imagem_nome);
            await fs.unlink(oldFilePath);
            console.log('Arquivo antigo deletado:', oldFilePath);
          } catch (error) {
            console.error('Erro ao deletar imagem antiga:', error);
          }
        }
        
        // Salvar o novo arquivo
        const filePath = path.join(UPLOADS_DIR, imagem_nome);
        await fs.writeFile(filePath, buffer);
        console.log('Novo arquivo salvo em:', filePath, `- Tamanho: ${tamanhoMB.toFixed(2)}MB`);
      }

      const produtoAtualizado = await Produto.update(id, {
        nome,
        descricao,
        preco,
        imagem_nome,
        imagem_mime,
        tags,
        disponivel,
        quantidade
      });

      // Adicionar URL completa para a imagem
      const produtoComUrl = {
        ...produtoAtualizado,
        imagem_url: produtoAtualizado.imagem_nome ? `${BASE_URL}/uploads/${produtoAtualizado.imagem_nome}` : null
      };

      return res.json(produtoComUrl);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Deletar um produto
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const produto = await Produto.findById(id);

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Deletar a imagem se existir
      if (produto.imagem_nome) {
        try {
          const filePath = path.join(UPLOADS_DIR, produto.imagem_nome);
          await fs.unlink(filePath);
          console.log('Arquivo deletado:', filePath);
        } catch (error) {
          console.error('Erro ao deletar imagem:', error);
        }
      }

      await Produto.delete(id);
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}; 