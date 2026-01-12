/**
 * ============================================================================
 * DATABASE - TEST
 * ============================================================================
 * Teste de fluxo para criar Person e CriminalProcedure.
 * Executar diretamente no Google Apps Script.
 * 
 * IMPORTANTE: Este teste deve ser executado NO PROJETO DATABASE.
 * As bibliotecas 'types' e 'utils' devem estar adicionadas ao projeto.
 * ============================================================================
 */

/**
 * Testa a criação de uma pessoa e seu procedimento criminal.
 * Executa savePerson e saveCriminalProcedure em sequência.
 */
function testCreatePersonWithCriminalProcedure() {
  // Verificar se types está disponível
  if (typeof types === 'undefined' || !types.DATABASE_ID) {
    Logger.log('ERRO: types.DATABASE_ID não está definido!');
    Logger.log('Verifique se a biblioteca "types" foi adicionada ao projeto GAS.');
    Logger.log('No editor GAS: Bibliotecas > Adicionar > Cole o ID do projeto types');
    return;
  }

  // Verificar se utils está disponível
  if (typeof utils === 'undefined' || !utils.formatCPF) {
    Logger.log('ERRO: utils não está disponível!');
    Logger.log('Verifique se a biblioteca "utils" foi adicionada ao projeto GAS.');
    return;
  }

  var databaseId = types.DATABASE_ID;
  var testEmail = Session.getActiveUser().getEmail() || 'teste@example.com';
  var testCpf = '12345678901';
  var testProcessNumber = '20000686420208110055';

  Logger.log('=== INÍCIO DO TESTE ===');
  Logger.log('Database ID: ' + databaseId);
  Logger.log('Email: ' + testEmail);
  Logger.log('CPF: ' + testCpf);
  Logger.log('Processo: ' + testProcessNumber);

  // 1. Criar/Atualizar Person
  var personData = {
    cpf: testCpf,
    name: 'PESSOA DE TESTE',
    motherName: 'MÃE DE TESTE',
    fatherName: 'PAI DE TESTE',
    birthDate: '1990-01-15',
    education: 'MÉDIO COMPLETO',
    phone: '65999999999',
    street: 'RUA DE TESTE, 123',
    neighborhood: 'BAIRRO TESTE',
    city: 'CUIABÁ',
    state: 'MT',
    createdBy: testEmail,
    updatedBy: testEmail
  };

  Logger.log('\n--- Salvando Person ---');
  Logger.log('Dados: ' + JSON.stringify(personData));

  try {
    // Chamada direta à função global (estamos no projeto database)
    var personResult = savePerson(personData, databaseId);
    Logger.log('Person salvo com sucesso: ' + JSON.stringify(personResult));
  } catch (e) {
    Logger.log('ERRO ao salvar Person: ' + e.toString());
    return;
  }

  // 2. Criar/Atualizar CriminalProcedure
  var procData = {
    cpf: testCpf,
    processNumber: testProcessNumber,
    sentenceRegime: 'ABERTO',
    progressionDate: '2026-06-01',
    createdBy: testEmail,
    updatedBy: testEmail
  };

  Logger.log('\n--- Salvando CriminalProcedure ---');
  Logger.log('Dados: ' + JSON.stringify(procData));

  try {
    // Chamada direta à função global (estamos no projeto database)
    var procResult = saveCriminalProcedure(procData, databaseId);
    Logger.log('CriminalProcedure salvo com sucesso: ' + JSON.stringify(procResult));
  } catch (e) {
    Logger.log('ERRO ao salvar CriminalProcedure: ' + e.toString());
    return;
  }

  Logger.log('\n=== TESTE CONCLUÍDO COM SUCESSO ===');
}
