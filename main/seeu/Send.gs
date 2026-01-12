/**
 * SEEU - Send
 * Prepara os dados do formulário SEEU e delega o envio ao `utils.sendStructured`.
 * Exporta `onSubmitForm` que é usada nos testes e pelo gatilho de formulário.
 */

/**
 * onSubmitForm
 * @param {Object} form - objeto com os campos do formulário SEEU (nome amigável usado nos testes)
 * @returns {Object} resultado do envio: { results: {...}, errors: [...] }
 */
function onSubmitForm(e) {
  Logger.log('onSubmitForm: evento recebido');

  // Aceita tanto um objeto `form` já mapeado quanto o evento do Forms (`e`)
  var form = e;
  if (e && (e.values || e.namedValues)) {
    var values = e.values || [];
    form = {
      timestamp: values[types.FORM_SEEU_COL.TIMESTAMP] || '',
      email: values[types.FORM_SEEU_COL.EMAIL] || '',
      processNumber: values[types.FORM_SEEU_COL.PROCESS_NUMBER] || '',
      name: values[types.FORM_SEEU_COL.NAME] || '',
      motherName: values[types.FORM_SEEU_COL.MOTHER_NAME] || '',
      fatherName: values[types.FORM_SEEU_COL.FATHER_NAME] || '',
      birthDate: values[types.FORM_SEEU_COL.BIRTH_DATE] || '',
      cpf: values[types.FORM_SEEU_COL.CPF] || '',
      phone: values[types.FORM_SEEU_COL.PHONE] || '',
      street: values[types.FORM_SEEU_COL.STREET] || '',
      regimeAtual: values[types.FORM_SEEU_COL.REGIME_ATUAL] || '',
      progressionDate: values[types.FORM_SEEU_COL.PROGRESSION_DATE] || '',
      profissao: values[types.FORM_SEEU_COL.PROFISSAO] || '',
      interesseEm: values[types.FORM_SEEU_COL.INTERESSE_EM] || '',
      education: values[types.FORM_SEEU_COL.EDUCATION] || '',
      comprovanteResidencia: values[types.FORM_SEEU_COL.COMPROVANTE_RESIDENCIA] || '',
      comprovanteTrabalho: values[types.FORM_SEEU_COL.COMPROVANTE_TRABALHO] || '',
      primeiraAssinatura: values[types.FORM_SEEU_COL.PRIMEIRA_ASSINATURA] || '',
      comprovanteDispensaLegal: values[types.FORM_SEEU_COL.COMPROVANTE_DISPENSA_LEGAL] || '',
      neighborhood: values[types.FORM_SEEU_COL.NEIGHBORHOOD] || '',
      city: values[types.FORM_SEEU_COL.CITY] || '',
      state: values[types.FORM_SEEU_COL.STATE] || ''
    };
    Logger.log('onSubmitForm: evento mapeado para form = %s', JSON.stringify(form));
  }

  if (!form || typeof form !== 'object') {
    throw new Error('onSubmitForm: evento inválido');
  }

  // Helpers
  function isFilled(v) {
    return (typeof v !== 'undefined' && v !== null && String(v).trim() !== '');
  }

  // Montar payloads somente com os campos presentes
  var personPayload = {};
  var procPayload = {};
  var socioPayload = {};

  // Campos de Pessoa (Person)
  var personFields = ['cpf','name','motherName','fatherName','birthDate','education','phone','street','neighborhood','city','state','profissao'];
  var anyPerson = false;
  for (var i = 0; i < personFields.length; i++) {
    var key = personFields[i];
    var val = form[key];
    if (isFilled(val)) {
      // Map `profissao` -> `profissaoAtual` to match database API
      if (key === 'profissao') {
        personPayload.profissaoAtual = String(val).trim();
      } else {
        personPayload[key] = (typeof val === 'string') ? val.trim() : val;
      }
      anyPerson = true;
    }
  }
  if (anyPerson) {
    personPayload.createdBy = form.email || '';
  }

  // Campos de Procedimento Criminal
  var anyProc = false;
  if (isFilled(form.processNumber)) {
    procPayload.processNumber = String(form.processNumber).trim();
    anyProc = true;
  }
  if (isFilled(form.regimeAtual)) {
    procPayload.sentenceRegime = String(form.regimeAtual).trim();
    anyProc = true;
  }
  if (isFilled(form.progressionDate)) {
    procPayload.progressionDate = String(form.progressionDate).trim();
    anyProc = true;
  }
  if (anyProc) {
    procPayload.cpf = form.cpf || '';
    procPayload.createdBy = form.email || '';
  }

  // Campos Socioeconômicos - somente se o formulário trouxer campos compatíveis
  var socioFields = ['tipoImovel','possuiVeiculo','possuiFilhos','comQuemFilhos'];
  var anySocio = false;
  for (var j = 0; j < socioFields.length; j++) {
    var sk = socioFields[j];
    var sval = form[sk];
    if (isFilled(sval)) {
      socioPayload[sk] = (typeof sval === 'string') ? sval.trim() : sval;
      anySocio = true;
    }
  }
  if (anySocio) {
    socioPayload.cpf = form.cpf || '';
    socioPayload.createdBy = form.email || '';
  }

  // Construir objeto de envio apenas com recursos preenchidos
  var resources = {};
  if (anyPerson) resources.person = personPayload;
  if (anyProc) resources.criminalProcedure = procPayload;
  if (anySocio) resources.socioeconomic = socioPayload;

  if (Object.keys(resources).length === 0) {
    Logger.log('onSubmitForm: nenhum campo aplicável para enviar ao database');
    return { results: {}, errors: [] };
  }

  // Delegar para utils
  try {
    var res = utils.sendStructured(resources);
    return res;
  } catch (e) {
    Logger.log('onSubmitForm error: %s', e.toString());
    return { results: {}, errors: [{ message: e.toString() }] };
  }
}

/** Alias compatível com a solicitação do time: onSubmitSend */
function onSubmitSend(form) {
  return onSubmitForm(form);
}

