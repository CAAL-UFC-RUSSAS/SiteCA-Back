exports.up = function(knex) {
    return knex.schema.alterTable('produtos', function(table) {
        // Primeiro, adiciona a nova coluna
        table.string('imagem_nome');
        
        // Depois, remove a coluna antiga
        table.dropColumn('imagem');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('produtos', function(table) {
        // Na reversão, restaura a coluna original
        table.binary('imagem');
        table.dropColumn('imagem_nome');
    });
}; 