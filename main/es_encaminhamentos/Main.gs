/**
 * Retorna o conteúdo do template compartilhado (versão ES).
 * Usado pela scriptlet <?!= getTemplateContent() ?> no index.html.
 */
function getTemplateContent() {
  return HtmlService.createHtmlOutputFromFile('Template').getContent();
}

/**
 * Retorna a URL do formulário ES_ENCAMINHAMENTOS.
 */
function getFormUrl() {
  return types.ES_ENCAMINHAMENTOS_FORM_URL || '';
}

/**
 * Função de entrada do Google Apps Script Web App para ES_ENCAMINHAMENTOS.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setWidth(1200)
    .setHeight(800);
}

/**
 * Consulta dados da planilha de destino (PERSON) com filtros para ES.
 * Diferenças para SEEU:
 * - Não duplica cpf várias vezes por procedimentos criminais.
 * - Mostra a coluna `sexo` em vez de número do processo.
 */
function buscarDados(cpf, nome, nomeMae) {
  try {
    if (typeof utils === 'undefined') {
      Logger.log('buscarDados ES error: utils não está disponível');
      return [];
    }

    var filtros = { cpf: cpf || '', nome: nome || '', nomeMae: nomeMae || '' };
    var ss = SpreadsheetApp.openById(types.DATABASE_ID);
    var pessoas = utils.searchPerson(filtros, ss);

    if (pessoas.error) {
      Logger.log('buscarDados ES error: ' + pessoas.error);
      return [];
    }

    if (!Array.isArray(pessoas)) {
      Logger.log('buscarDados ES: resultados não é array');
      return [];
    }

    var resultados = [];
    var personSheet = ss.getSheetByName(types.SHEET_NAMES.PERSON);

    for (var i = 0; i < pessoas.length; i++) {
      var pessoa = pessoas[i];
      var cpfDigits = pessoa.cpf ? pessoa.cpf.replace(/\D+/g, '') : '';

      // Tentar ler coluna SEX diretamente da planilha PERSON
      var sexo = '';
      try {
        var rowIdx = utils.findRowByColumnValue(ss, types.SHEET_NAMES.PERSON, types.PERSON_COL.CPF, cpfDigits, 2);
        if (rowIdx) {
          sexo = personSheet.getRange(rowIdx, types.PERSON_COL.SEX + 1).getValue() || '';
        }
      } catch (e) {
        Logger.log('buscarDados ES: falha ao ler sexo para cpf %s: %s', cpfDigits, e.toString());
      }

      resultados.push({
        cpf: pessoa.cpf || '',
        nome: pessoa.nome || '',
        nomeMae: pessoa.nomeMae || '',
        email: pessoa.criadoPor || '',
        telefone: pessoa.telefone || '',
        sexo: sexo || ''
      });
    }

    return resultados;
  } catch (e) {
    Logger.log('buscarDados ES error: ' + e.toString());
    return [];
  }
}
