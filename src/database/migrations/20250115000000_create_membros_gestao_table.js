exports.up = function(knex) {
  return knex.schema.createTable('membros_gestao', function(table) {
    table.increments('id').primary();
    table.string('nome').notNullable();
    table.string('cargo').notNullable();
    table.string('area').notNullable();
    table.text('descricao').notNullable();
    table.string('contato');
    table.text('foto_base64').notNullable(); // Armazena a foto em base64
    table.string('foto_mime').notNullable();
    table.string('gestao').notNullable(); // Ex: "2023-2024", "2024-2025"
    table.string('status').defaultTo('atual'); // atual, antiga
    table.integer('ordem').defaultTo(0); // Para ordenação na exibição
    table.boolean('ativo').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('membros_gestao');
}; 