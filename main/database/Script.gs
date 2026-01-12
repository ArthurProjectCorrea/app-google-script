/**
 * ============================================================================
 * DATABASE SCRIPT - Compartilhamento automatizado
 * ============================================================================
 * Rotinas para conceder/remover acessos ao SEEU com base na aba USER.
 * - Lê a aba USER na planilha `types.DATABASE_ID`.
 * - Usuários com `STATUS` === 'ATIVO' e que tenham a função 'ATENDENTE SEEU' recebem:
 *     - acesso de participante ao formulário (`types.SEEU_FORM_ID`) (adicionado como viewer/participante)
 *     - acesso de edição à pasta de documentos (`types.DOCUMENTOS_FOLDER_ID`) (adicionado como editor)
 * - Usuários com `STATUS` === 'INATIVO' e que tenham a função 'ATENDENTE SEEU' têm os acessos removidos.
 * - A função `syncSeeuAccesses()` percorre toda a tabela e aplica as mudanças em uma única execução.
 * ============================================================================
 */

/**
 * Sincroniza os acessos do SEEU para todos os usuários da aba USER.
 * Retorna um objeto com arrays de emails processados.
 */
function syncSeeuAccesses() {
  var ss = SpreadsheetApp.openById(types.DATABASE_ID);
  var sheet = ss.getSheetByName(types.SHEET_NAMES.USER);
  if (!sheet) throw new Error('Aba USER não encontrada.');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { processed: 0, granted: [], revoked: [], skipped: [] }; // sem dados

  var range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  var rows = range.getValues();

  var granted = [];
  var revoked = [];
  var skipped = [];
  var errors = [];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var email = row[types.USER_COL.EMAIL];
    if (!email) {
      skipped.push({ row: i + 2, reason: 'no-email' });
      continue;
    }
    email = String(email).toLowerCase().trim();

    var status = (row[types.USER_COL.STATUS] || '').toString().trim().toUpperCase();
    var funcaoRaw = (row[types.USER_COL.FUNCAO] || '').toString();

    var isAttendant = _userHasAttendantFuncao(funcaoRaw);

    if (!status) {
      skipped.push({ email: email, reason: 'no-status' });
      continue;
    }

    try {
      if (status === 'ATIVO' && isAttendant) {
        var grantRes = _grantSeeuAccessForEmail(email);
        if (grantRes && grantRes.granted) {
          granted.push(email);
        } else {
          skipped.push({ email: email, reason: grantRes && grantRes.reason ? grantRes.reason : 'grant-failed', details: grantRes && grantRes.error ? grantRes.error : null });
        }
      } else if (status === 'INATIVO' && isAttendant) {
        var revokeRes = _revokeSeeuAccessForEmail(email);
        if (revokeRes === true) {
          revoked.push(email);
        } else {
          skipped.push({ email: email, reason: revokeRes && revokeRes.reason ? revokeRes.reason : 'revoke-failed' });
        }
      } else {
        skipped.push({ email: email, status: status });
      }
    } catch (e) {
      errors.push({ email: email, error: e.toString() });
      Logger.log('Erro ao processar %s: %s', email, e.toString());
    }
  }

  return {
    processed: granted.length + revoked.length + skipped.length,
    granted: granted,
    revoked: revoked,
    skipped: skipped,
    errors: errors
  };
}

/**
 * Concede acesso ao formulário (participante/viewer) e à pasta (editor) para o email fornecido.
 * 
 * NOTA: Para formulários Google, usamos FormApp.openById() para obter o Form,
 * depois DriveApp.getFileById(form.getId()) para compartilhar via Drive.
 * Participante = Viewer (pode responder, mas não editar o formulário).
 */
