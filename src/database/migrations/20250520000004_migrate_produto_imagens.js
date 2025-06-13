const fs = require('fs').promises;
const path = require('path');

exports.up = async function(knex) {
  // Primeiro, adicionar as novas colunas na tabela produtos
  await knex.schema.alterTable('produtos', function(table) {
    table.dropColumn('imagem_nome');
    table.dropColumn('imagem_mime');
  });

  // Depois, migrar os dados existentes
  const produtos = await knex('produtos').select('*');
  const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads');

  for (const produto of produtos) {
    if (produto.imagem_nome) {
      try {
        const imagemPath = path.join(UPLOADS_DIR, produto.imagem_nome);
        const imagemBuffer = await fs.readFile(imagemPath);
        const base64Data = imagemBuffer.toString('base64');

        await knex('produto_imagens').insert({
          produto_id: produto.id,
          imagem_base64: base64Data,
          imagem_mime: produto.imagem_mime,
          ordem: 0
        });
      } catch (error) {
        console.error(`Erro ao migrar imagem do produto ${produto.id}:`, error);
      }
    }
  }
};

exports.down = async function(knex) {
  // Primeiro, adicionar as colunas antigas de volta
  await knex.schema.alterTable('produtos', function(table) {
    table.string('imagem_nome');
    table.string('imagem_mime');
  });

  // Depois, restaurar os dados
  const produtos = await knex('produtos').select('*');
  const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads');

  for (const produto of produtos) {
    const imagens = await knex('produto_imagens')
      .where({ produto_id: produto.id })
      .orderBy('ordem', 'asc')
      .select('*');

    if (imagens.length > 0) {
      const primeiraImagem = imagens[0];
      try {
        const imagemBuffer = Buffer.from(primeiraImagem.imagem_base64, 'base64');
        const extensao = primeiraImagem.imagem_mime.split('/')[1];
        const imagem_nome = `produto-${produto.id}-${Date.now()}.${extensao}`;
        const imagemPath = path.join(UPLOADS_DIR, imagem_nome);

        await fs.writeFile(imagemPath, imagemBuffer);

        await knex('produtos')
          .where({ id: produto.id })
          .update({
            imagem_nome: imagem_nome,
            imagem_mime: primeiraImagem.imagem_mime
          });
      } catch (error) {
        console.error(`Erro ao restaurar imagem do produto ${produto.id}:`, error);
      }
    }
  }

  // Por fim, remover a tabela de imagens
  await knex.schema.dropTable('produto_imagens');
}; 