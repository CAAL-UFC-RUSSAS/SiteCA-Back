exports.up = function(knex) {
  return knex.schema.createTable('projetos_campanha', function(table) {
    table.increments('id').primary();
    table.string('titulo').notNullable();
    table.text('descricao').notNullable();
    table.enum('status', ['planejado', 'em andamento', 'concluído']).defaultTo('planejado');
    table.integer('progresso').defaultTo(0); // 0-100
    table.string('gestao').notNullable(); // Ex: "2023-2024", "2024-2025"
    table.integer('ordem').defaultTo(0); // Para ordenação na exibição
    table.boolean('ativo').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('projetos_campanha');
}; 