const db = require('../database/connection');

module.exports = {
  // Buscar todos os produtos
  async findAll() {
    return db('produtos').select('*');
  },

  // Buscar um produto pelo ID
  async findById(id) {
    return db('produtos').where({ id }).first();
  },

  // Criar um novo produto
  async create(produto) {
    const [result] = await db('produtos').insert(produto).returning('id');
    const id = typeof result === 'object' ? result.id : result;
    return this.findById(id);
  },

  // Atualizar um produto
  async update(id, produto) {
    await db('produtos').where({ id }).update(produto);
    return this.findById(id);
  },

  // Deletar um produto
  async delete(id) {
    return db('produtos').where({ id }).delete();
  },

  // Buscar produtos por disponibilidade
  async findByDisponibilidade(disponivel = true) {
    return db('produtos').where({ disponivel }).select('*');
  },

  // Buscar produtos por preço (range)
  async findByPrecoRange(min, max) {
    return db('produtos')
      .whereBetween('preco', [min, max])
      .select('*');
  },

  // Buscar produtos por tags
  async findByTags(tags) {
    return db('produtos')
      .whereRaw('tags ?| array[?]', [tags])
      .select('*');
  },

  // Atualizar quantidade do produto
  async updateQuantidade(id, quantidade) {
    await db('produtos')
      .where({ id })
      .update({ quantidade });
    return this.findById(id);
  }
}; 