/**
 * ============================================================================
 * SEEU - TEST
 * ============================================================================
 * Testes do módulo SEEU.
 * Testa o fluxo completo: Send → File → Report.
 * 
 * IMPORTANTE: Este teste deve ser executado NO PROJETO SEEU.
 * As bibliotecas 'types', 'utils' e 'database' devem estar adicionadas.
 * 
 * Execute `runTestFullFlow()` no editor para rodar o teste completo.
 * ============================================================================
 */

// ============================================================================
// TESTE PRINCIPAL - FLUXO COMPLETO
// ============================================================================

/**
 * Testa o fluxo completo do SEEU:
 * 1. Preenche dados do formulário
 * 2. Envia para onSubmitForm (Send.gs) - salva Person e CriminalProcedure
 * 3. Gera PDF do Termo de Comparecimento (File.gs)
 * 4. Gera relatório de atendimentos (Report.gs)
 * 
 * @returns {Object} Resumo com resultados de cada etapa.
 */
function runTestFullFlow() {
  Logger.log('='.repeat(60));
  Logger.log('INICIANDO TESTE DO FLUXO COMPLETO SEEU');
  Logger.log('='.repeat(60));

  // Verificar se as bibliotecas estão disponíveis
  if (typeof types === 'undefined' || !types.SEEU_ID) {
    Logger.log('ERRO: types não está disponível!');
    Logger.log('Verifique se a biblioteca "types" foi adicionada ao projeto GAS.');
    return { error: 'Biblioteca types não encontrada' };
  }

  if (typeof utils === 'undefined' || !utils.formatCPF) {
    Logger.log('ERRO: utils não está disponível!');
    Logger.log('Verifique se a biblioteca "utils" foi adicionada ao projeto GAS.');
    return { error: 'Biblioteca utils não encontrada' };
  }

  Logger.log('Bibliotecas OK: types, utils');

  var results = {
    send: null,
    file: null,
    report: null,
    errors: []
  };

  // Dados de teste do formulário
  var sampleForm = createSampleFormData();
  Logger.log('Dados do formulário de teste: %s', JSON.stringify(sampleForm));

  // -------------------------------------------------------------------------
  // ETAPA 1: Send.gs - onSubmitForm
  // -------------------------------------------------------------------------
  Logger.log('\n--- ETAPA 1: SEND (onSubmitForm) ---');
  try {
    results.send = onSubmitForm(sampleForm);
    Logger.log('onSubmitForm resultado: %s', JSON.stringify(results.send));
    
    if (results.send.errors && results.send.errors.length > 0) {
      Logger.log('AVISO: onSubmitForm retornou erros: %s', JSON.stringify(results.send.errors));
    }
  } catch (err) {
    Logger.log('ERRO em onSubmitForm: %s', err.toString());
    results.errors.push({ step: 'send', error: err.toString() });
  }

  // -------------------------------------------------------------------------
  // ETAPA 2: File.gs - gerarTermoComparecimento
  // -------------------------------------------------------------------------
  Logger.log('\n--- ETAPA 2: FILE (gerarTermoComparecimento) ---');
  try {
    var dadosPdf = buildPdfData(sampleForm);
    Logger.log('Dados para PDF: %s', JSON.stringify(dadosPdf));
    
    results.file = gerarTermoComparecimento(dadosPdf);
    Logger.log('gerarTermoComparecimento resultado: %s', JSON.stringify(results.file));
    
    if (results.file.error) {
      Logger.log('AVISO: gerarTermoComparecimento retornou erro: %s', results.file.error);
    }
  } catch (err) {
    Logger.log('ERRO em gerarTermoComparecimento: %s', err.toString());
    results.errors.push({ step: 'file', error: err.toString() });
  }

  // -------------------------------------------------------------------------
  // ETAPA 3: Report.gs - gerarRelatorioSeeu
  // -------------------------------------------------------------------------
  Logger.log('\n--- ETAPA 3: REPORT (gerarRelatorioSeeu) ---');
  try {
    results.report = gerarRelatorioSeeu();
    Logger.log('gerarRelatorioSeeu resultado: %s', JSON.stringify(results.report));
    
    if (results.report.error) {
      Logger.log('AVISO: gerarRelatorioSeeu retornou erro: %s', results.report.error);
    }
  } catch (err) {
    Logger.log('ERRO em gerarRelatorioSeeu: %s', err.toString());
    results.errors.push({ step: 'report', error: err.toString() });
  }

  // -------------------------------------------------------------------------
  // RESUMO FINAL
  // -------------------------------------------------------------------------
  Logger.log('\n' + '='.repeat(60));
  Logger.log('RESUMO DO TESTE');
  Logger.log('='.repeat(60));
  Logger.log('Send: %s', results.send ? 'OK' : 'FALHOU');
  Logger.log('File: %s', results.file && !results.file.error ? 'OK' : 'FALHOU');
  Logger.log('Report: %s', results.report && !results.report.error ? 'OK' : 'FALHOU');
  Logger.log('Erros totais: %s', results.errors.length);
  
  if (results.errors.length > 0) {
    Logger.log('Detalhes dos erros: %s', JSON.stringify(results.errors));
  }

  return results;
}

