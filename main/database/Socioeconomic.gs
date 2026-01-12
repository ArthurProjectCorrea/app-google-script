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
  // Validate types constants
  if (typeof types === 'undefined' || !types.SOCIOECONOMIC_COL) {
    throw new Error('types.SOCIOECONOMIC_COL não disponível. Adicione a biblioteca `types`.');
  }

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

  // Prepare cell values explicitly to ensure columns F-G are skipped and H-K are set
  var createdAt = new Date();
  var createdBy = socioData.createdBy || '';
  var cpf = socioData.cpf || '';
  var tipoImovel = socioData.tipoImovel || '';
  var possuiVeiculo = socioData.possuiVeiculo || '';
  var possuiFilhos = socioData.possuiFilhos || '';
  var comQuemFilhos = socioData.comQuemFilhos || '';

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
        // A-E
        socioSheet.getRange(target, types.SOCIOECONOMIC_COL.CREATED_AT + 1).setValue(createdAt);
        socioSheet.getRange(target, types.SOCIOECONOMIC_COL.CREATED_BY + 1).setValue(createdBy);
        socioSheet.getRange(target, types.SOCIOECONOMIC_COL.UPDATED_AT + 1).setValue('');
        socioSheet.getRange(target, types.SOCIOECONOMIC_COL.UPDATED_BY + 1).setValue('');
        socioSheet.getRange(target, types.SOCIOECONOMIC_COL.CPF + 1).setValue(cpf);
        // F-G remain empty (reserved)
        // H-K socio fields
        socioSheet.getRange(target, types.SOCIOECONOMIC_COL.TIPO_IMOVEL + 1).setValue(tipoImovel);
        socioSheet.getRange(target, types.SOCIOECONOMIC_COL.POSSUI_VEICULO + 1).setValue(possuiVeiculo);
        socioSheet.getRange(target, types.SOCIOECONOMIC_COL.POSSUI_FILHOS + 1).setValue(possuiFilhos);
        socioSheet.getRange(target, types.SOCIOECONOMIC_COL.COM_QUEM_FILHOS + 1).setValue(comQuemFilhos);
        inserted = true;
        // return the inserted row index for convenience
        return { row: target };
      }
    }
  }

  if (!inserted) {
    var newRow = lastRow + 1;
    socioSheet.insertRowAfter(lastRow);
    var target = newRow;
    socioSheet.getRange(target, types.SOCIOECONOMIC_COL.CREATED_AT + 1).setValue(createdAt);
    socioSheet.getRange(target, types.SOCIOECONOMIC_COL.CREATED_BY + 1).setValue(createdBy);
    socioSheet.getRange(target, types.SOCIOECONOMIC_COL.UPDATED_AT + 1).setValue('');
    socioSheet.getRange(target, types.SOCIOECONOMIC_COL.UPDATED_BY + 1).setValue('');
    socioSheet.getRange(target, types.SOCIOECONOMIC_COL.CPF + 1).setValue(cpf);
    socioSheet.getRange(target, types.SOCIOECONOMIC_COL.TIPO_IMOVEL + 1).setValue(tipoImovel);
    socioSheet.getRange(target, types.SOCIOECONOMIC_COL.POSSUI_VEICULO + 1).setValue(possuiVeiculo);
    socioSheet.getRange(target, types.SOCIOECONOMIC_COL.POSSUI_FILHOS + 1).setValue(possuiFilhos);
    socioSheet.getRange(target, types.SOCIOECONOMIC_COL.COM_QUEM_FILHOS + 1).setValue(comQuemFilhos);
    return { row: target };
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

  // Update individual socio fields to ensure correct columns (H-K)
  socioSheet.getRange(foundRow, types.SOCIOECONOMIC_COL.TIPO_IMOVEL + 1).setValue(socioData.tipoImovel || '');
  socioSheet.getRange(foundRow, types.SOCIOECONOMIC_COL.POSSUI_VEICULO + 1).setValue(socioData.possuiVeiculo || '');
  socioSheet.getRange(foundRow, types.SOCIOECONOMIC_COL.POSSUI_FILHOS + 1).setValue(socioData.possuiFilhos || '');
  socioSheet.getRange(foundRow, types.SOCIOECONOMIC_COL.COM_QUEM_FILHOS + 1).setValue(socioData.comQuemFilhos || '');

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
  if (typeof types === 'undefined' || !types.SOCIOECONOMIC_COL) {
    throw new Error('types.SOCIOECONOMIC_COL não disponível. Adicione a biblioteca `types`.');
  }

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
  Logger.log('saveSocioeconomic: formattedData=%s', JSON.stringify(formattedData));

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
