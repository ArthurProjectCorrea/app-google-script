/**
 * Retorna o conteúdo do template compartilhado.
 * Usado pela scriptlet <?!= getTemplateContent() ?> no index.html.
 */
function getTemplateContent() {
  return HtmlService.createHtmlOutputFromFile('Template').getContent();
}

/**
 * Retorna a URL do formulário SEEU sem autopreenchimento.
 * Usado pelo botão "Cadastrar" no template.
 */
function getFormUrl() {
  return types.SEEU_FORM_URL || '';
}

/**
 * Função de entrada do Google Apps Script Web App.
 * Retorna a página HTML quando acessada.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setWidth(1200)
    .setHeight(800);
}

/**
 * Consulta dados da planilha de destino (PERSON) com filtros.
 * Usa a biblioteca utils.SearchDatabase para busca com suporte a acentos.
 * Para SEEU: Se uma pessoa tiver múltiplos processos criminais, retorna uma linha para cada processo.
 * @param {string} cpf - Filtro por CPF (opcional)
 * @param {string} nome - Filtro por nome (opcional, ignora acentos)
 * @param {string} nomeMae - Filtro por nome da mãe (opcional, ignora acentos)
 * @returns {Array} Array de objetos com os registros encontrados
 */
function buscarDados(cpf, nome, nomeMae) {
  try {
    // Verificar se utils está disponível
    if (typeof utils === 'undefined') {
      Logger.log('buscarDados error: utils não está disponível');
      return [];
    }
    
    // Usar função de busca da biblioteca utils
    var filtros = {
      cpf: cpf || '',
      nome: nome || '',
      nomeMae: nomeMae || ''
    };
    
    var ss = SpreadsheetApp.openById(types.DATABASE_ID);
    var pessoas = utils.searchPerson(filtros, ss);
    
    // Verificar se houve erro
    if (pessoas.error) {
      Logger.log('buscarDados error: ' + pessoas.error);
      return [];
    }
    
    // Verificar se resultados é array
    if (!Array.isArray(pessoas)) {
      Logger.log('buscarDados: resultados não é array');
      return [];
    }
    
    // Para cada pessoa, buscar procedimentos criminais e criar uma linha por processo
    var resultados = [];
    
    for (var i = 0; i < pessoas.length; i++) {
      var pessoa = pessoas[i];
      var cpfDigits = pessoa.cpf ? pessoa.cpf.replace(/\D+/g, '') : '';
      
      // Buscar procedimentos criminais
      var procedimentos = utils.searchCriminalProcedure({ cpf: cpfDigits }, ss);
      
      // Se houver múltiplos procedimentos, criar uma linha para cada um
      if (Array.isArray(procedimentos) && procedimentos.length > 0) {
        for (var j = 0; j < procedimentos.length; j++) {
          var proc = procedimentos[j];
          resultados.push({
            cpf: pessoa.cpf || '',
            nome: pessoa.nome || '',
            nomeMae: pessoa.nomeMae || '',
            email: pessoa.criadoPor || '',
            telefone: pessoa.telefone || '',
            numeroProcesso: proc.numeroProcesso || '',
            regimePena: proc.regimePena || '',
            dataProgressao: proc.dataProgressao || ''
          });
        }
      } else {
        // Se não houver procedimentos, retornar a pessoa sem dados de processo
        resultados.push({
          cpf: pessoa.cpf || '',
          nome: pessoa.nome || '',
          nomeMae: pessoa.nomeMae || '',
          email: pessoa.criadoPor || '',
          telefone: pessoa.telefone || '',
          numeroProcesso: '',
          regimePena: '',
          dataProgressao: ''
        });
      }
    }
    
    return resultados;
  } catch (e) {
    Logger.log('buscarDados error: ' + e.toString());
    return [];
  }
}
