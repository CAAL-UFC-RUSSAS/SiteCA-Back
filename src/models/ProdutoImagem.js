const db = require('../database/connection');

module.exports = {
  // Buscar todas as imagens de um produto
  async findByProdutoId(produtoId) {
    return db('produto_imagens')
      .where({ produto_id: produtoId })
      .orderBy('ordem', 'asc')
      .select('*');
  },

  // Buscar uma imagem específica
  async findById(id) {
    return db('produto_imagens').where({ id }).first();
  },

  // Criar uma nova imagem
  async create(imagem) {
    const [result] = await db('produto_imagens').insert(imagem).returning('id');
    const id = typeof result === 'object' ? result.id : result;
    return this.findById(id);
  },

  // Atualizar uma imagem
  async update(id, imagem) {
    await db('produto_imagens').where({ id }).update(imagem);
    return this.findById(id);
  },

  // Deletar uma imagem
  async delete(id) {
    return db('produto_imagens').where({ id }).delete();
  },

  // Deletar todas as imagens de um produto
  async deleteByProdutoId(produtoId) {
    return db('produto_imagens').where({ produto_id: produtoId }).delete();
  },

  // Reordenar imagens
  async reordenar(imagemIds) {
    const trx = await db.transaction();
    
    try {
      for (let i = 0; i < imagemIds.length; i++) {
        await trx('produto_imagens')
          .where({ id: imagemIds[i] })
          .update({ ordem: i });
      }
      
      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}; 