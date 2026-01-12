/**
 * Recebe os dados do formulário SEEU e salva nas abas
 * `PERSON` e `CRIMINAL_PROCEDURE` da planilha de destino.
 * Usa a biblioteca `database` para validações e formatações.
 * @param {Object} formEvent - Evento do formulário ou objeto FormSeeu.
 * @returns {Object} resumo das operações (person/criminalProcedure/errors)
 */
function onSubmitForm(formEvent) {
  // Parsear evento para objeto FormSeeu
  var form = utils.parseFormSeeuEvent(formEvent);

  var email = form.email || '';
  var timestamp = form.timestamp || new Date();

  Logger.log('onSubmitForm: email=%s, timestamp=%s', email, timestamp);
  Logger.log('Form data (parsed): %s', JSON.stringify(form));

  // Build personData only with properties actually present in the parsed form.
  var personData = {};
  var keys = ['cpf','name','motherName','fatherName','birthDate','education','phone','street','neighborhood','city','state'];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (form.hasOwnProperty(k)) {
      personData[k] = form[k]; // include even if empty string -> will overwrite
    }
  }
  // Always include createdBy/updatedBy
  personData.createdBy = email;
  personData.updatedBy = email;

  // Incluir profissaoAtual do último atendimento se disponível
  var ultimoAtendimento = utils.getLastSeeuAttendance(personData.cpf ? personData.cpf.replace(/\D+/g, '') : '');
  if (ultimoAtendimento && ultimoAtendimento.profissao) {
    personData.profissaoAtual = ultimoAtendimento.profissao;
  }

  var addressData = {
    cpf: form.cpf,
    street: form.street,
    neighborhood: form.neighborhood,
    city: form.city,
    state: form.state,
    createdBy: email,
    updatedBy: email
  };

  var procData = {
    cpf: form.cpf,
    processNumber: form.processNumber,
    sentenceRegime: form.regimeAtual,
    progressionDate: form.progressionDate,
    createdBy: email,
    updatedBy: email
  };

  Logger.log('personData: %s', JSON.stringify(personData));
  Logger.log('addressData: %s', JSON.stringify(addressData));
  Logger.log('procData: %s', JSON.stringify(procData));

  // Normalizar education: remover prefixo 'ENSINO ' se houver
  var personDataEduc = personData.education || '';
  personDataEduc = personDataEduc.toString().replace(/^ENSINO\s+/i, '').toUpperCase().trim();
  personData.education = personDataEduc;

  // Normalizar sentenceRegime: remover prefixo 'REGIME ' e padronizar para valores válidos
  var regime = procData.sentenceRegime || '';
  regime = regime.toString().replace(/^REGIME\s+/i, '').toUpperCase().trim();
  procData.sentenceRegime = regime;

  var summary = { person: null, criminalProcedure: null, errors: [] };
  var db = (typeof database !== 'undefined') ? database : null;
  Logger.log('database available: %s', db ? 'yes' : 'no');

  var databaseId = types.DATABASE_ID;

  // Salvar/atualizar Person
  try {
    Logger.log('Attempting to save Person...');
    if (db && typeof db.savePerson === 'function') {
      Logger.log('Using database.savePerson');
      summary.person = db.savePerson(personData, databaseId);
    } else if (typeof savePerson === 'function') {
      Logger.log('Using global savePerson');
      summary.person = savePerson(personData, databaseId);
    } else {
      throw new Error('savePerson não disponível');
    }
    Logger.log('Person saved: %s', JSON.stringify(summary.person));
  } catch (e) {
    Logger.log('Person error: %s', e.toString());
    summary.errors.push({ table: 'PERSON', message: e.toString() });
  }

  // Salvar/atualizar CriminalProcedure — só se houver número de processo ou regime
  try {
    var hasProc = (procData.processNumber || procData.sentenceRegime || procData.progressionDate);
    Logger.log('hasProc: %s (processNumber=%s, sentenceRegime=%s, progressionDate=%s)', hasProc, procData.processNumber, procData.sentenceRegime, procData.progressionDate);
    if (hasProc) {
      Logger.log('Attempting to save CriminalProcedure...');
      if (db && typeof db.saveCriminalProcedure === 'function') {
        Logger.log('Using database.saveCriminalProcedure');
        summary.criminalProcedure = db.saveCriminalProcedure(procData, databaseId);
      } else if (typeof saveCriminalProcedure === 'function') {
        Logger.log('Using global saveCriminalProcedure');
        summary.criminalProcedure = saveCriminalProcedure(procData, databaseId);
      } else {
        throw new Error('saveCriminalProcedure não disponível');
      }
      Logger.log('CriminalProcedure saved: %s', JSON.stringify(summary.criminalProcedure));
    } else {
      Logger.log('Skipping CriminalProcedure (no data)');
    }
  } catch (e) {
    Logger.log('CriminalProcedure error: %s', e.toString());
    summary.errors.push({ table: 'CRIMINAL_PROCEDURE', message: e.toString() });
  }

  Logger.log('Final summary: %s', JSON.stringify(summary));
  return summary;
}

