/**
 * Relatório de atendimentos SEEU.
 * Conta atendimentos por dia e por atendente, preenchendo a aba REPORT.
 */

/**
 * Gera o relatório de atendimentos SEEU.
 * Busca todos os atendentes SEEU, conta atendimentos por dia/pessoa
 * e preenche a aba REPORT.
 * @param {string} [databaseSpreadsheetId] - ID da planilha do database (para buscar USER).
 * @returns {Object} Resultado com sucesso ou erro.
 */
function gerarRelatorioSeeu(databaseSpreadsheetId) {
  try {
    var databaseId = databaseSpreadsheetId || types.DATABASE_ID;
    
    // Planilha ativa (onde está FORM_SEEU e REPORT)
    var ssSeeu = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Buscar todos os usuários com função ATENDENTE SEEU (do database)
    var ssDb = SpreadsheetApp.openById(types.DATABASE_ID);
    var atendentes = utils.getUsersByFuncao(types.USER_FUNCOES.ATENDENTE_SEEU, ssDb);
    if (atendentes.error) {
      return { error: atendentes.error };
    }
    if (!atendentes || atendentes.length === 0) {
      return { error: 'Nenhum atendente SEEU encontrado.' };
    }
    
    Logger.log('Atendentes encontrados: ' + atendentes.length);
    
    // Criar mapa de email -> nome para busca rápida
    var emailToName = utils.createEmailToNameMap(atendentes);
    
    // Criar set de emails de atendentes para verificação rápida
    var atendentesEmails = {};
    for (var i = 0; i < atendentes.length; i++) {
      atendentesEmails[atendentes[i].email] = true;
    }
    
    // 2. Buscar todos os registros de FORM_SEEU (da planilha SEEU ativa)
    var formSheet = ssSeeu.getSheetByName(types.SEEU_SHEET_NAMES.FORM_SEEU);
    if (!formSheet) {
      return { error: 'Aba FORM_SEEU não encontrada na planilha ativa.' };
    }
    
    var formData = formSheet.getDataRange().getValues();
    Logger.log('Registros em FORM_SEEU: ' + (formData.length - 1));
    
    // 3. Contar atendimentos por dia e por email
    // Estrutura: { "YYYY-MM-DD": { "email@exemplo.com": count } }
    var contagem = {};
    
    var cols = types.FORM_SEEU_COL;
    for (var j = 1; j < formData.length; j++) { // Pular cabeçalho
      var row = formData[j];
      var timestamp = row[cols.TIMESTAMP];
      var email = row[cols.EMAIL];
      
      if (!timestamp || !email) continue;
      
      // Normalizar email
      var emailNorm = email.toString().toLowerCase().trim();
      
      // Verificar se é um atendente SEEU
      if (!atendentesEmails[emailNorm]) continue;
      
      // Extrair data no formato YYYY-MM-DD
      var dia = formatarDiaRelatorio(timestamp);
      if (!dia) continue;
      
      // Inicializar estrutura se necessário
      if (!contagem[dia]) {
        contagem[dia] = {};
      }
      if (!contagem[dia][emailNorm]) {
        contagem[dia][emailNorm] = 0;
      }
      
      // Incrementar contagem
      contagem[dia][emailNorm]++;
    }
    
    // 4. Preparar dados para a aba REPORT
    // Formato: [DIA, NOME, ATENDIMENTOS]
    var reportData = [];
    
    // Ordenar dias
    var dias = Object.keys(contagem).sort();
    
    for (var d = 0; d < dias.length; d++) {
      var dia = dias[d];
      var emailsNoDia = contagem[dia];
      
      // Ordenar emails por nome
      var emails = Object.keys(emailsNoDia);
      
      for (var e = 0; e < emails.length; e++) {
        var emailAtendente = emails[e];
        var qtdAtendimentos = emailsNoDia[emailAtendente];
        var nomeAtendente = emailToName[emailAtendente] || emailAtendente;
        
        reportData.push([dia, nomeAtendente, qtdAtendimentos]);
      }
    }
    
    Logger.log('Linhas para REPORT: ' + reportData.length);
    
    // 5. Preencher aba REPORT (na planilha SEEU ativa)
    var reportSheet = ssSeeu.getSheetByName('REPORT');
    if (!reportSheet) {
      // Criar aba se não existir
      reportSheet = ssSeeu.insertSheet('REPORT');
    }
    
    // Limpar aba (exceto cabeçalho)
    reportSheet.clear();
    
    // Escrever cabeçalho
    reportSheet.getRange(1, 1, 1, 3).setValues([['DIA', 'NOME', 'ATENDIMENTOS']]);
    
    // Escrever dados
    if (reportData.length > 0) {
      reportSheet.getRange(2, 1, reportData.length, 3).setValues(reportData);
    }
    
    // Formatar cabeçalho
    reportSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    
    return { 
      sucesso: true, 
      totalLinhas: reportData.length,
      totalDias: dias.length,
      totalAtendentes: atendentes.length
    };
  } catch (e) {
    Logger.log('gerarRelatorioSeeu error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Formata um timestamp para o formato de dia do relatório (YYYY-MM-DD).
 * @param {Date|string} timestamp - Data/hora do registro.
 * @returns {string} Data no formato YYYY-MM-DD.
 */
function formatarDiaRelatorio(timestamp) {
  if (!timestamp) return '';
  
  var d;
  
  if (typeof timestamp === 'object' && typeof timestamp.getTime === 'function') {
    d = timestamp;
  } else if (typeof timestamp === 'string') {
    d = new Date(timestamp);
  } else {
    return '';
  }
  
  if (isNaN(d.getTime())) return '';
  
  var ano = d.getFullYear();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  
  return ano + '-' + mes + '-' + dia;
}

/**
 * Função de teste para executar o relatório manualmente.
 */
function runGerarRelatorioSeeu() {
  var resultado = gerarRelatorioSeeu();
  Logger.log('Resultado: ' + JSON.stringify(resultado));
}

/**
 * Gera relatório de interesses em serviços (REPORT_LIFTING).
 * Conta pessoas únicas por CPF para cada tipo de interesse.
 * Coluna N de FORM_SEEU pode conter múltiplos interesses separados por vírgula.
 * 
 * Valores possíveis de interesse:
 * - Oportunidade de Trabalhar pela Nova chance
 * - Oportunidade de Terminar Estudos
 * - Oportunidade em fazer Cursos pela Nova Chance
 * 
 * @returns {Object} Resultado com sucesso ou erro.
 */
function gerarRelatorioLiftingInteresses() {
  try {
    var ssSeeu = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Buscar dados de FORM_SEEU
    var formSheet = ssSeeu.getSheetByName(types.SEEU_SHEET_NAMES.FORM_SEEU);
    if (!formSheet) {
      return { error: 'Aba FORM_SEEU não encontrada.' };
    }
    
    var formData = formSheet.getDataRange().getValues();
    Logger.log('Registros em FORM_SEEU: ' + (formData.length - 1));
    
    var cols = types.FORM_SEEU_COL;
    
    // 2. Criar mapa de interesses -> Set de CPFs únicos
    // Estrutura: { "Interesse": { "cpf1": true, "cpf2": true } }
    var interessesCpfs = {};
    
    for (var i = 1; i < formData.length; i++) { // Pular cabeçalho
      var row = formData[i];
      var cpf = row[cols.CPF];
      var interesses = row[cols.INTERESSE_EM];
      
      if (!cpf || !interesses) continue;
      
      // Normalizar CPF (remover máscara, padronizar)
      var cpfNorm = cpf.toString().replace(/\D/g, '').trim();
      
      if (!cpfNorm) continue;
      
      // Dividir interesses por vírgula (checkbox múltiplo)
      var interessesList = interesses.toString().split(',');
      
      for (var j = 0; j < interessesList.length; j++) {
        var interesse = interessesList[j].trim();
        
        if (!interesse) continue;
        
        // Inicializar objeto se não existir
        if (!interessesCpfs[interesse]) {
          interessesCpfs[interesse] = {};
        }
        
        // Adicionar CPF ao mapa (marca como true para evitar duplicatas)
        interessesCpfs[interesse][cpfNorm] = true;
      }
    }
    
    // 3. Preparar dados para REPORT_LIFTING
    // Contar CPFs únicos por interesse
    var reportData = [];
    
    for (var interesse in interessesCpfs) {
      if (interessesCpfs.hasOwnProperty(interesse)) {
        var cpfMap = interessesCpfs[interesse];
        var quantidade = Object.keys(cpfMap).length;
        
        reportData.push([interesse, quantidade]);
      }
    }
    
    // Ordenar por quantidade (descendente)
    reportData.sort(function(a, b) {
      return b[1] - a[1];
    });
    
    Logger.log('Interesses únicos encontrados: ' + reportData.length);
    
    // 4. Preencher aba REPORT_LIFTING
    var liftingSheet = ssSeeu.getSheetByName(types.SEEU_SHEET_NAMES.REPORT_LIFTING);
    if (!liftingSheet) {
      // Criar aba se não existir
      liftingSheet = ssSeeu.insertSheet(types.SEEU_SHEET_NAMES.REPORT_LIFTING);
    }
    
    // Limpar aba (exceto cabeçalho)
    liftingSheet.clear();
    
    // Escrever cabeçalho
    liftingSheet.getRange(1, 1, 1, 2).setValues([['INTERESSE EM SERVIÇOS', 'QUANTIDADES']]);
    
    // Escrever dados
    if (reportData.length > 0) {
      liftingSheet.getRange(2, 1, reportData.length, 2).setValues(reportData);
    }
    
    // Formatar cabeçalho
    liftingSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    
    // Ajustar largura das colunas
    liftingSheet.autoResizeColumns(1, 2);
    
    Logger.log('REPORT_LIFTING gerado com sucesso: ' + reportData.length + ' linhas');
    
    return {
      sucesso: true,
      totalInteresses: reportData.length,
      totalPessoasUnicas: Object.keys(interessesCpfs).reduce(function(acc, interesse) {
        var count = Object.keys(interessesCpfs[interesse]).length;
        return Math.max(acc, count);
      }, 0),
      detalhes: reportData
    };
  } catch (e) {
    Logger.log('gerarRelatorioLiftingInteresses error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Teste para executar geração de relatório de interesses.
 */
function runGerarRelatorioLiftingInteresses() {
  var resultado = gerarRelatorioLiftingInteresses();
  Logger.log('Resultado Lifting: ' + JSON.stringify(resultado, null, 2));
}

/**
 * Gatilho onSubmit para geração de relatório.
 * Deve ser configurado como trigger do formulário.
 * Atualiza as abas REPORT e REPORT_LIFTING sempre que um formulário é enviado.
 * @param {Object} e - Evento do Google Forms.
 * @returns {Object} Resultado com sucesso ou erro.
 */
function onSubmitGenerateReport(e) {
  try {
    Logger.log('onSubmitGenerateReport: evento recebido');
    
    // Verificar se o evento existe (para evitar execução acidental)
    if (!e || !e.values) {
      Logger.log('onSubmitGenerateReport: evento inválido, gerando relatório mesmo assim');
    }
    
    // 1. Gerar relatório de atendimentos
    var resultado1 = gerarRelatorioSeeu();
    
    if (resultado1.error) {
      Logger.log('onSubmitGenerateReport error (REPORT): %s', resultado1.error);
    } else {
      Logger.log('onSubmitGenerateReport success (REPORT): %s linhas, %s dias, %s atendentes', 
        resultado1.totalLinhas, resultado1.totalDias, resultado1.totalAtendentes);
    }
    
    // 2. Gerar relatório de interesses (REPORT_LIFTING)
    var resultado2 = gerarRelatorioLiftingInteresses();
    
    if (resultado2.error) {
      Logger.log('onSubmitGenerateReport error (REPORT_LIFTING): %s', resultado2.error);
    } else {
      Logger.log('onSubmitGenerateReport success (REPORT_LIFTING): %s interesses processados', 
        resultado2.totalInteresses);
    }
    
    return {
      report: resultado1,
      reportLifting: resultado2
    };
  } catch (e) {
    Logger.log('onSubmitGenerateReport error: %s', e.toString());
    return { error: e.toString() };
  }
}