// ============================================================================
// FUNÇÕES AUXILIARES PARA TESTES
// ============================================================================

/**
 * Cria dados de exemplo para o formulário SEEU.
 * @returns {Object} Objeto FormSeeu com dados de teste.
 */
function createSampleFormData() {
  return {
    timestamp: new Date(),
    email: 'tester@example.com',
    processNumber: '0001234-56.2025.8.26.0100',
    name: 'João Teste Silva',
    motherName: 'Maria Teste Silva',
    fatherName: 'Antônio Teste Silva',
    birthDate: new Date(1990, 0, 15),
    cpf: '12345678909',
    phone: '11999998888',
    street: 'Rua Exemplo, 100',
    regimeAtual: 'ABERTO',
    progressionDate: '01/06/2026',
    profissao: 'Pedreiro',
    interesseEm: 'Atendimento Social',
    education: 'FUNDAMENTAL INCOMPLETO',
    comprovanteResidencia: 'SIM',
    comprovanteTrabalho: 'SIM',
    primeiraAssinatura: 'SIM',
    comprovanteDispensaLegal: 'NAO',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP'
  };
}

/**
 * Monta os dados para geração do PDF a partir do formulário.
 * @param {Object} form - Dados do formulário.
 * @returns {Object} Dados formatados para gerarTermoComparecimento.
 */
function buildPdfData(form) {
  var partes = [];
  if (form.street) partes.push(form.street);
  if (form.neighborhood) partes.push(form.neighborhood);
  if (form.city) partes.push(form.city);
  if (form.state) partes.push(form.state);
  var enderecoCompleto = partes.join(', ');

  return {
    email: form.email,
    processNumber: form.processNumber,
    name: form.name,
    motherName: form.motherName,
    cpf: form.cpf,
    phone: form.phone,
    endereco: enderecoCompleto,
    comprovanteResidencia: form.comprovanteResidencia,
    comprovanteTrabalho: form.comprovanteTrabalho,
    comprovanteDispensaLegal: form.comprovanteDispensaLegal,
    primeiraAssinatura: form.primeiraAssinatura
  };
}

// ============================================================================
// TESTE COM DADOS DA PLANILHA
// ============================================================================

/**
 * Lê uma linha da planilha FORM_SEEU e executa o fluxo completo.
 * @param {number} [rowNumber] Número da linha (1-based). Se omitido, usa a última.
 * @returns {Object} Resultado do fluxo completo.
 */
