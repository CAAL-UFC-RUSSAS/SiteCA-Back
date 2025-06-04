exports.up = function(knex) {
  return knex.schema.createTable('avisos', function(table) {
    table.increments('id').primary();
    table.string('titulo').notNullable();
    table.text('descricao');
    table.string('link');
    table.date('data_inicio').notNullable();
    table.date('data_fim');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('avisos');
}; 