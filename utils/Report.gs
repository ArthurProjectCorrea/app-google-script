/**
 * Utils: Relatórios
 * Função principal: gerarRelatorioPorAtendente
 * Conta atendimentos por dia e por atendente a partir de uma aba de formulário.
 * @param {string} sheetName - Nome da aba onde estão os registros (na planilha ativa).
 * @param {Object} [cols] - (Opcional) objeto de colunas com propriedades TIMESTAMP e EMAIL (índices 0-based). Se ausente, tentamos inferir por nome da aba.
 * @returns {Object} { sucesso: true, reportRows: [[DIA, NOME, ATENDIMENTOS], ...], totalLinhas, totalDias, totalAtendentes } ou { error }
 */
function gerarRelatorioPorAtendente(sheetName, cols) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { error: 'Aba ' + sheetName + ' não encontrada na planilha ativa.' };

    var data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) return { sucesso: true, reportRows: [], totalLinhas: 0, totalDias: 0, totalAtendentes: 0 };

    // Determinar colunas (TIMESTAMP e EMAIL)
    var colsObj = cols || null;
    if (!colsObj) {
      if (sheetName === types.ES_ENCAMINHAMENTOS_SHEET_NAME) colsObj = types.ES_ENCAMINHAMENTOS_COL;
      else if (sheetName === types.SEEU_SHEET_NAMES.FORM_SEEU) colsObj = types.FORM_SEEU_COL;
    }

    if (!colsObj || typeof colsObj.TIMESTAMP === 'undefined' || typeof colsObj.EMAIL === 'undefined') {
      return { error: 'Não foi possível determinar as colunas TIMESTAMP/EMAIL para a aba ' + sheetName + '. Passe um objeto cols como segundo parâmetro.' };
    }

    // Buscar todos os usuários no database (sem filtro por função)
    var ssDb = SpreadsheetApp.openById(types.DATABASE_ID);
    var users = getAllUsers(ssDb);
    if (users.error) return { error: users.error };
    if (!users || users.length === 0) return { error: 'Nenhum usuário encontrado no database.' };

    var emailToName = createEmailToNameMap(users);
    var userEmails = {};
    for (var u = 0; u < users.length; u++) {
      userEmails[users[u].email] = true;
    }

    // Contagem por dia e por email
    var contagem = {};
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var timestamp = row[colsObj.TIMESTAMP];
      var email = row[colsObj.EMAIL];

      if (!timestamp || !email) continue;

      var emailNorm = email.toString().toLowerCase().trim();
      if (!userEmails[emailNorm]) continue; // Contabilizar apenas se for usuário do database

      var dia = formatDayForReport(timestamp);
      if (!dia) continue;

      contagem[dia] = contagem[dia] || {};
      contagem[dia][emailNorm] = (contagem[dia][emailNorm] || 0) + 1;
    }

    // Preparar linhas do relatório
    var dias = Object.keys(contagem).sort();
    var reportRows = [];

    for (var d = 0; d < dias.length; d++) {
      var dia = dias[d];
      var emailsNoDia = contagem[dia];
      var emails = Object.keys(emailsNoDia).sort(function(a, b) {
        var na = (emailToName[a] || a).toString().toLowerCase();
        var nb = (emailToName[b] || b).toString().toLowerCase();
        return na < nb ? -1 : (na > nb ? 1 : 0);
      });

      for (var e = 0; e < emails.length; e++) {
        var emailAtendente = emails[e];
        var qtdAtendimentos = emailsNoDia[emailAtendente];
        var nomeAtendente = emailToName[emailAtendente] || emailAtendente;
        reportRows.push([dia, nomeAtendente, qtdAtendimentos]);
      }
    }

    return {
      sucesso: true,
      reportRows: reportRows,
      totalLinhas: reportRows.length,
      totalDias: dias.length,
      totalAtendentes: users.length
    };
  } catch (e) {
    Logger.log('gerarRelatorioPorAtendente error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Formata timestamp para dia no formato DD/MM/YYYY (usado internamente pelo utils)
 */
function formatDayForReport(timestamp) {
  if (!timestamp) return '';
  var d;
  if (typeof timestamp === 'object' && typeof timestamp.getTime === 'function') d = timestamp;
  else if (typeof timestamp === 'string') d = new Date(timestamp);
  else return '';
  if (isNaN(d.getTime())) return '';
  var ano = d.getFullYear();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return dia + '/' + mes + '/' + ano;
}