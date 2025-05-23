    // migrations/20250819183000_create_produtos_table.js

    exports.up = function(knex) {
    return knex.schema.createTable('produtos', function(table) {
        table.increments('id').primary();
        table.string('nome').notNullable();
        table.text('descricao').notNullable();
        table.integer('preco').notNullable(); // centavos
        table.binary('imagem');
        table.string('imagem_mime');
        table.json('tags');
        table.boolean('disponivel').defaultTo(true);
        table.integer('quantidade').defaultTo(0);
        table.timestamps(true, true);
    });
    };

    exports.down = function(knex) {
    return knex.schema.dropTable('produtos');
    };
