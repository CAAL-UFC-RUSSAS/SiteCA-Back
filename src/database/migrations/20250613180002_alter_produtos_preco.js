exports.up = function(knex) {
    return knex.schema.alterTable('produtos', function(table) {
        table.bigInteger('preco').notNullable().alter(); // Alterando para bigInteger para suportar valores maiores
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('produtos', function(table) {
        table.integer('preco').notNullable().alter(); // Voltando para integer
    });
}; 