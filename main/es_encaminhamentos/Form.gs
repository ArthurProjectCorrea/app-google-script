/**
 * Helpers para montar URL de pré-preenchimento do formulário ES_ENCAMINHAMENTOS
 * Contém validadores para campos other option (orientação sexual, religião, tipo)
 * usando os entry IDs extraídos do Formulário.
 */

var ES_FORM_ENTRIES = {
  NAME: 'entry.11265846',
  MOTHER: 'entry.1375638929',
  FATHER: 'entry.1705452342',
  BIRTH_DATE: 'entry.976579838',
  CPF: 'entry.1735295425',
  EDUCATION: 'entry.170081653',
  CIVIL_STATUS: 'entry.643848658',
  SEX: 'entry.41778644',
  GENDER_IDENTITY: 'entry.987955348',
  SEXUAL_ORIENTATION: 'entry.635184628',
  SEXUAL_ORIENTATION_OTHER: 'entry.635184628.other_option_response',
  RELIGION: 'entry.1607472911',
  RELIGION_OTHER: 'entry.1607472911.other_option_response',
  RACE: 'entry.1154297245',
  NATIONALITY: 'entry.1544340458',
  PERSON_TYPE: 'entry.1313905952',
  PERSON_TYPE_OTHER: 'entry.1313905952.other_option_response',
  PROFISSAO_ATUAL: 'entry.1763452955',
  REGIME: 'entry.1050525852',
  PHONE: 'entry.415997635',
  STREET: 'entry.1154147732',
  NEIGHBORHOOD: 'entry.735041465',
  CITY: 'entry.480400201',
  STATE: 'entry.295388112',
  // Novos campos para auto-preenchimento adicional
  TIPO_IMOVEL: 'entry.2052411383',
  POSSUI_VEICULO: 'entry.985984777',
  POSSUI_FILHOS: 'entry.1108873062',
  POSSUI_FILHOS_OTHER: 'entry.1108873062.other_option_response',
  COM_QUEM_FILHOS: 'entry.1708400007',
  COM_QUEM_FILHOS_OTHER: 'entry.1708400007.other_option_response'
};

// Valores válidos (maiúsculos) para os campos com opção "OUTROS"
var ORIENTATION_OPTIONS = ['HETEROSSEXUAL','HOMOSSEXUAL','BISSEXUAL'];
var RELIGION_OPTIONS = ['NÃO'];
var PERSON_TYPE_OPTIONS = [
  'EGRESSO',
  'FAMILIAR DO EGRESSO',
  'PRE-EGRESSO',
  'FAMILIAR DE PRE-EGRESSO',
  'FAMILIAR PPL'
];
var POSSUI_FILHOS_OPTIONS = ['NÃO'];
var COM_QUEM_FILHOS_OPTIONS = ['MÃE', 'PAI', 'TIO(A)', 'AVÔ(Ó)'];

function _isOneOf(value, list) {
  if (value === undefined || value === null) return false;
  var v = value.toString().trim().toUpperCase();
  return list.indexOf(v) !== -1;
}

/**
 * Validador para orientação sexual.
 * Retorna { useOther: boolean, option: string|null, other: string|null }
 */
function validateSexualOrientation(value) {
  var v = (value || '').toString().trim();
  var up = v.toUpperCase();
  if (_isOneOf(up, ORIENTATION_OPTIONS)) return { useOther: false, option: up, other: null };
  return { useOther: true, option: '__other_option__', other: v };
}

/**
 * Validador para religião.
 * Apenas 'NÃO' é considerado opção; tudo o mais é 'OUTROS'.
 */
function validateReligion(value) {
  var v = (value || '').toString().trim();
  var up = v.toUpperCase();
  if (_isOneOf(up, RELIGION_OPTIONS)) return { useOther: false, option: up, other: null };
  return { useOther: true, option: '__other_option__', other: v };
}

/**
 * Validador para tipo de pessoa.
 */
