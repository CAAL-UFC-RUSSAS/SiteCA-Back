exports.up = function(knex) {
    return knex.schema.raw(`
        DROP TABLE IF EXISTS produto_campos_personalizados CASCADE;
        CREATE TABLE produto_campos_personalizados (
            id SERIAL PRIMARY KEY,
            produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
            nome VARCHAR(255) NOT NULL,
            tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('texto', 'numero', 'opcao')),
            opcoes TEXT,
            valor VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
};

exports.down = function(knex) {
    return knex.schema.dropTable('produto_campos_personalizados');
}; 