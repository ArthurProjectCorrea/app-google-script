/**
 * ============================================================================
 * DATABASE - PERSON
 * ============================================================================
 * Funções para criar, atualizar e salvar pessoas na aba PERSON.
 * Usa bibliotecas: Types (constantes) e Utils (formatação/validação).
 * ============================================================================
 */

/**
 * Cria uma nova pessoa na planilha PERSON.
 * @param {Object} personData - Objeto contendo os dados da pessoa.
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 */
function createPerson(personData, ss) {
  var sheet = ss.getSheetByName(types.SHEET_NAMES.PERSON);
  if (!sheet) throw new Error('Aba PERSON não encontrada na planilha.');
  var rowValues = [
    new Date(),                                      // A: createdAt
    personData.createdBy || '',                      // B: createdBy
    '',                                              // C: updatedAt
    '',                                              // D: updatedBy
    personData.cpf || '',                            // E: cpf
    personData.name || '',                           // F: name
    personData.motherName || '',                     // G: motherName
    personData.fatherName || '',                     // H: fatherName
    personData.birthDate || '',                      // I: birthDate
    personData.education || '',                      // J: education
    personData.phone || '',                          // K: phone
    personData.street || '',                         // L: street
    personData.neighborhood || '',                   // M: neighborhood
    personData.city || '',                           // N: city
    personData.state || '',                          // O: state
    personData.maritalStatus || '',                  // P: ESTADO CIVIL
    personData.sex || '',                            // Q: SEXO
    personData.genderIdentity || '',                 // R: IDENTIDADE DE GÊNERO
    personData.sexualOrientation || '',              // S: ORIENTAÇÃO SEXUAL
    personData.religion || '',                       // T: RELIGIÃO
    personData.raceSelfDeclared || '',               // U: RAÇA - AUTODECLARADA
    personData.nationality || '',                    // V: NACIONALIDADE
    personData.personType || '',                     // W: TIPO DE PESSOA
    personData.profissaoAtual || ''                  // X: PROFISSÃO ATUAL
  ];

  sheet.appendRow(rowValues);
  // Retornar índice da linha criada
  var newRow = sheet.getLastRow();
  return { row: newRow };
}

/**
 * Atualiza uma pessoa existente identificada pelo CPF.
 * @param {Object} personData - Deve conter `cpf` e os campos a atualizar.
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 */
function updatePerson(personData, ss) {
  var sheet = ss.getSheetByName(types.SHEET_NAMES.PERSON);
  if (!sheet) throw new Error('Aba PERSON não encontrada.');

  var cpfDigits = personData.cpf.toString().replace(/\D+/g, '');
  if (!cpfDigits) throw new Error('CPF inválido para updatePerson.');
  var foundRow = utils.findRowByColumnValue(ss, types.SHEET_NAMES.PERSON, types.PERSON_COL.CPF, cpfDigits, 2);
  if (!foundRow) throw new Error('CPF não encontrado para updatePerson: ' + personData.cpf);

  // Colunas F..W -> keys mapping
  var colKeys = [
    'name','motherName','fatherName','birthDate','education','phone','street','neighborhood','city','state',
    'maritalStatus','sex','genderIdentity','sexualOrientation','religion','raceSelfDeclared','nationality','personType','profissaoAtual'
  ];

  var startCol = types.PERSON_COL.NAME + 1; // 1-based index
  var numCols = colKeys.length;

  var existing = sheet.getRange(foundRow, startCol, 1, numCols).getValues()[0];
  var newRow = [];
  for (var i = 0; i < numCols; i++) {
    var key = colKeys[i];
    if (typeof personData[key] !== 'undefined' && personData[key] !== null && personData[key] !== '') {
      newRow.push(personData[key]);
    } else {
      newRow.push(existing[i] || '');
    }
  }

  sheet.getRange(foundRow, startCol, 1, numCols).setValues([newRow]);

  // Atualizar C (updatedAt) e D (updatedBy)
  sheet.getRange(foundRow, types.PERSON_COL.UPDATED_AT + 1).setValue(new Date());
  sheet.getRange(foundRow, types.PERSON_COL.UPDATED_BY + 1).setValue(personData.updatedBy || personData.createdBy || '');

  return { row: foundRow };
}

/**
 * Interceptor: salva (create ou update) uma pessoa baseada no CPF existente.
 * Formata dados primeiro, valida educação, depois decide.
 * @param {Object} personData
 * @param {string} [spreadsheetId] - ID da planilha (opcional, usa Types.DATABASE_ID se omitido).
 */
