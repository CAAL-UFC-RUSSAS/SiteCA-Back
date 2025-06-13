exports.up = function(knex) {
  return knex.schema.createTable('produto_imagens', function(table) {
    table.increments('id').primary();
    table.integer('produto_id').unsigned().notNullable().references('id').inTable('produtos').onDelete('CASCADE');
    table.text('imagem_base64').notNullable();
    table.string('imagem_mime').notNullable();
    table.integer('ordem').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('produto_imagens');
}; 