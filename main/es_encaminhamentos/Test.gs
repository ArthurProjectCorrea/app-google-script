function testEsEncaminhamentosSendFull() {
  // Simula uma linha completa do formulário ES (colunas A..AE)
  var row = [];
  row[0] = new Date(); // timestamp
  row[1] = 'es-sender@example.com';
  row[2] = 'ATENDIMENTO';
  row[3] = 'Maria Teste'; // NAME
  row[4] = 'Mãe Teste';
  row[5] = 'Pai Teste';
  row[6] = '1992-05-10';
  row[7] = '98765432100'; // CPF
  row[8] = 'ENSINO MEDIO';
  row[9] = 'CASADA';
  row[10] = 'F';
  row[11] = 'Mulher Trans';
  row[12] = 'Hetero';
  row[13] = 'Católica';
  row[14] = 'Parda';
  row[15] = 'Brasileira';
  row[16] = 'PRONTO-SOCORRO';
  row[17] = 'ABERTO'; // CURRENT_REGIME
  row[18] = '11977776666';
  row[19] = 'Rua Teste, 200';
  row[20] = 'Bairro Teste';
  row[21] = 'Curitiba';
  row[22] = 'PR';
  // demais campos opcionais preenchidos com exemplos
  row[23] = 'ALUGADO';
  row[24] = 'SIM';
  row[25] = 'NAO';
  row[26] = '';
  row[27] = 'Encaminhamento X';
  row[28] = 'Pedreiro';
  row[29] = '2024-01-01';
  row[30] = '1200';

  var person = mapEsRowToPerson(row);
  var res;
  var db = (typeof database !== 'undefined') ? database : null;
  if (db && typeof db.savePerson === 'function') {
    res = db.savePerson(person, types.DATABASE_ID);
  } else if (typeof savePerson === 'function') {
    res = savePerson(person, types.DATABASE_ID);
  } else {
    throw new Error('savePerson não disponível');
  }
  Logger.log('testEsEncaminhamentosSendFull person: %s', JSON.stringify(person));
  Logger.log('testEsEncaminhamentosSendFull result: %s', JSON.stringify(res));
}

/**
 * Testa o onSubmitGeneratePdfEs simulando um evento de formulário.
 * Simula envio para "DECLARAÇÃO DE RESIDÊNCIA".
 */
function testOnSubmitGeneratePdfEsResidencia() {
  // Simular evento do formulário
  var mockEvent = {
    values: [
      new Date().toISOString(), // timestamp
      'test@example.com', // email
      'ATENDIMENTO', // type
      'João Silva', // name
      '12345678900', // cpf
      'Rua A, 123', // street
      'Centro', // neighborhood
      'São Paulo', // city
      'SP', // state
      '11999999999', // phone
      'DECLARAÇÃO DE RESIDÊNCIA' // encaminhamentos
    ]
  };

  var result = onSubmitGeneratePdfEs(mockEvent);
  Logger.log('testOnSubmitGeneratePdfEsResidencia result: %s', JSON.stringify(result));
}

/**
 * Testa o onSubmitGeneratePdfEs simulando um evento de formulário.
 * Simula envio para "DECLARAÇÃO DE AUTÔNOMO".
 */
function testOnSubmitGeneratePdfEsAutonomo() {
  // Simular evento do formulário
  var mockEvent = {
    values: [
      new Date().toISOString(), // timestamp
      'test@example.com', // email
      'ATENDIMENTO', // type
      'Maria Santos', // name
      '98765432100', // cpf
      'Av B, 456', // street
      'Jardim', // neighborhood
      'Rio de Janeiro', // city
      'RJ', // state
      '21988888888', // phone
      'DECLARAÇÃO DE AUTÔNOMO', // encaminhamentos
      'Pedreiro', // currentProfession
      '2023-06-01', // startDate
      '1500' // monthlyIncome
    ]
  };

  var result = onSubmitGeneratePdfEs(mockEvent);
  Logger.log('testOnSubmitGeneratePdfEsAutonomo result: %s', JSON.stringify(result));
}

/**
 * Testa a geração de URL de pré-preenchimento para ES.
 */
function testGetPrefillUrlByCpf() {
  try {
    // CPF de teste (usar um CPF que existe na base)
    var cpf = '12345678900'; // Ajuste para um CPF real da base
    
    var result = getPrefillUrlByCpf(cpf);
    
    Logger.log('testGetPrefillUrlByCpf result: %s', JSON.stringify(result));
    
    if (result.url) {
      Logger.log('URL gerada com sucesso: ' + result.url);
      // Verificar se a URL contém os parâmetros esperados
      var expectedEntries = [
        'entry.11265846', // NAME
        'entry.1375638929', // MOTHER
        'entry.1705452342', // FATHER
        'entry.976579838', // BIRTH_DATE
        'entry.1735295425', // CPF
        'entry.170081653', // EDUCATION
        'entry.643848658', // CIVIL_STATUS
        'entry.41778644', // SEX
        'entry.987955348', // GENDER_IDENTITY
        'entry.635184628', // SEXUAL_ORIENTATION
        'entry.1607472911', // RELIGION
        'entry.1154297245', // RACE
        'entry.1544340458', // NATIONALITY
        'entry.1313905952', // PERSON_TYPE
        'entry.1050525852', // REGIME
        'entry.415997635', // PHONE
        'entry.1154147732', // STREET
        'entry.735041465', // NEIGHBORHOOD
        'entry.480400201', // CITY
        'entry.295388112' // STATE
      ];
      
      var missingEntries = [];
      expectedEntries.forEach(function(entry) {
        if (result.url.indexOf(entry) === -1) {
          missingEntries.push(entry);
        }
      });
      
      if (missingEntries.length > 0) {
        Logger.log('AVISO: Entries faltando na URL: ' + missingEntries.join(', '));
      } else {
        Logger.log('SUCESSO: Todos os entries esperados estão na URL');
      }
    } else if (result.error) {
      Logger.log('Erro na geração: ' + result.error);
    }
    
    return result;
  } catch (e) {
    Logger.log('testGetPrefillUrlByCpf error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Testa a construção da URL com dados mockados.
 */
function testBuildEsEncaminhamentosPrefillUrl() {
  try {
    var mockPerson = {
      name: 'João Silva',
      motherName: 'Maria Silva',
      fatherName: 'José Silva',
      birthDate: '1990-01-15',
      cpf: '12345678900',
      education: 'ENSINO MÉDIO COMPLETO',
      maritalStatus: 'CASADO',
      sex: 'M',
      genderIdentity: 'HOMEM CIS',
      sexualOrientation: 'HETEROSSEXUAL',
      religion: 'CATÓLICA',
      raceSelfDeclared: 'BRANCA',
      nationality: 'BRASILEIRA',
      personType: 'EGRESSO',
      sentenceRegime: 'ABERTO',
      phone: '11999999999',
      street: 'Rua A, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP'
    };
    
    var url = buildEsEncaminhamentosPrefillUrl(mockPerson);
    Logger.log('testBuildEsEncaminhamentosPrefillUrl URL: ' + url);
    
    // Verificar se contém os campos esperados
    var expectedFields = ['entry.11265846', 'entry.1735295425', 'entry.41778644']; // NAME, CPF, SEX
    var hasFields = expectedFields.every(function(field) {
      return url.indexOf(field) !== -1;
    });
    
    Logger.log('URL contém campos esperados: ' + hasFields);
    
    return { url: url, hasExpectedFields: hasFields };
  } catch (e) {
    Logger.log('testBuildEsEncaminhamentosPrefillUrl error: ' + e.toString());
    return { error: e.toString() };
  }
}
