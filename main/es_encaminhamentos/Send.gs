/**
 * Send data from FORM_ES_ENCAMINHAMENTOS to PERSON sheet.
 */
function sendAllEsEncaminhamentos() {
  var ss = SpreadsheetApp.openById(types.ES_ENCAMINHAMENTOS_ID);
  var sheet = ss.getSheetByName(types.ES_ENCAMINHAMENTOS_SHEET_NAME);
  if (!sheet) throw new Error('Aba ' + types.ES_ENCAMINHAMENTOS_SHEET_NAME + ' não encontrada.');

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) { Logger.log('Nenhuma linha de dados.'); return; }

  var db = (typeof database !== 'undefined') ? database : null;
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    try {
      var personData = mapEsRowToPerson(row);
      var socioData = mapEsRowToSocioeconomic(row);
      // Salvar PERSON
      Logger.log('sendAllEsEncaminhamentos personData=%s', JSON.stringify(personData));
      if (db && typeof db.savePerson === 'function') {
        db.savePerson(personData, types.DATABASE_ID);
      } else if (typeof savePerson === 'function') {
        savePerson(personData, types.DATABASE_ID);
      } else {
        throw new Error('savePerson não disponível');
      }
      // Salvar SOCIOECONOMIC
      Logger.log('sendAllEsEncaminhamentos socioData=%s', JSON.stringify(socioData));
      if (db && typeof db.saveSocioeconomic === 'function') {
        db.saveSocioeconomic(socioData, types.DATABASE_ID);
      } else if (typeof saveSocioeconomic === 'function') {
        saveSocioeconomic(socioData, types.DATABASE_ID);
      } else {
        throw new Error('saveSocioeconomic não disponível');
      }
    } catch (e) {
      Logger.log('Erro ao processar linha ' + (r+1) + ': ' + e.message);
    }
  }
}

/**
 * Handler para submissão individual do Formulário ES.
 * Aceita o objeto de evento `e` do FormApp (usa `e.values`) ou, se não
 * disponível, lê a última linha da aba FORM_ES_ENCAMINHAMENTOS.
 */
function onSubmitEsEncaminhamentos(e) {
  Logger.log('onSubmitEsEncaminhamentos invoked');
  var row;
  if (e && e.values && e.values.length) {
    row = e.values;
    Logger.log('Event values length=%s', row.length);
  } else {
    // Fallback: read last row from sheet
    var ss = SpreadsheetApp.openById(types.ES_ENCAMINHAMENTOS_ID);
    var sheet = ss.getSheetByName(types.ES_ENCAMINHAMENTOS_SHEET_NAME);
    if (!sheet) throw new Error('Aba ' + types.ES_ENCAMINHAMENTOS_SHEET_NAME + ' não encontrada.');
    row = sheet.getRange(sheet.getLastRow(), 1, 1, 31).getValues()[0];
    Logger.log('Fallback read last row length=%s', row.length);
  }

  try {
    var personData = mapEsRowToPerson(row);
    var socioData = mapEsRowToSocioeconomic(row);
    var db = (typeof database !== 'undefined') ? database : null;
    var resPerson, resSocio;
    Logger.log('onSubmitEsEncaminhamentos personData=%s', JSON.stringify(personData));
    if (db && typeof db.savePerson === 'function') {
      resPerson = db.savePerson(personData, types.DATABASE_ID);
    } else if (typeof savePerson === 'function') {
      resPerson = savePerson(personData, types.DATABASE_ID);
    } else {
      throw new Error('savePerson não disponível');
    }
    Logger.log('onSubmitEsEncaminhamentos socioData=%s', JSON.stringify(socioData));
    if (db && typeof db.saveSocioeconomic === 'function') {
      resSocio = db.saveSocioeconomic(socioData, types.DATABASE_ID);
    } else if (typeof saveSocioeconomic === 'function') {
      resSocio = saveSocioeconomic(socioData, types.DATABASE_ID);
    } else {
      throw new Error('saveSocioeconomic não disponível');
    }
    Logger.log('onSubmitEsEncaminhamentos saved person result=%s', JSON.stringify(resPerson));
    Logger.log('onSubmitEsEncaminhamentos saved socioeconomic result=%s', JSON.stringify(resSocio));
    return { person: resPerson, socioeconomic: resSocio };
  } catch (err) {
    Logger.log('onSubmitEsEncaminhamentos error: %s', err.toString());
    throw err;
  }
}