function validatePersonType(value) {
  var v = (value || '').toString().trim();
  var up = v.toUpperCase();
  if (_isOneOf(up, PERSON_TYPE_OPTIONS)) return { useOther: false, option: up, other: null };
  return { useOther: true, option: '__other_option__', other: v };
}

/**
 * Validador para possui filhos.
 * Apenas 'NÃO' é considerado opção; tudo o mais é 'OUTROS'.
 */
function validatePossuiFilhos(value) {
  var v = (value || '').toString().trim();
  var up = v.toUpperCase();
  if (_isOneOf(up, POSSUI_FILHOS_OPTIONS)) return { useOther: false, option: up, other: null };
  return { useOther: true, option: '__other_option__', other: v };
}

/**
 * Validador para com quem os filhos residem.
 */
function validateComQuemFilhos(value) {
  var v = (value || '').toString().trim();
  var up = v.toUpperCase();
  if (_isOneOf(up, COM_QUEM_FILHOS_OPTIONS)) return { useOther: false, option: up, other: null };
  return { useOther: true, option: '__other_option__', other: v };
}

/**
 * Monta a URL de pré-preenchimento do formulário a partir do objeto `person`.
 * `person` deverá conter os campos usados no mapeamento (nome, motherName, cpf, etc.).
 */
