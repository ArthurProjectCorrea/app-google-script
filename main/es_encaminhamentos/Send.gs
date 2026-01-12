/**
 * ES_ENCAMINHAMENTOS - Send
 * Prepara os dados da linha de `FORM_ES_ENCAMINHAMENTOS` e delega o envio ao `utils.sendStructured`.
 * Exporta `onSubmitSend` usada pelo gatilho de formulário.
 */

/**
 * onSubmitSend
 * @param {Object} form - objeto com os campos do formulário ES_ENCAMINHAMENTOS (nomes amigáveis)
 * @returns {Object} resultado do envio: { results: {...}, errors: [...] }
 */
function onSubmitSend(e) {
  Logger.log('onSubmitSend: evento recebido');

  // Aceita tanto um objeto `form` já mapeado quanto o evento do Forms (`e`)
  var form = e;
  if (e && (e.values || e.namedValues)) {
    var values = e.values || [];
    form = {
      timestamp: values[types.ES_ENCAMINHAMENTOS_COL.TIMESTAMP] || '',
      email: values[types.ES_ENCAMINHAMENTOS_COL.EMAIL] || '',
      tipoAtendimento: values[types.ES_ENCAMINHAMENTOS_COL.TIPO_ATENDIMENTO] || '',
      name: values[types.ES_ENCAMINHAMENTOS_COL.NAME] || '',
      motherName: values[types.ES_ENCAMINHAMENTOS_COL.MOTHER_NAME] || '',
      fatherName: values[types.ES_ENCAMINHAMENTOS_COL.FATHER_NAME] || '',
      birthDate: values[types.ES_ENCAMINHAMENTOS_COL.BIRTH_DATE] || '',
      cpf: values[types.ES_ENCAMINHAMENTOS_COL.CPF] || '',
      education: values[types.ES_ENCAMINHAMENTOS_COL.EDUCATION] || '',
      civilStatus: values[types.ES_ENCAMINHAMENTOS_COL.CIVIL_STATUS] || '',
      sex: values[types.ES_ENCAMINHAMENTOS_COL.SEX] || '',
      genderIdentity: values[types.ES_ENCAMINHAMENTOS_COL.GENDER_IDENTITY] || '',
      sexualOrientation: values[types.ES_ENCAMINHAMENTOS_COL.SEXUAL_ORIENTATION] || '',
      religion: values[types.ES_ENCAMINHAMENTOS_COL.RELIGION] || '',
      raceSelfDeclared: values[types.ES_ENCAMINHAMENTOS_COL.RACE_SELF_DECLARED] || '',
      nationality: values[types.ES_ENCAMINHAMENTOS_COL.NATIONALITY] || '',
      personType: values[types.ES_ENCAMINHAMENTOS_COL.PERSON_TYPE] || '',
      currentRegime: values[types.ES_ENCAMINHAMENTOS_COL.CURRENT_REGIME] || '',
      phone: values[types.ES_ENCAMINHAMENTOS_COL.PHONE] || '',
      street: values[types.ES_ENCAMINHAMENTOS_COL.STREET] || '',
      neighborhood: values[types.ES_ENCAMINHAMENTOS_COL.NEIGHBORHOOD] || '',
      city: values[types.ES_ENCAMINHAMENTOS_COL.CITY] || '',
      state: values[types.ES_ENCAMINHAMENTOS_COL.STATE] || '',
      propertyType: values[types.ES_ENCAMINHAMENTOS_COL.PROPERTY_TYPE] || '',
      hasVehicle: values[types.ES_ENCAMINHAMENTOS_COL.HAS_VEHICLE] || '',
      hasChildren: values[types.ES_ENCAMINHAMENTOS_COL.HAS_CHILDREN] || '',
      childrenWithWhom: values[types.ES_ENCAMINHAMENTOS_COL.CHILDREN_WITH_WHOM] || '',
      currentProfession: values[types.ES_ENCAMINHAMENTOS_COL.CURRENT_PROFESSION] || '',
      startDate: values[types.ES_ENCAMINHAMENTOS_COL.START_DATE] || '',
      monthlyIncome: values[types.ES_ENCAMINHAMENTOS_COL.MONTHLY_INCOME] || ''
    };
    Logger.log('onSubmitSend: evento mapeado para form = %s', JSON.stringify(form));
  }

  if (!form || typeof form !== 'object') {
    throw new Error('onSubmitSend: evento inválido');
  }

  // Montar payloads somente com os campos presentes
  var personPayload = {};
  var procPayload = {};
  var socioPayload = {};

  // Campos de Person (mapear nomes do formulário para o formato de savePerson)
  var personMap = {
    name: 'name',
    motherName: 'motherName',
    fatherName: 'fatherName',
    birthDate: 'birthDate',
    cpf: 'cpf',
    education: 'education',
    civilStatus: 'maritalStatus',
    sex: 'sex',
    genderIdentity: 'genderIdentity',
    sexualOrientation: 'sexualOrientation',
    religion: 'religion',
    raceSelfDeclared: 'raceSelfDeclared',
    nationality: 'nationality',
    personType: 'personType',
    phone: 'phone',
    street: 'street',
    neighborhood: 'neighborhood',
    city: 'city',
    state: 'state',
    currentProfession: 'profissaoAtual'
  };

  function isFilled(v) {
    return (typeof v !== 'undefined' && v !== null && String(v).trim() !== '');
  }

  var anyPerson = false;
  for (var k in personMap) {
    if (!personMap.hasOwnProperty(k)) continue;
    var val = form[k];
    if (isFilled(val)) {
      personPayload[personMap[k]] = (typeof val === 'string') ? val.trim() : val;
      anyPerson = true;
    }
  }
  if (anyPerson) personPayload.createdBy = form.email || '';

  // Campos de Criminal Procedure (só se houver número de processo ou regime atual)
  var anyProc = false;
  if (isFilled(form.processNumber)) {
    procPayload.processNumber = String(form.processNumber).trim();
    anyProc = true;
  }
  if (isFilled(form.currentRegime)) {
    procPayload.sentenceRegime = String(form.currentRegime).trim();
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

  // Campos Socioeconômicos (Property type, has vehicle, has children, children with whom)
  var socioMapping = {
    propertyType: 'tipoImovel',
    hasVehicle: 'possuiVeiculo',
    hasChildren: 'possuiFilhos',
    childrenWithWhom: 'comQuemFilhos'
  };
  var anySocio = false;
  for (var sk in socioMapping) {
    if (!socioMapping.hasOwnProperty(sk)) continue;
    var sval = form[sk];
    if (isFilled(sval)) {
      socioPayload[socioMapping[sk]] = (typeof sval === 'string') ? sval.trim() : sval;
      anySocio = true;
    }
  }
  if (anySocio) {
    socioPayload.cpf = form.cpf || '';
    socioPayload.createdBy = form.email || '';
  }

  var resources = {};
  if (anyPerson) resources.person = personPayload;
  if (anyProc) resources.criminalProcedure = procPayload;
  if (anySocio) resources.socioeconomic = socioPayload;

  if (Object.keys(resources).length === 0) {
    Logger.log('onSubmitSend: nenhum campo aplicável para enviar ao database');
    return { results: {}, errors: [] };
  }

  try {
    var res = utils.sendStructured(resources);
    return res;
  } catch (e) {
    Logger.log('onSubmitSend error: %s', e.toString());
    return { results: {}, errors: [{ message: e.toString() }] };
  }
}

