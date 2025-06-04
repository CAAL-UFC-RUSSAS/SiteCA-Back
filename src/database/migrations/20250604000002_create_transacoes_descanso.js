exports.up = function(knex) {
  return knex.schema.createTable('transacoes_descanso', function(table) {
    table.increments('id').primary();
    table.string('descricao').notNullable();
    table.decimal('valor', 10, 2).notNullable();
    table.enum('tipo', ['entrada', 'saida']).notNullable();
    table.date('data').notNullable();
    table.integer('usuario_id').unsigned().references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transacoes_descanso');
}; 