function _grantSeeuAccessForEmail(email) {
  // Obtém o formulário e o arquivo Drive correspondente
  var form, formFile;
  try {
    form = FormApp.openById(types.SEEU_FORM_ID);
    formFile = DriveApp.getFileById(form.getId());
  } catch (e) {
    Logger.log('Erro ao abrir formulário para compartilhamento: %s', e.toString());
    return { granted: false, reason: 'form-open-failed', error: e.toString() };
  }

  // Verifica se o script tem permissão para alterar compartilhamento do formulário
  // Tenta adicionar como participante/publicado no Form (mais apropriado para permitir respostas)
  try {
    form.addPublishedReader(email);
    Logger.log('Formulário: adicionado como published reader (participante) para %s (Form ID: %s)', email, types.SEEU_FORM_ID);
  } catch (e) {
    Logger.log('Falha ao adicionar published reader ao formulário para %s: %s', email, e.toString());
    return { granted: false, reason: 'add-published-reader-failed', error: e.toString() };
  }

  // Pasta: checa permissão antes de compartilhar
  try {
    var folder = DriveApp.getFolderById(types.DOCUMENTOS_FOLDER_ID);
  } catch (e) {
    Logger.log('Falha ao abrir pasta para compartilhamento: %s', e.toString());
    return { granted: true, folderGranted: false, reason: 'folder-open-failed', error: e.toString() };
  }

    if (!_canShareFile(folder)) {
    Logger.log('Sem permissão para compartilhar a pasta (ID: %s). Formulário concedido.', types.DOCUMENTOS_FOLDER_ID);
    // form granted, but folder cannot be shared
    return { granted: true, folderGranted: false, reason: 'no-folder-share-permission' };
  }

  // Compartilha a pasta
  try {
    folder.addEditor(email);
    Logger.log('Pasta compartilhada como editor com %s (ID: %s)', email, types.DOCUMENTOS_FOLDER_ID);
  } catch (e) {
    Logger.log('Falha ao adicionar editor na pasta para %s: %s', email, e.toString());
    return { granted: true, folderGranted: false, reason: 'add-folder-failed', error: e.toString() };
  }

  // Não enviar e-mails de notificação por política (remoção solicitada).

  // Enviar e-mail informativo com link de acesso à "Consulta Pessoa de atendimento SEEU"
  try {
    var consultaLink = 'https://script.google.com/a/macros/funac.mt.gov.br/s/AKfycbw8JhOMGXusMFLPPVquloUEm2qkI-rqNwU3BkBR7H1TPnUOHd1zoFrcOocwJ092-bLH/exec';
    var subject = 'Acesso: Consulta Pessoa de atendimento — SEEU (FUNAC)';
    var htmlBody = '<p>Olá,</p>' +
      '<p>Seu acesso à <strong>Consulta Pessoa de atendimento (SEEU)</strong> foi configurado. ' +
      'Use o link abaixo para abrir a ferramenta:</p>' +
      '<p><a href="' + consultaLink + '">Abrir Consulta Pessoa de atendimento — SEEU</a></p>' +
      '<p>Se não conseguir acessar, verifique se está autenticado com este e-mail (' + email + ') ou contate a equipe responsável.</p>' +
      '<p>Atenciosamente,<br/>Equipe SEEU — FUNAC</p>';
    try {
      MailApp.sendEmail(email, subject, 'Abra o link: ' + consultaLink, { htmlBody: htmlBody });
      Logger.log('E-mail informativo enviado para %s', email);
    } catch (mailErr) {
      Logger.log('Falha ao enviar e-mail informativo para %s: %s', email, mailErr.toString());
    }
  } catch (e) {
    Logger.log('Erro ao preparar envio de e-mail informativo: %s', e.toString());
  }

  return { granted: true, folderGranted: true };
}

/**
 * Remove acesso ao formulário e à pasta para o email fornecido.
 */
function _revokeSeeuAccessForEmail(email) {
  // Formulário - remover viewer (participante)
  try {
    var form = FormApp.openById(types.SEEU_FORM_ID);
    var formFile = DriveApp.getFileById(form.getId());
    try { form.removePublishedReader(email); } catch (ignore) {}
    Logger.log('Permissão do formulário (published reader/participante) removida para %s', email);
  } catch (e) {
    Logger.log('Aviso: falha ao acessar formulário para remover permissão de %s: %s', email, e.toString());
  }

  // Pasta - remover editor
  try {
    var folder = DriveApp.getFolderById(types.DOCUMENTOS_FOLDER_ID);
    try { folder.removeEditor(email); } catch (ignore) {}
    Logger.log('Permissão da pasta removida para %s', email);
  } catch (e) {
    Logger.log('Aviso: falha ao acessar pasta para remover permissão de %s: %s', email, e.toString());
  }

  // Registrar e notificar o usuário por e-mail sobre remoção
  Logger.log('Acesso removido para %s (form: %s, pasta: %s)', email, types.SEEU_FORM_ID, types.DOCUMENTOS_FOLDER_ID);
  return true;
}

/**
 * Retorna true se a string de funções contém 'ATENDENTE SEEU' (comparação case-insensitive)
 */
function _userHasAttendantFuncao(funcaoRaw) {
  if (!funcaoRaw) return false;
  var parts = funcaoRaw.split(',');
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].toString().trim().toUpperCase() === types.USER_FUNCOES.ATENDENTE_SEEU) return true;
  }
  return false;
}

/**
 * Retorna true se o arquivo/pasta pode ser compartilhado pelo usuário do script.
 * Critério: o script (usuário efetivo) é o dono OU é editor E "shareable by editors".
 */
function _canShareFile(fileOrFolder) {
  try {
    var me = Session.getEffectiveUser().getEmail();
    try {
      var owner = fileOrFolder.getOwner() && fileOrFolder.getOwner().getEmail();
      if (owner === me) return true;
    } catch (e) {
      // não conseguiu obter owner — continuar
    }
    try {
      var eds = fileOrFolder.getEditors();
      for (var i = 0; i < eds.length; i++) {
        if (eds[i] && eds[i].getEmail && eds[i].getEmail() === me) {
          try { if (fileOrFolder.isShareableByEditors()) return true; } catch (e) { return false; }
        }
      }
    } catch (e) {
      // não conseguiu listar editores
      return false;
    }
  } catch (e) {
    return false;
  }
  return false;
}

