const db = require('../database/connection');

module.exports = {
  // Buscar todos os membros
  async findAll() {
    return db('membros_gestao').select('*').orderBy('ordem', 'asc');
  },

  // Buscar um membro pelo ID
  async findById(id) {
    return db('membros_gestao').where({ id }).first();
  },

  // Buscar membros por gestão
  async findByGestao(gestao) {
    return db('membros_gestao')
      .where({ gestao })
      .orderBy('ordem', 'asc')
      .select('*');
  },

  // Buscar membros por status
  async findByStatus(status) {
    return db('membros_gestao')
      .where({ status })
      .orderBy('gestao', 'desc')
      .orderBy('ordem', 'asc')
      .select('*');
  },

  // Buscar membros ativos
  async findAtivos() {
    return db('membros_gestao')
      .where({ ativo: true })
      .orderBy('gestao', 'desc')
      .orderBy('ordem', 'asc')
      .select('*');
  },

  // Criar um novo membro
  async create(membro) {
    const [result] = await db('membros_gestao').insert(membro).returning('id');
    const id = typeof result === 'object' ? result.id : result;
    return this.findById(id);
  },

  // Atualizar um membro
  async update(id, membro) {
    await db('membros_gestao').where({ id }).update(membro);
    return this.findById(id);
  },

  // Deletar um membro
  async delete(id) {
    return db('membros_gestao').where({ id }).delete();
  },

  // Buscar gestões disponíveis
  async findGestoes() {
    return db('membros_gestao')
      .distinct('gestao')
      .orderBy('gestao', 'desc')
      .pluck('gestao');
  },

  // Reordenar membros
  async reordenar(membroIds) {
    const trx = await db.transaction();
    
    try {
      for (let i = 0; i < membroIds.length; i++) {
        await trx('membros_gestao')
          .where({ id: membroIds[i] })
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