function buildEsEncaminhamentosPrefillUrl(person) {
  var base = types.ES_ENCAMINHAMENTOS_FORM_URL || '';
  if (!base) throw new Error('ES_ENCAMINHAMENTOS_FORM_URL não configurada em types');

  // Construir endereço verificando várias chaves possíveis para compatibilidade (como SEEU faz)
  var endereco = {};
  var streetVal = person.logradouro || person.street || person.endereco || person.address || '';
  var bairroVal = person.bairro || person.neighborhood || '';
  var cityVal = person.cidade || person.city || '';
  var stateVal = person.estado || person.state || '';

  if (streetVal || bairroVal || cityVal || stateVal) {
    endereco.street = streetVal;
    endereco.neighborhood = bairroVal;
    endereco.city = cityVal;
    endereco.state = stateVal;
    Logger.log('buildEsEncaminhamentosPrefillUrl: usando endereço direto = %s', JSON.stringify(endereco));
  } else if (person.enderecos && person.enderecos.length > 0) {
    // Fallback para endereços separados (se searchComplete foi usado)
    var end = person.enderecos[0];
    endereco.street = end.logradouro || end.street || '';
    endereco.neighborhood = end.bairro || end.neighborhood || '';
    endereco.city = end.cidade || end.city || '';
    endereco.state = end.estado || end.state || '';
    Logger.log('buildEsEncaminhamentosPrefillUrl: usando person.enderecos = %s', JSON.stringify(endereco));
  }

  // Montar mapa de entryId -> valor
  var entries = {};
  function setEntry(k, v) { if (v === undefined || v === null || v === '') return; entries[k] = v; }

  // Dados pessoais básicos - ajustar nomes dos campos conforme retornado por searchComplete
  setEntry(ES_FORM_ENTRIES.NAME, person.nome || person.name);
  setEntry(ES_FORM_ENTRIES.MOTHER, person.nomeMae || person.motherName);
  setEntry(ES_FORM_ENTRIES.FATHER, person.nomePai || person.fatherName);
  
  // Data de nascimento - garantir formato correto para formulário
  var birthDate = person.dataNascimento || person.birthDate;
  if (birthDate) {
    if (birthDate instanceof Date) {
      // Formatar como YYYY-MM-DD para formulário Google
      var year = birthDate.getFullYear();
      var month = String(birthDate.getMonth() + 1).padStart(2, '0');
      var day = String(birthDate.getDate()).padStart(2, '0');
      setEntry(ES_FORM_ENTRIES.BIRTH_DATE, year + '-' + month + '-' + day);
    } else if (typeof birthDate === 'string' && birthDate.trim()) {
      setEntry(ES_FORM_ENTRIES.BIRTH_DATE, birthDate.trim());
    }
  }
  
  setEntry(ES_FORM_ENTRIES.CPF, person.cpf);
  setEntry(ES_FORM_ENTRIES.EDUCATION, person.escolaridade || person.education);
  setEntry(ES_FORM_ENTRIES.CIVIL_STATUS, person.maritalStatus);
  setEntry(ES_FORM_ENTRIES.SEX, person.sex);
  setEntry(ES_FORM_ENTRIES.GENDER_IDENTITY, person.genderIdentity);

  // Orientação sexual com validador
  var so = validateSexualOrientation(person.sexualOrientation || person.sex || '');
  setEntry(ES_FORM_ENTRIES.SEXUAL_ORIENTATION, so.option);
  if (so.useOther) setEntry(ES_FORM_ENTRIES.SEXUAL_ORIENTATION_OTHER, so.other);

  // Religião com validador
  var rel = validateReligion(person.religion || '');
  setEntry(ES_FORM_ENTRIES.RELIGION, rel.option);
  if (rel.useOther) setEntry(ES_FORM_ENTRIES.RELIGION_OTHER, rel.other);

  // Raça e nacionalidade - ajustar nomes dos campos
  setEntry(ES_FORM_ENTRIES.RACE, person.raceSelfDeclared || person.race);
  setEntry(ES_FORM_ENTRIES.NATIONALITY, person.nationality);

  // Tipo de pessoa com validador
  var pt = validatePersonType(person.personType || '');
  setEntry(ES_FORM_ENTRIES.PERSON_TYPE, pt.option);
  if (pt.useOther) setEntry(ES_FORM_ENTRIES.PERSON_TYPE_OTHER, pt.other);

  // Profissão atual
  setEntry(ES_FORM_ENTRIES.PROFISSAO_ATUAL, person.profissaoAtual || person.profissao);

  // Regime e telefone - ajustar nome do campo
  setEntry(ES_FORM_ENTRIES.REGIME, person.sentenceRegime || (person.procedimentos && person.procedimentos.length > 0 ? person.procedimentos[0].regimePena : ''));
  setEntry(ES_FORM_ENTRIES.PHONE, person.telefone || person.phone);

  // Endereço
  setEntry(ES_FORM_ENTRIES.STREET, endereco.street);
  setEntry(ES_FORM_ENTRIES.NEIGHBORHOOD, endereco.neighborhood);
  setEntry(ES_FORM_ENTRIES.CITY, endereco.city);
  setEntry(ES_FORM_ENTRIES.STATE, endereco.state);

  // Novos campos para auto-preenchimento adicional
  setEntry(ES_FORM_ENTRIES.TIPO_IMOVEL, 'PRÓPRIO');
  setEntry(ES_FORM_ENTRIES.POSSUI_VEICULO, 'SIM');
  

  // Buscar últimas respostas do formulário Google para o CPF
  var lastFormAnswers = getLastFormAnswersByCpf(person.cpf);

  // POSSUI_FILHOS
  var possuiFilhosValue = lastFormAnswers && lastFormAnswers.POSSUI_FILHOS ? lastFormAnswers.POSSUI_FILHOS : '';
  var possuiFilhosOtherValue = lastFormAnswers && lastFormAnswers.POSSUI_FILHOS_OTHER ? lastFormAnswers.POSSUI_FILHOS_OTHER : '';
  var possuiFilhos = validatePossuiFilhos(possuiFilhosValue);
  setEntry(ES_FORM_ENTRIES.POSSUI_FILHOS, possuiFilhos.option);
  if (possuiFilhos.useOther) setEntry(ES_FORM_ENTRIES.POSSUI_FILHOS_OTHER, possuiFilhosOtherValue);

  // COM_QUEM_FILHOS
  var comQuemFilhosValue = lastFormAnswers && lastFormAnswers.COM_QUEM_FILHOS ? lastFormAnswers.COM_QUEM_FILHOS : '';
  var comQuemFilhosOtherValue = lastFormAnswers && lastFormAnswers.COM_QUEM_FILHOS_OTHER ? lastFormAnswers.COM_QUEM_FILHOS_OTHER : '';
  var comQuemFilhos = validateComQuemFilhos(comQuemFilhosValue);
  setEntry(ES_FORM_ENTRIES.COM_QUEM_FILHOS, comQuemFilhos.option);
  if (comQuemFilhos.useOther) setEntry(ES_FORM_ENTRIES.COM_QUEM_FILHOS_OTHER, comQuemFilhosOtherValue);

  // Função auxiliar para buscar última resposta do formulário Google para o CPF
  function getLastFormAnswersByCpf(cpf) {
    try {
      var ss = SpreadsheetApp.openById(types.DATABASE_ID);
      var sheet = ss.getSheetByName('FORM_ES_ENCAMINHAMENTOS');
      var formResult = {};
      if (sheet) {
        var data = sheet.getDataRange().getValues();
        var cpfNorm = cpf ? cpf.toString().replace(/\D+/g, '') : '';
        var lastRow = null;
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var rowCpf = (row[getFormColIndex(ES_FORM_ENTRIES.CPF, data[0])] || '').toString().replace(/\D+/g, '');
          if (rowCpf === cpfNorm) {
            lastRow = row;
          }
        }
        if (lastRow) {
          // Buscar valores principais e outros
          // POSSUI_FILHOS
          var idxPossuiFilhos = getFormColIndex(ES_FORM_ENTRIES.POSSUI_FILHOS, data[0]);
          var idxPossuiFilhosOther = getFormColIndex(ES_FORM_ENTRIES.POSSUI_FILHOS_OTHER, data[0]);
          formResult.POSSUI_FILHOS = lastRow[idxPossuiFilhos] || '';
          formResult.POSSUI_FILHOS_OTHER = lastRow[idxPossuiFilhosOther] || '';
          // COM_QUEM_FILHOS
          var idxComQuemFilhos = getFormColIndex(ES_FORM_ENTRIES.COM_QUEM_FILHOS, data[0]);
          var idxComQuemFilhosOther = getFormColIndex(ES_FORM_ENTRIES.COM_QUEM_FILHOS_OTHER, data[0]);
          formResult.COM_QUEM_FILHOS = lastRow[idxComQuemFilhos] || '';
          formResult.COM_QUEM_FILHOS_OTHER = lastRow[idxComQuemFilhosOther] || '';
          // TIPO_IMOVEL / POSSUI_VEICULO (caso existam no formulário)
          var idxTipo = getFormColIndex(ES_FORM_ENTRIES.TIPO_IMOVEL, data[0]);
          if (idxTipo >= 0) formResult.TIPO_IMOVEL = lastRow[idxTipo] || '';
          var idxVeic = getFormColIndex(ES_FORM_ENTRIES.POSSUI_VEICULO, data[0]);
          if (idxVeic >= 0) formResult.POSSUI_VEICULO = lastRow[idxVeic] || '';
        }
      }

      // Buscar na aba SOCIOECONOMIC (database) e preferir estes valores quando presentes
      var socio = getSocioByCpf(cpf);
      var result = formResult || {};
      if (socio) {
        if (socio.tipoImovel) result.TIPO_IMOVEL = socio.tipoImovel;
        if (socio.possuiVeiculo) result.POSSUI_VEICULO = socio.possuiVeiculo;
        if (socio.possuiFilhos) result.POSSUI_FILHOS = socio.possuiFilhos;
        if (socio.comQuemFilhos) result.COM_QUEM_FILHOS = socio.comQuemFilhos;
      }
      return result;
    } catch (e) {
      Logger.log('getLastFormAnswersByCpf error: ' + e);
      return {};
    }
  }

  // Função para obter o índice da coluna pelo entryId
  function getFormColIndex(entryId, headerRow) {
    for (var i = 0; i < headerRow.length; i++) {
      if (headerRow[i] === entryId) return i;
    }
    return -1;
  }

  // Busca registro socioeconômico na aba SOCIOECONOMIC pelo CPF
  function getSocioByCpf(cpf) {
    try {
      var ss = SpreadsheetApp.openById(types.DATABASE_ID);
      var sheet = ss.getSheetByName(types.SHEET_NAMES.SOCIOECONOMIC);
      if (!sheet) return null;
      var data = sheet.getDataRange().getValues();
      var cpfNorm = cpf ? cpf.toString().replace(/\D+/g, '') : '';
      var lastRow = null;
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var rowCpf = (row[types.SOCIOECONOMIC_COL.CPF] || '').toString().replace(/\D+/g, '');
        if (rowCpf === cpfNorm) lastRow = row;
      }
      if (!lastRow) return null;
      return {
        tipoImovel: lastRow[types.SOCIOECONOMIC_COL.TIPO_IMOVEL] || '',
        possuiVeiculo: lastRow[types.SOCIOECONOMIC_COL.POSSUI_VEICULO] || '',
        possuiFilhos: lastRow[types.SOCIOECONOMIC_COL.POSSUI_FILHOS] || '',
        comQuemFilhos: lastRow[types.SOCIOECONOMIC_COL.COM_QUEM_FILHOS] || ''
      };
    } catch (e) {
      Logger.log('getSocioByCpf error: ' + e);
      return null;
    }
  }

  Logger.log('buildEsEncaminhamentosPrefillUrl: entries = %s', JSON.stringify(entries));

  // Sempre usar utils.generatePrefillUrl (assumindo que está disponível)
  if (typeof utils === 'undefined' || typeof utils.generatePrefillUrl !== 'function') {
    throw new Error('utils.generatePrefillUrl não disponível');
  }
  return utils.generatePrefillUrl(base, entries);
}

