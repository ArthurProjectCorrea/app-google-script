/**
 * ============================================================================
 * DATABASE - CRIMINAL PROCEDURE
 * ============================================================================
 * Funções para criar, atualizar e salvar procedimentos criminais.
 * Usa bibliotecas: Types (constantes) e Utils (formatação/validação).
 * ============================================================================
 */

/**
 * Cria um novo registro em CRIMINAL_PROCEDURE.
 * Valida que o CPF exista em PERSON.
 * @param {Object} procData
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 */
function createCriminalProcedure(procData, ss) {
  var personSheet = ss.getSheetByName(types.SHEET_NAMES.PERSON);
  if (!personSheet) throw new Error('Aba PERSON não encontrada.');

  var cpfDigits = (procData.cpf || '').toString().replace(/\D+/g, '');
  if (!cpfDigits) throw new Error('CPF inválido/ausente em procData.');

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

  if (!found) throw new Error('CPF não encontrado na aba PERSON: ' + procData.cpf);

  var procSheet = ss.getSheetByName(types.SHEET_NAMES.CRIMINAL_PROCEDURE);
  if (!procSheet) throw new Error('Aba CRIMINAL_PROCEDURE não encontrada.');

  var valuesAE = [new Date(), procData.createdBy || '', '', '', procData.cpf];
  var valuesHJ = [procData.processNumber, procData.sentenceRegime, utils.parseDateBR(procData.progressionDate)];

  // Encontrar primeira linha vazia
  var lastRow = Math.max(procSheet.getLastRow(), 1);
  var startRow = 2;
  var inserted = false;

  if (lastRow >= startRow) {
    var n = lastRow - startRow + 1;
    var block = procSheet.getRange(startRow, 1, n, 10).getValues();
    for (var r = 0; r < block.length; r++) {
      var row = block[r];
      var allEmpty = true;
      for (var c = 0; c < row.length; c++) {
        if (row[c] !== '' && row[c] !== null) { allEmpty = false; break; }
      }
      if (allEmpty) {
        var target = startRow + r;
        procSheet.getRange(target, 1, 1, 5).setValues([valuesAE]);
        procSheet.getRange(target, types.CRIMINAL_PROCEDURE_COL.PROCESS_NUMBER + 1, 1, 3).setValues([valuesHJ]);
        inserted = true;
        break;
      }
    }
  }

  if (!inserted) {
    var newRow = lastRow + 1;
    procSheet.insertRowAfter(lastRow);
    procSheet.getRange(newRow, 1, 1, 5).setValues([valuesAE]);
    procSheet.getRange(newRow, types.CRIMINAL_PROCEDURE_COL.PROCESS_NUMBER + 1, 1, 3).setValues([valuesHJ]);
  }
}

/**
 * Atualiza registro em CRIMINAL_PROCEDURE pelo número do processo.
 * @param {Object} procData
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 */
function updateCriminalProcedure(procData, ss) {
  var procSheet = ss.getSheetByName(types.SHEET_NAMES.CRIMINAL_PROCEDURE);
  if (!procSheet) throw new Error('Aba CRIMINAL_PROCEDURE não encontrada.');

  var procNum = (procData.processNumber || '').toString().trim().toUpperCase();
  if (!procNum) throw new Error('Número de processo ausente para updateCriminalProcedure.');

  var lastRow = Math.max(procSheet.getLastRow(), 1);
  var startRow = 2;
  var numRows = Math.max(0, lastRow - 1);
  var foundRow = null;

  if (numRows > 0) {
    var colH = procSheet.getRange(startRow, types.CRIMINAL_PROCEDURE_COL.PROCESS_NUMBER + 1, numRows, 1).getValues();
    for (var j = 0; j < colH.length; j++) {
      if ((colH[j][0] || '').toString().trim().toUpperCase() === procNum) {
        foundRow = startRow + j;
        break;
      }
    }
  }

  if (!foundRow) throw new Error('Número de processo não encontrado: ' + procData.processNumber);

  var valuesHJ = [procData.processNumber, procData.sentenceRegime, utils.parseDateBR(procData.progressionDate)];

  procSheet.getRange(foundRow, types.CRIMINAL_PROCEDURE_COL.PROCESS_NUMBER + 1, 1, 3).setValues([valuesHJ]);
  procSheet.getRange(foundRow, types.CRIMINAL_PROCEDURE_COL.UPDATED_AT + 1).setValue(new Date());
  procSheet.getRange(foundRow, types.CRIMINAL_PROCEDURE_COL.UPDATED_BY + 1).setValue(procData.updatedBy || procData.createdBy || '');

  return { row: foundRow };
}

/**
 * Interceptor: salva (create ou update) um procedimento criminal.
 * @param {Object} procData
 * @param {string} [spreadsheetId] - ID da planilha (opcional, usa Types.DATABASE_ID se omitido).
 */
function saveCriminalProcedure(procData, spreadsheetId) {
  var ssId = spreadsheetId || types.DATABASE_ID;
  var ss = SpreadsheetApp.openById(ssId);

  // Formatar dados
  var formattedData = {
    cpf: utils.formatCPF(procData.cpf),
    processNumber: utils.formatProcessNumber(procData.processNumber),
    sentenceRegime: procData.sentenceRegime,
    progressionDate: procData.progressionDate,
    createdBy: procData.createdBy,
    updatedBy: procData.updatedBy
  };

  var personSheet = ss.getSheetByName(types.SHEET_NAMES.PERSON);
  if (!personSheet) throw new Error('Aba PERSON não encontrada.');

  var cpfDigits = formattedData.cpf.toString().replace(/\D+/g, '');
  if (!cpfDigits) throw new Error('CPF inválido/ausente em procData.');

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

  if (!personFound) throw new Error('CPF não encontrado na aba PERSON: ' + procData.cpf);

  var procSheet = ss.getSheetByName(types.SHEET_NAMES.CRIMINAL_PROCEDURE);
  if (!procSheet) throw new Error('Aba CRIMINAL_PROCEDURE não encontrada.');

  // Verificar se já existe registro com mesmo CPF e processNumber
  var lastRow = Math.max(procSheet.getLastRow(), 1);
  var startRow = 2;
  var numRows = Math.max(0, lastRow - 1);
  var existingRow = null;

  if (numRows > 0) {
    var colEProc = procSheet.getRange(startRow, types.CRIMINAL_PROCEDURE_COL.CPF + 1, numRows, 1).getValues();
    var colH = procSheet.getRange(startRow, types.CRIMINAL_PROCEDURE_COL.PROCESS_NUMBER + 1, numRows, 1).getValues();
    for (var j = 0; j < colEProc.length; j++) {
      var existingCpfDigits = utils.onlyDigits(colEProc[j][0] || '');
      var existingProcNum = (colH[j][0] || '').toString().trim().toUpperCase();
      if (existingCpfDigits === cpfDigits && existingProcNum === formattedData.processNumber.toUpperCase()) {
        existingRow = startRow + j;
        break;
      }
    }
  }

  if (existingRow) {
    return updateCriminalProcedure(formattedData, ss);
  }

  return createCriminalProcedure(formattedData, ss);
}
