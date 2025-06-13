const Produto = require('../models/Produto');
const ProdutoImagem = require('../models/ProdutoImagem');
const ProdutoCampoPersonalizado = require('../models/ProdutoCampoPersonalizado');
const fs = require('fs').promises;
const path = require('path');
const knex = require('../database/connection');

// Definir o caminho da pasta uploads
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// URL base para imagens - usar variável de ambiente ou fallback para localhost
const BASE_URL = process.env.BASE_URL || 'http://localhost:3333';

module.exports = {
  // Listar todos os produtos
  async index(req, res) {
    try {
      const produtos = await Produto.findAll();
      
      // Buscar imagens para cada produto
      const produtosComImagens = await Promise.all(produtos.map(async produto => {
        const imagens = await ProdutoImagem.findByProdutoId(produto.id);
        const camposPersonalizados = await ProdutoCampoPersonalizado.findByProdutoId(produto.id);
        return {
          ...produto,
          tags: JSON.parse(produto.tags || '[]'),
          imagens: imagens.map(imagem => ({
            id: imagem.id,
            url: `data:${imagem.imagem_mime};base64,${imagem.imagem_base64}`,
            ordem: imagem.ordem
          })),
          campos_personalizados: camposPersonalizados
        };
      }));
      
      return res.json(produtosComImagens);
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

      console.log('=== DEBUG BACKEND SHOW ===');
      console.log('Produto do banco:', produto);
      console.log('Tipo das tags:', typeof produto.tags);
      console.log('Valor das tags:', produto.tags);

      // Buscar imagens do produto
      const imagens = await ProdutoImagem.findByProdutoId(produto.id);
      const camposPersonalizados = await ProdutoCampoPersonalizado.findByProdutoId(produto.id);
      
      const produtoComImagens = {
        ...produto,
        tags: JSON.parse(produto.tags || '[]'),
        imagens: imagens.map(imagem => ({
          id: imagem.id,
          url: `data:${imagem.imagem_mime};base64,${imagem.imagem_base64}`,
          ordem: imagem.ordem
        })),
        campos_personalizados: camposPersonalizados
      };

      console.log('Produto processado:', produtoComImagens);
      console.log('Tipo das tags após processamento:', typeof produtoComImagens.tags);
      console.log('Valor das tags após processamento:', produtoComImagens.tags);
      console.log('========================');

      return res.json(produtoComImagens);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Criar um novo produto
  async store(req, res) {
    try {
      const { nome, descricao, preco, quantidade, tags, disponivel, imagens = [], campos_personalizados = [] } = req.body;
      
      console.log('Dados recebidos na requisição:', {
        nome,
        descricao,
        preco,
        quantidade,
        tags,
        disponivel,
        imagens,
        campos_personalizados
      });

      const trx = await knex.transaction();

      try {
        // Inserir produto
        const [produtoId] = await trx('produtos')
          .insert({
            nome,
            descricao,
            preco: parseInt(preco),
            quantidade,
            tags: JSON.stringify(tags),
            disponivel
          })
          .returning('id');

        const id = typeof produtoId === 'object' ? produtoId.id : produtoId;
        console.log('Produto inserido com ID:', id);

        // Inserir imagens
        if (Array.isArray(imagens) && imagens.length > 0) {
          console.log('Processando imagens:', imagens);
          for (let i = 0; i < imagens.length; i++) {
            const imagem = imagens[i];
            if (typeof imagem === 'string' && imagem.startsWith('data:')) {
              const [header, base64] = imagem.split(',');
              const mime = header.split(':')[1].split(';')[0];
              
              await trx('produto_imagens').insert({
                produto_id: id,
                imagem_base64: base64,
                imagem_mime: mime,
                ordem: i
              });
            }
          }
        }

        // Inserir campos personalizados
        if (Array.isArray(campos_personalizados) && campos_personalizados.length > 0) {
          console.log('Processando campos personalizados:', campos_personalizados);
          for (const campo of campos_personalizados) {
            if (campo && typeof campo === 'object' && campo.nome && campo.tipo) {
              console.log('Inserindo campo personalizado:', campo);
              await trx('produto_campos_personalizados').insert({
                produto_id: id,
                nome: campo.nome,
                tipo: campo.tipo,
                opcoes: campo.opcoes ? JSON.stringify(campo.opcoes) : null,
                valor: campo.valor || ''
              });
            }
          }
        }

        await trx.commit();

        const produto = await Produto.findById(id);
        const imagensProduto = await ProdutoImagem.findByProdutoId(id);
        const camposPersonalizados = await ProdutoCampoPersonalizado.findByProdutoId(id);

        console.log('Produto criado com sucesso:', {
          produto,
          imagens: imagensProduto,
          campos_personalizados: camposPersonalizados
        });

        return res.json({
          ...produto,
          imagens: imagensProduto,
          campos_personalizados: camposPersonalizados
        });
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      return res.status(500).json({ error: 'Erro ao criar produto' });
    }
  },

  // Atualizar um produto
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nome, descricao, preco, quantidade, tags, disponivel, imagens = [], campos_personalizados = [] } = req.body;
      console.log('Recebendo requisição para atualizar produto:', {
        id,
        nome,
        descricao,
        preco,
        quantidade,
        tags,
        disponivel,
        imagens,
        campos_personalizados
      });

      const trx = await knex.transaction();

      try {
        await trx('produtos')
          .where('id', id)
          .update({
            nome,
            descricao,
            preco: parseInt(preco),
            quantidade,
            tags: JSON.stringify(tags),
            disponivel
          });

        // Atualizar imagens
        await trx('produto_imagens').where('produto_id', id).delete();
        if (Array.isArray(imagens) && imagens.length > 0) {
          for (let i = 0; i < imagens.length; i++) {
            const imagem = imagens[i];
            if (typeof imagem === 'string' && imagem.startsWith('data:')) {
              const [header, base64] = imagem.split(',');
              const mime = header.split(':')[1].split(';')[0];
              
              await trx('produto_imagens').insert({
                produto_id: id,
                imagem_base64: base64,
                imagem_mime: mime,
                ordem: i
              });
            }
          }
        }

        // Atualizar campos personalizados
        await trx('produto_campos_personalizados').where('produto_id', id).delete();
        if (Array.isArray(campos_personalizados) && campos_personalizados.length > 0) {
          console.log('Processando campos personalizados para atualização:', campos_personalizados);
          for (const campo of campos_personalizados) {
            if (campo && typeof campo === 'object' && campo.nome && campo.tipo) {
              await trx('produto_campos_personalizados').insert({
                produto_id: id,
                nome: campo.nome,
                tipo: campo.tipo,
                opcoes: campo.opcoes ? JSON.stringify(campo.opcoes) : null,
                valor: campo.valor || ''
              });
            }
          }
        }

        await trx.commit();

        const produto = await Produto.findById(id);
        const imagensProduto = await ProdutoImagem.findByProdutoId(id);
        const camposPersonalizados = await ProdutoCampoPersonalizado.findByProdutoId(id);

        console.log('Produto atualizado com sucesso:', {
          produto,
          imagens: imagensProduto,
          campos_personalizados: camposPersonalizados
        });

        return res.json({
          ...produto,
          imagens: imagensProduto,
          campos_personalizados: camposPersonalizados
        });
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return res.status(500).json({ error: 'Erro ao atualizar produto' });
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

      // Deletar todas as imagens do produto
      await ProdutoImagem.deleteByProdutoId(id);

      // Deletar todos os campos personalizados do produto
      await ProdutoCampoPersonalizado.deleteByProdutoId(id);

      // Deletar o produto
      await Produto.delete(id);
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Reordenar imagens de um produto
  async reordenarImagens(req, res) {
    try {
      const { id } = req.params;
      const { imagemIds } = req.body;
      
      if (!Array.isArray(imagemIds) || imagemIds.length === 0) {
        return res.status(400).json({ error: 'Lista de IDs inválida' });
      }
      
      await ProdutoImagem.reordenar(imagemIds);
      return res.json({ success: true });
    } catch (error) {
      console.error('Erro ao reordenar imagens:', error);
      return res.status(500).json({ error: 'Erro ao reordenar imagens' });
    }
  }
}; 