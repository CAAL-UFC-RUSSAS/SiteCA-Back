exports.up = function(knex) {
  return knex.schema.createTable('metas', function(table) {
    table.increments('id').primary();
    table.string('descricao').notNullable();
    table.decimal('valorNecessario', 10, 2).notNullable();
    table.decimal('valorArrecadado', 10, 2).defaultTo(0);
    table.date('dataLimite').notNullable();
    table.enum('tipo', ['ca', 'descanso']).notNullable();
    table.boolean('concluida').defaultTo(false);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('metas');
}; 