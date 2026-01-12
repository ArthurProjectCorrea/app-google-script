/**
 * ============================================================================
 * DATABASE - SOCIOECONOMIC
 * ============================================================================
 * Funções para criar, atualizar e salvar dados socioeconômicos.
 * Usa bibliotecas: Types (constantes) e Utils (formatação/validação).
 * ============================================================================
 */

/**
 * Cria um novo registro em SOCIOECONOMIC.
 * Valida que o CPF exista em PERSON.
 * @param {Object} socioData
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 */
function createSocioeconomic(socioData, ss) {
  var personSheet = ss.getSheetByName(types.SHEET_NAMES.PERSON);
  if (!personSheet) throw new Error('Aba PERSON não encontrada.');

  var cpfDigits = (socioData.cpf || '').toString().replace(/\D+/g, '');
  if (!cpfDigits) throw new Error('CPF inválido/ausente em socioData.');

  // Validar existência do CPF em PERSON
  var lastRowP = Math.max(personSheet.getLastRow(), 1);
  var startRowP = 2;
  var numRowsP = Math.max(0, lastRowP - 1);
  var found = false;

  if (numRowsP > 0) {
    var colE = personSheet.getRange(startRowP, types.PERSON_COL.CPF + 1, numRowsP, 1).getValues();
    for (var i = 0; i < colE.length; i++) {
      if ((colE[i][0] || '').toString().replace(/\D+/g, '') === cpfDigits) {
        found = true;
        break;
      }
    }
  }

  if (!found) throw new Error('CPF não encontrado na aba PERSON: ' + socioData.cpf);

  var socioSheet = ss.getSheetByName(types.SHEET_NAMES.SOCIOECONOMIC);
  if (!socioSheet) throw new Error('Aba SOCIOECONOMIC não encontrada.');

  var values = [
    new Date(),
    socioData.createdBy || '',
    '',
    '',
    socioData.cpf,
    '', // RESERVED_F
    '', // RESERVED_G
    socioData.tipoImovel,
    socioData.possuiVeiculo,
    socioData.possuiFilhos,
    socioData.comQuemFilhos
  ];

  // Encontrar primeira linha vazia
  var lastRow = Math.max(socioSheet.getLastRow(), 1);
  var startRow = 2;
  var inserted = false;

  if (lastRow >= startRow) {
    var n = lastRow - startRow + 1;
    var block = socioSheet.getRange(startRow, 1, n, 11).getValues();
    for (var r = 0; r < block.length; r++) {
      var row = block[r];
      var allEmpty = true;
      for (var c = 0; c < row.length; c++) {
        if (row[c] !== '' && row[c] !== null) { allEmpty = false; break; }
      }
      if (allEmpty) {
        var target = startRow + r;
        socioSheet.getRange(target, 1, 1, 11).setValues([values]);
        inserted = true;
        break;
      }
    }
  }

  if (!inserted) {
    var newRow = lastRow + 1;
    socioSheet.insertRowAfter(lastRow);
    socioSheet.getRange(newRow, 1, 1, 11).setValues([values]);
  }
}

