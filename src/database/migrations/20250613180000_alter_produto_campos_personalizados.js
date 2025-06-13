exports.up = function(knex) {
    return knex.schema.raw(`
        ALTER TABLE produto_campos_personalizados 
        DROP CONSTRAINT IF EXISTS produto_campos_personalizados_tipo_check,
        ALTER COLUMN tipo TYPE text,
        ADD CONSTRAINT produto_campos_personalizados_tipo_check 
        CHECK (tipo IN ('texto', 'numero', 'opcao')),
        ALTER COLUMN valor SET NOT NULL;
    `);
};

exports.down = function(knex) {
    return knex.schema.raw(`
        ALTER TABLE produto_campos_personalizados 
        DROP CONSTRAINT IF EXISTS produto_campos_personalizados_tipo_check,
        ALTER COLUMN valor DROP NOT NULL;
    `);
}; 