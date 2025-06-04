// migrations/20250520000000_create_banners_table.js

exports.up = function(knex) {
  return knex.schema.createTable('banners', function(table) {
    table.increments('id').primary();
    table.string('titulo').notNullable();
    table.text('descricao');
    table.string('link');
    table.string('tipo').notNullable().defaultTo('principal'); // principal, lateral, promocional
    table.string('imagem_nome');
    table.string('imagem_mime');
    table.integer('posicao').defaultTo(0);
    table.boolean('ativo').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('banners');
}; 