/**
 * Atualiza registro em SOCIOECONOMIC pelo CPF.
 * @param {Object} socioData
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 */
function updateSocioeconomic(socioData, ss) {
  var socioSheet = ss.getSheetByName(types.SHEET_NAMES.SOCIOECONOMIC);
  if (!socioSheet) throw new Error('Aba SOCIOECONOMIC não encontrada.');

  var cpfDigits = (socioData.cpf || '').toString().replace(/\D+/g, '');
  if (!cpfDigits) throw new Error('CPF ausente para updateSocioeconomic.');

  var lastRow = Math.max(socioSheet.getLastRow(), 1);
  var startRow = 2;
  var numRows = Math.max(0, lastRow - 1);
  var foundRow = null;

  if (numRows > 0) {
    var colCpf = socioSheet.getRange(startRow, types.SOCIOECONOMIC_COL.CPF + 1, numRows, 1).getValues();
    for (var j = 0; j < colCpf.length; j++) {
      if ((colCpf[j][0] || '').toString().replace(/\D+/g, '') === cpfDigits) {
        foundRow = startRow + j;
        break;
      }
    }
  }

  if (!foundRow) throw new Error('CPF não encontrado na aba SOCIOECONOMIC: ' + socioData.cpf);

  var values = [
    socioData.tipoImovel,
    socioData.possuiVeiculo,
    socioData.possuiFilhos,
    socioData.comQuemFilhos
  ];

  socioSheet.getRange(foundRow, types.SOCIOECONOMIC_COL.TIPO_IMOVEL + 1, 1, 4).setValues([values]);
  socioSheet.getRange(foundRow, types.SOCIOECONOMIC_COL.UPDATED_AT + 1).setValue(new Date());
  socioSheet.getRange(foundRow, types.SOCIOECONOMIC_COL.UPDATED_BY + 1).setValue(socioData.updatedBy || socioData.createdBy || '');

  return { row: foundRow };
}

/**
 * Interceptor: salva (create ou update) um registro socioeconômico.
 * @param {Object} socioData
 * @param {string} [spreadsheetId] - ID da planilha (opcional, usa Types.DATABASE_ID se omitido).
 */
function saveSocioeconomic(socioData, spreadsheetId) {
  var ssId = spreadsheetId || types.DATABASE_ID;
  var ss = SpreadsheetApp.openById(ssId);

  // Formatar dados
  var formattedData = {
    cpf: utils.formatCPF(socioData.cpf),
    tipoImovel: socioData.tipoImovel,
    possuiVeiculo: socioData.possuiVeiculo,
    possuiFilhos: socioData.possuiFilhos,
    comQuemFilhos: socioData.comQuemFilhos,
    createdBy: socioData.createdBy,
    updatedBy: socioData.updatedBy
  };

  var personSheet = ss.getSheetByName(types.SHEET_NAMES.PERSON);
  if (!personSheet) throw new Error('Aba PERSON não encontrada.');

  var cpfDigits = formattedData.cpf.toString().replace(/\D+/g, '');
  if (!cpfDigits) throw new Error('CPF inválido/ausente em socioData.');

  // Validar CPF em PERSON
  var lastRowP = Math.max(personSheet.getLastRow(), 1);
  var startRowP = 2;
  var numRowsP = Math.max(0, lastRowP - 1);
  var personFound = false;

  if (numRowsP > 0) {
    var colE = personSheet.getRange(startRowP, types.PERSON_COL.CPF + 1, numRowsP, 1).getValues();
    for (var i = 0; i < colE.length; i++) {
      if ((colE[i][0] || '').toString().replace(/\D+/g, '') === cpfDigits) {
        personFound = true;
        break;
      }
    }
  }

  if (!personFound) throw new Error('CPF não encontrado na aba PERSON: ' + socioData.cpf);

  var socioSheet = ss.getSheetByName(types.SHEET_NAMES.SOCIOECONOMIC);
  if (!socioSheet) throw new Error('Aba SOCIOECONOMIC não encontrada.');

  // Verificar se já existe registro com mesmo CPF
  var lastRow = Math.max(socioSheet.getLastRow(), 1);
  var startRow = 2;
  var numRows = Math.max(0, lastRow - 1);
  var existingRow = null;

  if (numRows > 0) {
    var colCpf = socioSheet.getRange(startRow, types.SOCIOECONOMIC_COL.CPF + 1, numRows, 1).getValues();
    for (var j = 0; j < colCpf.length; j++) {
      var existingCpfDigits = utils.onlyDigits(colCpf[j][0] || '');
      if (existingCpfDigits === cpfDigits) {
        existingRow = startRow + j;
        break;
      }
    }
  }

  if (existingRow) {
    return updateSocioeconomic(formattedData, ss);
  }

  return createSocioeconomic(formattedData, ss);
}