/**
 * Conveniência: busca `person` na planilha `types.DATABASE_ID` por CPF e retorna a URL pré-preenchida.
 * Usa busca manual direta na planilha para garantir que todos os campos sejam incluídos.
 * @param {string} cpfDigits - CPF com ou sem máscara.
 * @returns {Object} Objeto com url (string) ou error (string).
 */
function getPrefillUrlByCpf(cpfDigits) {
  try {
    if (!cpfDigits) throw new Error('cpfDigits é obrigatório');
    // Normalizar cpf (remover máscara)
    var cpfNorm = cpfDigits.toString().replace(/\D+/g, '');
    if (!cpfNorm) throw new Error('cpfDigits inválido');

    var ss = SpreadsheetApp.openById(types.DATABASE_ID);
    var personObj = null;

    // Busca manual na aba PERSON
    var sheet = ss.getSheetByName(types.SHEET_NAMES.PERSON);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var rowCpf = (row[types.PERSON_COL.CPF] || '').toString().replace(/\D+/g, '');
        if (rowCpf === cpfNorm) {
          personObj = {
            cpf: row[types.PERSON_COL.CPF] || '',
            nome: row[types.PERSON_COL.NAME] || '',
            nomeMae: row[types.PERSON_COL.MOTHER_NAME] || '',
            nomePai: row[types.PERSON_COL.FATHER_NAME] || '',
            dataNascimento: row[types.PERSON_COL.BIRTH_DATE] ? utils.formatDateShort(row[types.PERSON_COL.BIRTH_DATE]) : '',
            escolaridade: row[types.PERSON_COL.EDUCATION] || '',
            telefone: row[types.PERSON_COL.PHONE] || '',
            logradouro: row[types.PERSON_COL.STREET] || '',
            bairro: row[types.PERSON_COL.NEIGHBORHOOD] || '',
            cidade: row[types.PERSON_COL.CITY] || '',
            estado: row[types.PERSON_COL.STATE] || '',
            maritalStatus: row[types.PERSON_COL.MARITAL_STATUS] || '',
            sex: row[types.PERSON_COL.SEX] || '',
            genderIdentity: row[types.PERSON_COL.GENDER_IDENTITY] || '',
            sexualOrientation: row[types.PERSON_COL.SEXUAL_ORIENTATION] || '',
            religion: row[types.PERSON_COL.RELIGION] || '',
            raceSelfDeclared: row[types.PERSON_COL.RACE_SELF_DECLARED] || '',
            nationality: row[types.PERSON_COL.NATIONALITY] || '',
            personType: row[types.PERSON_COL.PERSON_TYPE] || '',
            profissaoAtual: row[types.PERSON_COL.PROFISSAO_ATUAL] || '',
            criadoPor: row[types.PERSON_COL.CREATED_BY] || '',
            criadoEm: row[types.PERSON_COL.CREATED_AT] || '',
            atualizadoPor: row[types.PERSON_COL.UPDATED_BY] || '',
            atualizadoEm: row[types.PERSON_COL.UPDATED_AT] || ''
          };

          // Adicionar endereços (do mesmo row, se houver dados)
          var enderecos = [];
          if (personObj.logradouro || personObj.bairro || personObj.cidade || personObj.estado) {
            enderecos.push({
              cpf: personObj.cpf,
              logradouro: personObj.logradouro,
              bairro: personObj.bairro,
              cidade: personObj.cidade,
              estado: personObj.estado,
              criadoPor: personObj.criadoPor,
              criadoEm: personObj.criadoEm,
              atualizadoPor: personObj.atualizadoPor,
              atualizadoEm: personObj.atualizadoEm
            });
          }
          personObj.enderecos = enderecos;

          // Adicionar procedimentos
          var procedimentos = [];
          var procSheet = ss.getSheetByName(types.SHEET_NAMES.CRIMINAL_PROCEDURE);
          if (procSheet) {
            var procData = procSheet.getDataRange().getValues();
            for (var k = 1; k < procData.length; k++) {
              var procRow = procData[k];
              var procCpf = (procRow[types.CRIMINAL_PROCEDURE_COL.CPF] || '').toString().replace(/\D+/g, '');
              if (procCpf === cpfNorm) {
                procedimentos.push({
                  cpf: procRow[types.CRIMINAL_PROCEDURE_COL.CPF] || '',
                  numeroProcesso: procRow[types.CRIMINAL_PROCEDURE_COL.PROCESS_NUMBER] || '',
                  regimePena: procRow[types.CRIMINAL_PROCEDURE_COL.SENTENCE_REGIME] || '',
                  dataProgressao: procRow[types.CRIMINAL_PROCEDURE_COL.PROGRESSION_DATE] ? utils.formatDateShort(procRow[types.CRIMINAL_PROCEDURE_COL.PROGRESSION_DATE]) : '',
                  criadoPor: procRow[types.CRIMINAL_PROCEDURE_COL.CREATED_BY] || '',
                  criadoEm: procRow[types.CRIMINAL_PROCEDURE_COL.CREATED_AT] || '',
                  atualizadoPor: procRow[types.CRIMINAL_PROCEDURE_COL.UPDATED_BY] || '',
                  atualizadoEm: procRow[types.CRIMINAL_PROCEDURE_COL.UPDATED_AT] || ''
                });
              }
            }
          }
          personObj.procedimentos = procedimentos;

          Logger.log('getPrefillUrlByCpf: personObj encontrado = %s', JSON.stringify(personObj));
          break;
        }
      }
    }

    if (!personObj) throw new Error('Pessoa não encontrada para CPF ' + cpfDigits);
    
    var url = buildEsEncaminhamentosPrefillUrl(personObj);
    Logger.log('getPrefillUrlByCpf: URL gerada = %s', url);
    return { url: url };
  } catch (e) {
    Logger.log('getPrefillUrlByCpf error: %s', e.toString());
    return { error: e.toString() };
  }
}

