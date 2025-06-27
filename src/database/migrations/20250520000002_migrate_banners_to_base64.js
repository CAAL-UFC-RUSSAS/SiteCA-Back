const fs = require('fs').promises;
const path = require('path');

exports.up = async function(knex) {
  // Verificar se a coluna imagem_base64 já existe
  const hasImagemBase64 = await knex.schema.hasColumn('banners', 'imagem_base64');
  
  if (!hasImagemBase64) {
    // Adicionar a coluna apenas se ela não existir
    await knex.schema.alterTable('banners', function(table) {
      table.text('imagem_base64');
    });
  }

  // Verificar se a coluna imagem_nome existe antes de tentar migrar
  const hasImagemNome = await knex.schema.hasColumn('banners', 'imagem_nome');
  
  if (hasImagemNome) {
    // Migrar os dados existentes apenas se a coluna imagem_nome existir
    const banners = await knex('banners').select('*');
    const BANNERS_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'banners');

    for (const banner of banners) {
      if (banner.imagem_nome) {
        try {
          const imagemPath = path.join(BANNERS_DIR, banner.imagem_nome);
          const imagemBuffer = await fs.readFile(imagemPath);
          const base64Data = imagemBuffer.toString('base64');

          await knex('banners')
            .where({ id: banner.id })
            .update({
              imagem_base64: base64Data
            });
        } catch (error) {
          console.error(`Erro ao migrar banner ${banner.id}:`, error);
        }
      }
    }

    // Remover a coluna antiga apenas se ela existir
    await knex.schema.alterTable('banners', function(table) {
      table.dropColumn('imagem_nome');
    });
  }
};

exports.down = async function(knex) {
  // Verificar se a coluna imagem_nome não existe antes de adicioná-la
  const hasImagemNome = await knex.schema.hasColumn('banners', 'imagem_nome');
  
  if (!hasImagemNome) {
    // Adicionar a coluna antiga de volta apenas se ela não existir
    await knex.schema.alterTable('banners', function(table) {
      table.string('imagem_nome');
    });
  }

  // Verificar se a coluna imagem_base64 existe antes de tentar restaurar
  const hasImagemBase64 = await knex.schema.hasColumn('banners', 'imagem_base64');
  
  if (hasImagemBase64) {
    // Restaurar os dados apenas se a coluna imagem_base64 existir
    const banners = await knex('banners').select('*');
    const BANNERS_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'banners');

    for (const banner of banners) {
      if (banner.imagem_base64) {
        try {
          const imagemBuffer = Buffer.from(banner.imagem_base64, 'base64');
          const extensao = banner.imagem_mime ? banner.imagem_mime.split('/')[1] : 'jpg';
          const imagem_nome = `banner-${banner.id}-${Date.now()}.${extensao}`;
          const imagemPath = path.join(BANNERS_DIR, imagem_nome);

          await fs.writeFile(imagemPath, imagemBuffer);

          await knex('banners')
            .where({ id: banner.id })
            .update({
              imagem_nome: imagem_nome
            });
        } catch (error) {
          console.error(`Erro ao restaurar banner ${banner.id}:`, error);
        }
      }
    }

    // Remover a coluna nova apenas se ela existir
    await knex.schema.alterTable('banners', function(table) {
      table.dropColumn('imagem_base64');
    });
  }
}; 