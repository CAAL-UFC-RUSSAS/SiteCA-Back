const fs = require('fs').promises;
const path = require('path');

exports.up = async function(knex) {
  // Primeiro, adicionar as novas colunas
  await knex.schema.alterTable('banners', function(table) {
    table.text('imagem_base64');
  });

  // Depois, migrar os dados existentes
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

  // Por fim, remover a coluna antiga
  await knex.schema.alterTable('banners', function(table) {
    table.dropColumn('imagem_nome');
  });
};

exports.down = async function(knex) {
  // Primeiro, adicionar a coluna antiga de volta
  await knex.schema.alterTable('banners', function(table) {
    table.string('imagem_nome');
  });

  // Depois, restaurar os dados
  const banners = await knex('banners').select('*');
  const BANNERS_DIR = path.join(__dirname, '..', '..', '..', 'uploads', 'banners');

  for (const banner of banners) {
    if (banner.imagem_base64) {
      try {
        const imagemBuffer = Buffer.from(banner.imagem_base64, 'base64');
        const extensao = banner.imagem_mime.split('/')[1];
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

  // Por fim, remover a coluna nova
  await knex.schema.alterTable('banners', function(table) {
    table.dropColumn('imagem_base64');
  });
}; 