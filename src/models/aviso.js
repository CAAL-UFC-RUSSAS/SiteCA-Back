const db = require('../database/connection');

module.exports = {
  // Buscar todos os avisos
  async findAll() {
    return db('avisos').select('*').orderBy('data_inicio', 'desc');
  },

  // Buscar um aviso pelo ID
  async findById(id) {
    return db('avisos').where({ id }).first();
  },

  // Buscar avisos ativos (data atual entre data_inicio e data_fim)
  async findAtivos() {
    const hoje = new Date().toISOString().split('T')[0];
    return db('avisos')
      .where('data_inicio', '<=', hoje)
      .where(function() {
        this.where('data_fim', '>=', hoje).orWhereNull('data_fim');
      })
      .orderBy('data_inicio', 'desc')
      .select('*');
  },

  // Criar um novo aviso
  async create(aviso) {
    const [result] = await db('avisos').insert(aviso).returning('id');
    const id = typeof result === 'object' ? result.id : result;
    return this.findById(id);
  },

  // Atualizar um aviso
  async update(id, aviso) {
    await db('avisos').where({ id }).update(aviso);
    return this.findById(id);
  },

  // Deletar um aviso
  async delete(id) {
    return db('avisos').where({ id }).delete();
  }
}; 