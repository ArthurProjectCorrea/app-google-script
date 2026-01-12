/**
 * Relatório de atendimentos SEEU.
 * Conta atendimentos por dia e por atendente, preenchendo a aba REPORT.
 */

/**
 * Gera o relatório de atendimentos para a aba de encaminhamentos usando a função genérica em utils.
 * @returns {Object} Resultado com sucesso ou erro.
 */
function gerarRelatorioSeeu() {
  try {
    var sheetName = types.ES_ENCAMINHAMENTOS_SHEET_NAME;
    var result = utils.gerarRelatorioPorAtendente(sheetName, types.ES_ENCAMINHAMENTOS_COL);
    if (result.error) return { error: result.error };

    var reportData = result.reportRows || [];
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var reportSheet = ss.getSheetByName('REPORT') || ss.insertSheet('REPORT');

    reportSheet.clear();
    reportSheet.getRange(1, 1, 1, 3).setValues([['DIA', 'NOME', 'ATENDIMENTOS']]);

    if (reportData.length > 0) {
      reportSheet.getRange(2, 1, reportData.length, 3).setValues(reportData);
    }

    reportSheet.getRange(1, 1, 1, 3).setFontWeight('bold');

    return {
      sucesso: true,
      totalLinhas: result.totalLinhas || reportData.length,
      totalDias: result.totalDias || 0,
      totalAtendentes: result.totalAtendentes || 0
    };
  } catch (e) {
    Logger.log('gerarRelatorioSeeu error: ' + e.toString());
    return { error: e.toString() };
  }
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
