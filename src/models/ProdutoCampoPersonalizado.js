const knex = require('../database/connection');

class ProdutoCampoPersonalizado {
    static async findByProdutoId(produtoId) {
        return knex('produto_campos_personalizados')
            .where('produto_id', produtoId)
            .orderBy('id');
    }

    static async create(campo) {
        try {
            const [id] = await knex('produto_campos_personalizados')
                .insert(campo)
                .returning('id');
            
            if (!id) {
                throw new Error('Falha ao criar campo personalizado');
            }

            return knex('produto_campos_personalizados')
                .where('id', id)
                .first();
        } catch (error) {
            console.error('Erro ao criar campo personalizado:', error);
            throw error;
        }
    }

    static async update(id, campo) {
        await knex('produto_campos_personalizados')
            .where('id', id)
            .update(campo);
        return knex('produto_campos_personalizados').where('id', id).first();
    }

    static async delete(id) {
        return knex('produto_campos_personalizados')
            .where('id', id)
            .delete();
    }

    static async deleteByProdutoId(produtoId) {
        return knex('produto_campos_personalizados')
            .where('produto_id', produtoId)
            .delete();
    }
}

module.exports = ProdutoCampoPersonalizado; 