function runTestFullFlowFromRow(rowNumber) {
  Logger.log('='.repeat(60));
  Logger.log('TESTE FLUXO COMPLETO A PARTIR DE LINHA DA PLANILHA');
  Logger.log('='.repeat(60));

  var form = readFormFromSheet(rowNumber);
  if (form.error) {
    Logger.log('Erro ao ler linha: %s', form.error);
    return form;
  }

  Logger.log('Dados lidos da linha %s: %s', rowNumber || 'última', JSON.stringify(form));

  var results = {
    send: null,
    file: null,
    report: null,
    errors: []
  };

  // Etapa 1: Send
  Logger.log('\n--- ETAPA 1: SEND ---');
  try {
    results.send = onSubmitForm(form);
    Logger.log('Resultado: %s', JSON.stringify(results.send));
  } catch (err) {
    Logger.log('Erro: %s', err.toString());
    results.errors.push({ step: 'send', error: err.toString() });
  }

  // Etapa 2: File
  Logger.log('\n--- ETAPA 2: FILE ---');
  try {
    var dadosPdf = buildPdfData(form);
    results.file = gerarTermoComparecimento(dadosPdf);
    Logger.log('Resultado: %s', JSON.stringify(results.file));
  } catch (err) {
    Logger.log('Erro: %s', err.toString());
    results.errors.push({ step: 'file', error: err.toString() });
  }

  // Etapa 3: Report
  Logger.log('\n--- ETAPA 3: REPORT ---');
  try {
    results.report = gerarRelatorioSeeu();
    Logger.log('Resultado: %s', JSON.stringify(results.report));
  } catch (err) {
    Logger.log('Erro: %s', err.toString());
    results.errors.push({ step: 'report', error: err.toString() });
  }

  Logger.log('\n' + '='.repeat(60));
  Logger.log('RESUMO: Send=%s, File=%s, Report=%s, Erros=%s',
    results.send ? 'OK' : 'FALHOU',
    results.file && !results.file.error ? 'OK' : 'FALHOU',
    results.report && !results.report.error ? 'OK' : 'FALHOU',
    results.errors.length
  );

  return results;
}

/**
 * Lê dados de uma linha do FORM_SEEU.
 * @param {number} [rowNumber] Número da linha (1-based). Se omitido, usa a última.
 * @returns {Object} Objeto FormSeeu ou { error: string }.
 */
function readFormFromSheet(rowNumber) {
  var sheetName = types.SEEU_SHEET_NAMES.FORM_SEEU;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    // Tentar localizar case-insensitive
    var targetUpper = sheetName.toString().toUpperCase();
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if ((sheets[i].getName() || '').toString().toUpperCase() === targetUpper) {
        sheet = sheets[i];
        break;
      }
    }
  }

  if (!sheet) {
    return { error: 'Aba não encontrada: ' + sheetName };
  }

  var row = rowNumber || sheet.getLastRow();
  if (row < 2) {
    return { error: 'Nenhuma linha de dados encontrada (linha >= 2).' };
  }

  // Ler 22 colunas (A..V)
  var values = sheet.getRange(row, 1, 1, 22).getValues()[0];
  var c = types.FORM_SEEU_COL;

  return {
    timestamp: values[c.TIMESTAMP],
    email: values[c.EMAIL],
    processNumber: values[c.PROCESS_NUMBER],
    name: values[c.NAME],
    motherName: values[c.MOTHER_NAME],
    fatherName: values[c.FATHER_NAME],
    birthDate: values[c.BIRTH_DATE],
    cpf: values[c.CPF],
    phone: values[c.PHONE],
    street: values[c.STREET],
    regimeAtual: values[c.REGIME_ATUAL],
    progressionDate: values[c.PROGRESSION_DATE],
    profissao: values[c.PROFISSAO],
    interesseEm: values[c.INTERESSE_EM],
    education: values[c.EDUCATION],
    comprovanteResidencia: values[c.COMPROVANTE_RESIDENCIA],
    comprovanteTrabalho: values[c.COMPROVANTE_TRABALHO],
    primeiraAssinatura: values[c.PRIMEIRA_ASSINATURA],
    comprovanteDispensaLegal: values[c.COMPROVANTE_DISPENSA_LEGAL],
    neighborhood: values[c.NEIGHBORHOOD],
    city: values[c.CITY],
    state: values[c.STATE]
  };
}

function testSeeuSendPartialFields() {
  // Simula um envio do SEEU com alguns campos ausentes e alguns vazios
  var form = {
    cpf: '98765432100',
    name: '',              // enviado como vazio -> deve sobrescrever
    // motherName ausente -> não deve alterar dado existente
    fatherName: 'Pai Teste',
    // birthDate ausente
    phone: '11988887777',
    street: '',            // enviado vazio
    city: 'Campinas'
    // neighborhood/state não enviados
  };

  var res = onSubmitForm(form);
  Logger.log('testSeeuSendPartialFields result: %s', JSON.stringify(res));
}

