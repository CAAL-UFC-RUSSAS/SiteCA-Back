exports.up = function(knex) {
  return knex.schema.createTable('itens_compra', function(table) {
    table.increments('id').primary();
    table.string('nome').notNullable();
    table.text('descricao').notNullable();
    table.enum('prioridade', ['baixa', 'media', 'alta']).notNullable();
    table.decimal('valorEstimado', 10, 2).notNullable();
    table.enum('tipo', ['ca', 'descanso']).notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('itens_compra');
}; 