/**
 * Teste rápido para executar a sincronização (rodar no editor GAS para verificar).
 */
function testSyncSeeuAccesses() {
  var res = syncSeeuAccesses();
  Logger.log(JSON.stringify(res, null, 2));
  return res;
}

/**
 * Compartilha o formulário SEEU com os e-mails listados na aba USER.
 * dryRun=true apenas simula e retorna as mudanças propostas sem aplicar.
 * Retorna um objeto { granted:[], skipped:[], errors:[] }
 */
function compartilharFormularioComEmailsFromUserSheet(dryRun) {
  dryRun = !!dryRun;
  var ss = SpreadsheetApp.openById(types.DATABASE_ID);
  var sheet = ss.getSheetByName(types.SHEET_NAMES.USER);
  if (!sheet) throw new Error('Aba USER não encontrada.');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { granted: [], skipped: [], errors: [] };

  var rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var results = { granted: [], skipped: [], errors: [] };
  var seen = {};

  // Abre o formulário
  var form;
  try {
    form = FormApp.openById(types.SEEU_FORM_ID);
  } catch (e) {
    throw new Error('Não foi possível abrir o formulário: ' + e.toString());
  }

  for (var i = 0; i < rows.length; i++) {
    var raw = rows[i][types.USER_COL.EMAIL];
    var email = raw ? String(raw).toLowerCase().trim() : '';
    var rowNum = i + 2;

    if (!email || email.indexOf('@') === -1) {
      results.skipped.push({ row: rowNum, reason: 'invalid-email' });
      continue;
    }
    if (seen[email]) { results.skipped.push({ row: rowNum, reason: 'duplicate' }); continue; }
    seen[email] = true;

    try {
      // lê o STATUS desta linha (coluna definida em types.USER_COL.STATUS)
      var status = (rows[i][types.USER_COL.STATUS] || '').toString().trim().toUpperCase();
      if (!dryRun) {
        try {
          form.addPublishedReader(email);
          Logger.log('Concedido published reader (participante) ao formulário para %s', email);
          // Enviar e-mail informativo apenas se STATUS for 'ATIVO'
          if (status === 'ATIVO') {
            try {
              var consultaLinkBulk = 'https://script.google.com/a/macros/funac.mt.gov.br/s/AKfycbw8JhOMGXusMFLPPVquloUEm2qkI-rqNwU3BkBR7H1TPnUOHd1zoFrcOocwJ092-bLH/exec';
              var subjectBulk = 'Acesso: Consulta Pessoa de atendimento — SEEU (FUNAC)';
              var htmlBodyBulk = '<p>Olá,</p>' +
                '<p>Seu acesso à <strong>Consulta Pessoa de atendimento (SEEU)</strong> foi configurado. ' +
                'Use o link abaixo para abrir a ferramenta:</p>' +
                '<p><a href="' + consultaLinkBulk + '">Abrir Consulta Pessoa de atendimento — SEEU</a></p>' +
                '<p>Se não conseguir acessar, verifique se está autenticado com este e-mail (' + email + ') ou contate a equipe responsável.</p>' +
                '<p>Atenciosamente,<br/>Equipe SEEU — FUNAC</p>';
              try { MailApp.sendEmail(email, subjectBulk, 'Abra o link: ' + consultaLinkBulk, { htmlBody: htmlBodyBulk }); Logger.log('E-mail informativo (bulk) enviado para %s', email); } catch (mailErr) { Logger.log('Falha ao enviar e-mail informativo (bulk) para %s: %s', email, mailErr.toString()); }
            } catch (e) { Logger.log('Erro ao preparar envio de e-mail informativo (bulk): %s', e.toString()); }
          } else {
            Logger.log('Linha %s: STATUS != ATIVO, e-mail informativo não enviado para %s', rowNum, email);
          }
        } catch (innerErr) {
          throw innerErr;
        }
      } else {
        Logger.log('DRY RUN: concederia published reader ao formulário para %s', email);
      }
      results.granted.push(email);
    } catch (err) {
      results.errors.push({ email: email, error: err.toString() });
      Logger.log('Erro ao conceder viewer a %s: %s', email, err.toString());
    }
  }

  return results;
}

/** Wrappers to run from menu */
function runCompartilharDryRun() { var res = compartilharFormularioComEmailsFromUserSheet(true); Logger.log(JSON.stringify(res)); return res; }
function runCompartilharApply() { var res = compartilharFormularioComEmailsFromUserSheet(false); Logger.log(JSON.stringify(res)); return res; }

/** Adiciona menu no Spreadsheet (rodar no projeto que contém a planilha) */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Compartilhamento Automático')
      .addItem('Dry run - Compartilhar formulário', 'runCompartilharDryRun')
      .addItem('Aplicar - Compartilhar formulário', 'runCompartilharApply')
      .addToUi();
  } catch (e) {
    // Não falha se executado em contexto que não suporte UI
    Logger.log('onOpen: %s', e.toString());
  }
}
