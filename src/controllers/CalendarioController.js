const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Configuração para ignorar verificação SSL (necessário para o site da UFC)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

class CalendarioController {
  /**
   * Faz uma requisição HTTP para o site da UFC com configurações adequadas
   */
  async fazerRequisicaoUFC(url) {
    return await axios.get(url, {
      httpsAgent: httpsAgent,
      timeout: 10000, // 10 segundos de timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
  }

  /**
   * Busca e extrai o calendário acadêmico da UFC
   * Usando função de seta para preservar o contexto do 'this'
   */
  getCalendarioUFC = async (req, res) => {
    try {
      const anoAtual = new Date().getFullYear();
      
      // Tenta buscar o calendário para diferentes anos (atual, próximo, anterior)
      const anosParaTentar = [anoAtual, anoAtual + 1, anoAtual - 1];
      
      for (const ano of anosParaTentar) {
        try {
          const url = `https://www.ufc.br/calendario-universitario/${ano}`;
          console.log(`Tentando buscar calendário para o ano ${ano}...`);
          
          const response = await this.fazerRequisicaoUFC(url);
          
          if (response.status === 200) {
            // Extrair os eventos do HTML
            const eventos = this.extrairEventosDoHTMLUFC(response.data);
            
            // Se encontrou eventos válidos, retorna
            if (eventos && eventos.length > 0) {
              console.log(`Calendário encontrado para o ano ${ano} com ${eventos.length} eventos`);
              return res.json(eventos);
            }
          }
        } catch (errorAno) {
          console.log(`Erro ao buscar calendário para o ano ${ano}:`, errorAno.message);
          // Continua para o próximo ano
        }
      }
      
      // Se chegou até aqui, não conseguiu buscar nenhum calendário
      console.log('Não foi possível buscar o calendário de nenhum ano, usando dados de fallback');
      const eventosFallback = this.getCalendarioUFCFallback();
      return res.json(eventosFallback);
      
    } catch (error) {
      console.error('Erro geral ao buscar calendário da UFC:', error);
      // Em caso de erro geral, retorna dados de fallback
      const eventosFallback = this.getCalendarioUFCFallback();
      return res.json(eventosFallback);
    }
  }
  
  /**
   * Extrai eventos do HTML do calendário da UFC usando a estrutura específica da página
   */
  extrairEventosDoHTMLUFC(html) {
    try {
      // Usar cheerio para processar o HTML
      const $ = cheerio.load(html);
      const eventos = [];
      let idCounter = 1;
      
      // Localizar os meses do calendário (h3 seguido de table)
      $('h3').each((i, mesHeader) => {
        const mes = $(mesHeader).text().trim();
        // Pegar a tabela que segue o cabeçalho do mês
        const tabela = $(mesHeader).next('table');
        
        if (tabela.length) {
          // Processar as linhas da tabela
          tabela.find('tr.item').each((j, row) => {
            try {
              const colunas = $(row).find('td.cell');
              
              if (colunas.length >= 2) {
                const dataColuna = $(colunas[0]).text().trim();
                const tituloColuna = $(colunas[1]).text().trim();
                
                if (dataColuna && tituloColuna) {
                  // Extrair o mês e ano da string do cabeçalho
                  const mesAno = this.extrairMesAno(mes);
                  if (mesAno) {
                    const { mes: mesNumero, ano } = mesAno;
                    
                    // Processar diferentes formatos de data
                    const dias = this.processarDiferentesFormatosData(dataColuna);
                    
                    // Processar cada dia encontrado
                    dias.forEach(dia => {
                      // Criar data usando o construtor com valores numéricos para evitar problemas de timezone
                      // Mês em JavaScript é 0-indexed, então subtraímos 1
                      const dataObj = new Date(parseInt(ano), parseInt(mesNumero) - 1, parseInt(dia));
                      
                      if (!isNaN(dataObj.getTime())) {
                        const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                        
                        // Limpar o título (remover quebras de linha extras, etc.)
                        const tituloLimpo = tituloColuna
                          .replace(/\s+/g, ' ')
                          .trim();
                        
                        eventos.push({
                          id: `ufc-cal-${idCounter++}`,
                          titulo: tituloLimpo,
                          data: dataFormatada,
                          dataObj,
                          tipo: 'ufc'
                        });
                      }
                    });
                  }
                }
              }
            } catch (eventoError) {
              console.error('Erro ao processar evento específico:', eventoError);
              // Continua para o próximo evento
            }
          });
        }
      });
      
      // Ordena eventos por data
      eventos.sort((a, b) => a.dataObj.getTime() - b.dataObj.getTime());
      
      // Se ainda não encontramos eventos, retornamos dados de fallback
      if (eventos.length === 0) {
        console.warn('Nenhum evento encontrado na página da UFC, usando dados de fallback');
        return this.getCalendarioUFCFallback();
      }
      
      return eventos;
    } catch (parseError) {
      console.error('Erro ao extrair eventos do HTML:', parseError);
      return this.getCalendarioUFCFallback();
    }
  }
  
  /**
   * Processa diferentes formatos de data encontrados na coluna
   * Exemplos: "22", "22 e 25", "22 a 25"
   */
  processarDiferentesFormatosData(dataColuna) {
    const dias = [];
    
    // Limpar a string de data
    const dataLimpa = dataColuna.trim();
    
    // Padrão para intervalo: "22 a 25"
    const intervaloMatch = dataLimpa.match(/(\d+)\s+a\s+(\d+)/);
    if (intervaloMatch) {
      const inicio = parseInt(intervaloMatch[1]);
      const fim = parseInt(intervaloMatch[2]);
      
      // Gerar todos os dias do intervalo
      for (let dia = inicio; dia <= fim; dia++) {
        dias.push(dia);
      }
      return dias;
    }
    
    // Padrão para datas separadas: "22 e 25"
    const datasSeparadasMatch = dataLimpa.match(/(\d+)\s+e\s+(\d+)/);
    if (datasSeparadasMatch) {
      dias.push(parseInt(datasSeparadasMatch[1]));
      dias.push(parseInt(datasSeparadasMatch[2]));
      return dias;
    }
    
    // Padrão para múltiplas datas separadas por vírgula: "22, 25, 30"
    const multiplasDatasMatch = dataLimpa.match(/(\d+(?:\s*,\s*\d+)*)/);
    if (multiplasDatasMatch) {
      const numeros = dataLimpa.match(/\d+/g);
      if (numeros) {
        numeros.forEach(num => dias.push(parseInt(num)));
        return dias;
      }
    }
    
    // Padrão para data única: "22"
    const dataUnicaMatch = dataLimpa.match(/(\d+)/);
    if (dataUnicaMatch) {
      dias.push(parseInt(dataUnicaMatch[1]));
      return dias;
    }
    
    return dias;
  }

  /**
   * Extrai o mês e ano de uma string no formato "Mês de Ano"
   */
  extrairMesAno(mesString) {
    try {
      // Mapeia nomes de meses em português para números
      const mesesMap = {
        'janeiro': '01',
        'fevereiro': '02',
        'março': '03',
        'abril': '04',
        'maio': '05',
        'junho': '06',
        'julho': '07',
        'agosto': '08',
        'setembro': '09',
        'outubro': '10',
        'novembro': '11',
        'dezembro': '12'
      };
      
      // Extrai o mês e ano da string
      mesString = mesString.toLowerCase();
      
      for (const [nomeMes, numeroMes] of Object.entries(mesesMap)) {
        if (mesString.includes(nomeMes)) {
          // Encontra o ano na string
          const anoMatch = mesString.match(/\b(20\d{2})\b/);
          const ano = anoMatch ? anoMatch[1] : new Date().getFullYear().toString();
          
          return {
            mes: numeroMes,
            ano
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao extrair mês e ano:', error);
      return null;
    }
  }
  
  /**
   * Verifica se o texto se parece com uma data
   */
  pareceSemData(texto) {
    // Padrões comuns para datas
    const padroes = [
      /\d{1,2}\/\d{1,2}\/\d{4}/,  // DD/MM/YYYY
      /\d{1,2}\.\d{1,2}\.\d{4}/,  // DD.MM.YYYY
      /\d{1,2} de [a-zç]+ de \d{4}/i, // DD de Mês de YYYY
    ];
    
    return padroes.some(padrao => padrao.test(texto));
  }
  
  /**
   * Processa e converte um texto de data para um objeto Date
   */
  processarData(dataTexto) {
    try {
      // Remove caracteres extras e múltiplos espaços
      dataTexto = dataTexto.replace(/\s+/g, ' ').trim();
      
      // Tenta diferentes formatos comuns de data
      const formatoSimples = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
      const formatoPontos = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;
      const formatoPorExtenso = /(\d{1,2}) de ([a-zç]+) de (\d{4})/i;
      
      let dateMatch;
      
      // Formato DD/MM/YYYY
      if ((dateMatch = dataTexto.match(formatoSimples))) {
        const dia = parseInt(dateMatch[1]);
        const mes = parseInt(dateMatch[2]) - 1; // Meses em JS são 0-indexed
        const ano = parseInt(dateMatch[3]);
        return new Date(ano, mes, dia);
      }
      
      // Formato DD.MM.YYYY
      if ((dateMatch = dataTexto.match(formatoPontos))) {
        const dia = parseInt(dateMatch[1]);
        const mes = parseInt(dateMatch[2]) - 1;
        const ano = parseInt(dateMatch[3]);
        return new Date(ano, mes, dia);
      }
      
      // Formato "DD de Mês de YYYY"
      if ((dateMatch = dataTexto.match(formatoPorExtenso))) {
        const dia = parseInt(dateMatch[1]);
        const mesTexto = dateMatch[2].toLowerCase();
        const ano = parseInt(dateMatch[3]);
        
        // Mapeamento de nomes de meses em português para números
        const meses = {
          'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
          'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
          'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
        };
        
        if (meses[mesTexto] !== undefined) {
          return new Date(ano, meses[mesTexto], dia);
        }
      }
      
      // Não conseguiu interpretar a data
      return null;
    } catch (error) {
      console.error('Erro ao processar data:', error);
      return null;
    }
  }
  
  /**
   * Retorna dados de fallback para o calendário da UFC caso o scraping falhe
   */
  getCalendarioUFCFallback() {
    const anoAtual = new Date().getFullYear();
    
    return [
      { 
        id: 'cal-1', 
        titulo: 'Início do Semestre Letivo ' + anoAtual + '.1', 
        data: '12/02/' + anoAtual, 
        dataObj: new Date(anoAtual, 1, 12), // Fevereiro é 1 em JS
        tipo: 'ufc'
      },
      { 
        id: 'cal-2', 
        titulo: 'Prazo final para trancamento parcial', 
        data: '30/03/' + anoAtual, 
        dataObj: new Date(anoAtual, 2, 30), // Março é 2 em JS
        tipo: 'ufc'
      },
      { 
        id: 'cal-3', 
        titulo: 'Recesso de Semana Santa', 
        data: '28/03/' + anoAtual, 
        dataObj: new Date(anoAtual, 2, 28),
        tipo: 'ufc'
      },
      { 
        id: 'cal-4', 
        titulo: 'Prazo final para trancamento total', 
        data: '26/04/' + anoAtual, 
        dataObj: new Date(anoAtual, 3, 26),
        tipo: 'ufc'
      },
      { 
        id: 'cal-5', 
        titulo: 'Término do Semestre Letivo ' + anoAtual + '.1', 
        data: '29/06/' + anoAtual, 
        dataObj: new Date(anoAtual, 5, 29),
        tipo: 'ufc'
      },
      { 
        id: 'cal-6', 
        titulo: 'Início do Semestre Letivo ' + anoAtual + '.2', 
        data: '05/08/' + anoAtual, 
        dataObj: new Date(anoAtual, 7, 5),
        tipo: 'ufc'
      }
    ];
  }
}

module.exports = new CalendarioController(); 