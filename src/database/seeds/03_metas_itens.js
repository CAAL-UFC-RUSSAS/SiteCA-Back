exports.seed = async function(knex) {
  // Limpar as tabelas primeiro
  await knex('metas').del();
  await knex('itens_compra').del();
  
  // Inserir metas
  await knex('metas').insert([
    {
      descricao: 'Geladeira para sala de descanso',
      valorNecessario: 2500,
      valorArrecadado: 1200,
      dataLimite: '2025-12-31',
      tipo: 'descanso'
    },
    {
      descricao: 'Microondas para sala de descanso',
      valorNecessario: 800,
      valorArrecadado: 600,
      dataLimite: '2025-09-30',
      tipo: 'descanso'
    },
    {
      descricao: 'Reforma da mesa de ping-pong',
      valorNecessario: 350,
      valorArrecadado: 120,
      dataLimite: '2025-08-15',
      tipo: 'ca'
    }
  ]);
  
  // Inserir itens para compra
  await knex('itens_compra').insert([
    {
      nome: 'Sofá 3 lugares',
      descricao: 'Para substituir o atual que está danificado',
      prioridade: 'alta',
      valorEstimado: 1800,
      tipo: 'ca'
    },
    {
      nome: 'Cafeteira',
      descricao: 'Para a sala de descanso',
      prioridade: 'media',
      valorEstimado: 300,
      tipo: 'descanso'
    },
    {
      nome: 'Ventilador de teto',
      descricao: 'Para melhorar a ventilação na sala principal',
      prioridade: 'baixa',
      valorEstimado: 450,
      tipo: 'ca'
    }
  ]);
}; 