const db = require('../database/connection');

module.exports = {
  // Buscar todos os banners
  async findAll() {
    return db('banners').select('*').orderBy('posicao', 'asc');
  },

  // Buscar um banner pelo ID
  async findById(id) {
    return db('banners').where({ id }).first();
  },

  // Criar um novo banner
  async create(banner) {
    const [result] = await db('banners').insert(banner).returning('id');
    const id = typeof result === 'object' ? result.id : result;
    return this.findById(id);
  },

  // Atualizar um banner
  async update(id, banner) {
    await db('banners').where({ id }).update(banner);
    return this.findById(id);
  },

  // Deletar um banner
  async delete(id) {
    return db('banners').where({ id }).delete();
  },

  // Buscar banners por tipo
  async findByTipo(tipo) {
    return db('banners').where({ tipo }).orderBy('posicao', 'asc').select('*');
  },

  // Buscar banners ativos
  async findAtivos() {
    return db('banners').where({ ativo: true }).orderBy('posicao', 'asc').select('*');
  },

  // Reordenar banners
  async reordenar(bannerIds) {
    const trx = await db.transaction();
    
    try {
      for (let i = 0; i < bannerIds.length; i++) {
        await trx('banners')
          .where({ id: bannerIds[i] })
          .update({ posicao: i });
      }
      
      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}; 