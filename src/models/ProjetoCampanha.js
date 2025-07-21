const db = require('../database/connection');

module.exports = {
  async findAll() {
    return db('projetos_campanha').select('*').orderBy('ordem', 'asc');
  },

  async findById(id) {
    return db('projetos_campanha').where({ id }).first();
  },

  async findByGestao(gestao) {
    return db('projetos_campanha')
      .where({ gestao })
      .orderBy('ordem', 'asc')
      .select('*');
  },

  async findByStatus(status) {
    return db('projetos_campanha')
      .where({ status })
      .orderBy('gestao', 'desc')
      .orderBy('ordem', 'asc')
      .select('*');
  },

  async findAtivos() {
    return db('projetos_campanha')
      .where({ ativo: true })
      .orderBy('gestao', 'desc')
      .orderBy('ordem', 'asc')
      .select('*');
  },

  async create(projeto) {
    const [result] = await db('projetos_campanha').insert(projeto).returning('id');
    const id = typeof result === 'object' ? result.id : result;
    return this.findById(id);
  },

  async update(id, projeto) {
    await db('projetos_campanha').where({ id }).update(projeto);
    return this.findById(id);
  },

  async delete(id) {
    return db('projetos_campanha').where({ id }).delete();
  },

  async findGestoes() {
    return db('projetos_campanha')
      .distinct('gestao')
      .orderBy('gestao', 'desc')
      .pluck('gestao');
  },

  async reordenar(projetoIds) {
    const trx = await db.transaction();
    try {
      for (let i = 0; i < projetoIds.length; i++) {
        await trx('projetos_campanha')
          .where({ id: projetoIds[i] })
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