function mapEsRowToPerson(row) {
  var c = types.ES_ENCAMINHAMENTOS_COL;
  var person = {};
  // Campos que mapeiam para PERSON
  if (row[c.CPF]) person.cpf = row[c.CPF].toString();
  if (row[c.NAME]) person.name = row[c.NAME];
  if (row[c.MOTHER_NAME]) person.motherName = row[c.MOTHER_NAME];
  if (row[c.FATHER_NAME]) person.fatherName = row[c.FATHER_NAME];
  if (row[c.BIRTH_DATE]) person.birthDate = row[c.BIRTH_DATE];
  if (row[c.EDUCATION]) person.education = row[c.EDUCATION];
  // Civil status / sexo / identidade / orientação / religião / raça / nacionalidade / tipo
  if (row[c.CIVIL_STATUS] !== undefined) person.maritalStatus = row[c.CIVIL_STATUS];
  if (row[c.SEX] !== undefined) person.sex = row[c.SEX];
  if (row[c.GENDER_IDENTITY] !== undefined) person.genderIdentity = row[c.GENDER_IDENTITY];
  if (row[c.SEXUAL_ORIENTATION] !== undefined) person.sexualOrientation = row[c.SEXUAL_ORIENTATION];
  if (row[c.RELIGION] !== undefined) person.religion = row[c.RELIGION];
  if (row[c.RACE_SELF_DECLARED] !== undefined) person.raceSelfDeclared = row[c.RACE_SELF_DECLARED];
  if (row[c.NATIONALITY] !== undefined) person.nationality = row[c.NATIONALITY];
  if (row[c.PERSON_TYPE] !== undefined) person.personType = row[c.PERSON_TYPE];

  if (row[c.PHONE] !== undefined) person.phone = row[c.PHONE];
  if (row[c.STREET] !== undefined) person.street = row[c.STREET];
  if (row[c.NEIGHBORHOOD] !== undefined) person.neighborhood = row[c.NEIGHBORHOOD];
  if (row[c.CITY] !== undefined) person.city = row[c.CITY];
  if (row[c.STATE] !== undefined) person.state = row[c.STATE];

  // Profissão atual
  if (row[c.CURRENT_PROFESSION] !== undefined) person.profissaoAtual = row[c.CURRENT_PROFESSION];

  // Map form submitter email into createdBy/updatedBy so create/update record the user
  if (row[c.EMAIL] !== undefined) {
    person.createdBy = row[c.EMAIL];
    person.updatedBy = row[c.EMAIL];
  }

  // createdBy/updatedBy not provided by form; set empty so create uses defaults
  return person;
}

/**
 * Mapeia uma linha do formulário ES para o objeto Socioeconomic.
 * @param {Array} row
 * @returns {Object}
 */
function mapEsRowToSocioeconomic(row) {
  var c = types.ES_ENCAMINHAMENTOS_COL;
  var socio = {};
  if (row[c.CPF]) socio.cpf = row[c.CPF].toString();
  if (row[c.PROPERTY_TYPE] !== undefined) socio.tipoImovel = row[c.PROPERTY_TYPE];
  if (row[c.HAS_VEHICLE] !== undefined) socio.possuiVeiculo = row[c.HAS_VEHICLE];
  if (row[c.HAS_CHILDREN] !== undefined) socio.possuiFilhos = row[c.HAS_CHILDREN];
  if (row[c.CHILDREN_WITH_WHOM] !== undefined) socio.comQuemFilhos = row[c.CHILDREN_WITH_WHOM];
  if (row[c.EMAIL] !== undefined) {
    socio.createdBy = row[c.EMAIL];
    socio.updatedBy = row[c.EMAIL];
  }
  return socio;
}
