const axios = require('axios');
const cheerio = require('cheerio');

class CalendarioController {
  /**
   * Busca e extrai o calendário acadêmico da UFC
   * Usando função de seta para preservar o contexto do 'this'
   */
  getCalendarioUFC = async (req, res) => {
    try {
      // URL do calendário acadêmico da UFC para o ano atual ou o próximo
      const anoAtual = new Date().getFullYear();
      let url = `https://www.ufc.br/calendario-universitario/${anoAtual}`;
      
      // Primeiro tenta o ano atual, se não der certo, tenta o próximo ano
      try {
        // Faz a requisição para o site da UFC
        const response = await axios.get(url);
        if (response.status === 200) {
          // Extrair os eventos do HTML
          const eventos = this.extrairEventosDoHTMLUFC(response.data);
          return res.json(eventos);
        }
      } catch (errorAtual) {
        console.log(`Calendário do ano atual (${anoAtual}) não encontrado, tentando próximo ano...`);
        // Se não encontrar o calendário do ano atual, tenta o próximo ano
        url = `https://www.ufc.br/calendario-universitario/${anoAtual + 1}`;
      }

      // Tenta buscar o calendário do próximo ano
      const response = await axios.get(url);
      
      if (response.status !== 200) {
        return res.status(500).json({ 
          error: 'Erro ao buscar calendário', 
          message: `Status code: ${response.status}` 
        });
      }
      
      // Extrair os eventos do HTML
      const eventos = this.extrairEventosDoHTMLUFC(response.data);
      
      return res.json(eventos);
    } catch (error) {
      console.error('Erro ao buscar calendário da UFC:', error);
      return res.status(500).json({ 
        error: 'Erro ao buscar calendário', 
        message: error.message 
      });
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
                  // Processar a data (dia e mês)
                  const diaMatch = dataColuna.match(/(\d+)/);
                  const dia = diaMatch ? diaMatch[1].padStart(2, '0') : null;
                  
                  if (dia) {
                    // Extrair o mês e ano da string do cabeçalho
                    const mesAno = this.extrairMesAno(mes);
                    if (mesAno) {
                      const { mes: mesNumero, ano } = mesAno;
                      // Criar data
                      const dataString = `${ano}-${mesNumero}-${dia}`;
                      const dataObj = new Date(dataString);
                      
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
                    }
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