function savePerson(personData, spreadsheetId) {
  var ssId = spreadsheetId || types.DATABASE_ID;
  var ss = SpreadsheetApp.openById(ssId);

  // Formatar dados
  // Build formattedData only for keys that were provided by the caller.
  var formattedData = {};

  if (personData.hasOwnProperty('cpf')) formattedData.cpf = utils.formatCPF(personData.cpf);
  if (personData.hasOwnProperty('name')) formattedData.name = utils.formatToUpper(personData.name);
  if (personData.hasOwnProperty('motherName')) formattedData.motherName = utils.formatToUpper(personData.motherName);
  if (personData.hasOwnProperty('fatherName')) formattedData.fatherName = utils.formatToUpper(personData.fatherName);
  if (personData.hasOwnProperty('birthDate')) formattedData.birthDate = personData.birthDate;
  if (personData.hasOwnProperty('education')) formattedData.education = personData.education;
  if (personData.hasOwnProperty('phone')) formattedData.phone = utils.formatPhone(personData.phone);
  if (personData.hasOwnProperty('street')) formattedData.street = utils.formatToUpper(personData.street);
  if (personData.hasOwnProperty('neighborhood')) formattedData.neighborhood = utils.formatToUpper(personData.neighborhood);
  if (personData.hasOwnProperty('city')) formattedData.city = utils.formatToUpper(personData.city);
  if (personData.hasOwnProperty('state')) formattedData.state = personData.state;
  if (personData.hasOwnProperty('maritalStatus')) formattedData.maritalStatus = personData.maritalStatus ? utils.formatToUpper(personData.maritalStatus) : '';
  if (personData.hasOwnProperty('sex')) formattedData.sex = personData.sex;
  if (personData.hasOwnProperty('genderIdentity')) formattedData.genderIdentity = personData.genderIdentity ? utils.formatToUpper(personData.genderIdentity) : '';
  if (personData.hasOwnProperty('sexualOrientation')) formattedData.sexualOrientation = personData.sexualOrientation ? utils.formatToUpper(personData.sexualOrientation) : '';
  if (personData.hasOwnProperty('religion')) formattedData.religion = personData.religion ? utils.formatToUpper(personData.religion) : '';
  if (personData.hasOwnProperty('raceSelfDeclared')) formattedData.raceSelfDeclared = personData.raceSelfDeclared ? utils.formatToUpper(personData.raceSelfDeclared) : '';
  if (personData.hasOwnProperty('nationality')) formattedData.nationality = personData.nationality ? utils.formatToUpper(personData.nationality) : '';
  if (personData.hasOwnProperty('personType')) formattedData.personType = personData.personType ? utils.formatToUpper(personData.personType) : '';
  if (personData.hasOwnProperty('profissaoAtual')) formattedData.profissaoAtual = personData.profissaoAtual ? utils.formatToUpper(personData.profissaoAtual) : '';
  if (personData.hasOwnProperty('createdBy')) formattedData.createdBy = personData.createdBy;
  if (personData.hasOwnProperty('updatedBy')) formattedData.updatedBy = personData.updatedBy;

  // Educação vinda do formulário já vem formatada; não validar aqui.

  var sheet = ss.getSheetByName(types.SHEET_NAMES.PERSON);
  if (!sheet) throw new Error('Aba PERSON não encontrada.');

  var cpfDigits = formattedData.cpf.toString().replace(/\D+/g, '');
  if (!cpfDigits) {
    var resCreate = createPerson(formattedData, ss) || {};
    resCreate.audit = { presentFields: Object.keys(formattedData) };
    Logger.log('savePerson created row=%s presentFields=%s', resCreate.row || '-', JSON.stringify(resCreate.audit.presentFields));
    return resCreate;
  }

  var foundRow = utils.findRowByColumnValue(ss, types.SHEET_NAMES.PERSON, types.PERSON_COL.CPF, cpfDigits, 2);
  var found = foundRow !== null;
  if (found) {
    var resUpdate = updatePerson(formattedData, ss) || {};
    resUpdate.audit = { presentFields: Object.keys(formattedData) };
    Logger.log('savePerson updated row=%s presentFields=%s', resUpdate.row || '-', JSON.stringify(resUpdate.audit.presentFields));
    return resUpdate;
  }

  var resCreate2 = createPerson(formattedData, ss) || {};
  resCreate2.audit = { presentFields: Object.keys(formattedData) };
  Logger.log('savePerson created row=%s presentFields=%s', resCreate2.row || '-', JSON.stringify(resCreate2.audit.presentFields));
  return resCreate2;
}
