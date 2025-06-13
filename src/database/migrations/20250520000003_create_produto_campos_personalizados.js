exports.up = function(knex) {
    return knex.schema.createTable('produto_campos_personalizados', function(table) {
        table.increments('id').primary();
        table.integer('produto_id').unsigned().references('id').inTable('produtos').onDelete('CASCADE');
        table.string('nome').notNullable();
        table.string('tipo').notNullable(); // 'texto', 'numero', 'opcao'
        table.json('opcoes'); // Para campos do tipo 'opcao', armazena as opções disponíveis
        table.string('valor'); // O valor do campo personalizado
        table.timestamps(true, true);
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('produto_campos_personalizados');
}; 