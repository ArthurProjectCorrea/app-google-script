/**
 * ============================================================================
 * UTILS - SEARCH (Biblioteca GAS)
 * ============================================================================
 * Biblioteca de funções de busca no database.
 * Contém funções para buscar usuários, pessoas, endereços e procedimentos.
 * 
 * IMPORTANTE: Este arquivo é uma BIBLIOTECA GAS.
 * Adicione ao projeto com identificador "utils".
 * 
 * Uso externo: utils.searchPerson(), utils.getAllUsers(), etc.
 * Uso interno: searchPerson(), getAllUsers(), etc.
 * ============================================================================
 */

// =============================================================================
// BUSCA DE USUÁRIOS
// =============================================================================

/**
 * Busca todos os usuários da aba USER.
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 * @returns {Array} Array de objetos User.
 */
function getAllUsers(ss) {
  try {
    var sheet = ss.getSheetByName(types.SHEET_NAMES.USER);
    if (!sheet) throw new Error('Aba USER não encontrada.');

    var data = sheet.getDataRange().getValues();
    var users = [];

    // Pular cabeçalho (linha 1)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[types.USER_COL.EMAIL]) continue; // Pular linhas sem email
      
      users.push({
        nome: row[types.USER_COL.NOME] || '',
        email: row[types.USER_COL.EMAIL] ? row[types.USER_COL.EMAIL].toString().toLowerCase().trim() : '',
        matricula: row[types.USER_COL.MATRICULA] || '',
        funcao: row[types.USER_COL.FUNCAO] || ''
      });
    }

    return users;
  } catch (e) {
    Logger.log('getAllUsers error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Busca usuários que possuem uma determinada função.
 * A função pode estar junto com outras na mesma célula (separadas por vírgula, etc).
 * @param {string} funcao - Função a ser buscada (ex: "ATENDENTE SEEU").
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 * @returns {Array} Array de objetos User que possuem a função.
 */
function getUsersByFuncao(funcao, ss) {
  try {
    var users = getAllUsers(ss);
    if (users.error) return users;

    var funcaoUpper = funcao.toString().toUpperCase().trim();
    var resultado = [];

    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      var userFuncao = user.funcao.toString().toUpperCase();
      
      // Verificar se a função está contida (pode haver múltiplas funções separadas)
      if (userFuncao.indexOf(funcaoUpper) !== -1) {
        resultado.push(user);
      }
    }

    return resultado;
  } catch (e) {
    Logger.log('getUsersByFuncao error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Busca um usuário pelo email.
 * @param {string} email - Email do usuário.
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 * @returns {Object|null} Objeto User ou null se não encontrado.
 */
function getUserByEmail(email, ss) {
  try {
    var users = getAllUsers(ss);
    if (users.error) return null;

    var emailNorm = email.toString().toLowerCase().trim();

    for (var i = 0; i < users.length; i++) {
      if (users[i].email === emailNorm) {
        return users[i];
      }
    }

    return null;
  } catch (e) {
    Logger.log('getUserByEmail error: ' + e.toString());
    return null;
  }
}

/**
 * Cria um mapa de emails para nomes de usuários para busca rápida.
 * @param {Array} users - Array de objetos User.
 * @returns {Object} Mapa { email: nome }
 */
function createEmailToNameMap(users) {
  var map = {};
  for (var i = 0; i < users.length; i++) {
    map[users[i].email] = users[i].nome;
  }
  return map;
}

/**
 * Encontra a primeira linha onde a faixa 1..totalCols está totalmente vazia.
 * @param {Sheet} sheet
 * @param {number} totalCols
 * @param {number} [startRow]
 * @returns {number|null} linha (1-based) ou null
 */
function findFirstEmptyRow(sheet, totalCols, startRow) {
  startRow = startRow || 2;
  var lastRow = Math.max(sheet.getLastRow(), 1);
  if (lastRow < startRow) return null;
  var numRows = lastRow - startRow + 1;
  var block = sheet.getRange(startRow, 1, numRows, totalCols).getValues();
  for (var r = 0; r < block.length; r++) {
    var row = block[r];
    var allEmpty = true;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== '' && row[c] !== null) { allEmpty = false; break; }
    }
    if (allEmpty) return startRow + r;
  }
  return null;
}

/**
 * Busca a primeira linha (1-based) onde a coluna especificada contém o valor informado.
 * Retorna null se não encontrado.
 * @param {Spreadsheet} ss - Spreadsheet object
 * @param {string} sheetName
 * @param {number} columnIndex - 0-based
 * @param {any} value
 * @param {number} [startRow]
 * @returns {number|null}
 */
function findRowByColumnValue(ss, sheetName, columnIndex, value, startRow) {
  startRow = startRow || 2;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return null;
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var numRows = Math.max(0, lastRow - startRow + 1);
  if (numRows === 0) return null;
  var col = sheet.getRange(startRow, columnIndex + 1, numRows, 1).getValues();
  var targetDigits = onlyDigits(value).toString();
  var targetUpper = (value === null || value === undefined) ? '' : value.toString().trim().toUpperCase();
  for (var i = 0; i < col.length; i++) {
    var cell = col[i][0] || '';
    if (onlyDigits(cell).toString() === targetDigits && targetDigits !== '') return startRow + i;
    if (cell.toString().trim().toUpperCase() === targetUpper && targetUpper !== '') return startRow + i;
  }
  return null;
}

/**
 * Busca endereços (logradouro, bairro, cidade, estado) na aba PERSON pelo CPF.
 * Retorna um array de endereços ou { error: '...' } em caso de falha.
 * @param {Object} filtros - { cpf }
 * @param {Spreadsheet} [ss]
 * @returns {Array|Object}
 */
function searchAddress(filtros, ss) {
  try {
    filtros = filtros || {};
    var spreadsheet = ss || SpreadsheetApp.openById(types.DATABASE_ID);
    var sheet = spreadsheet.getSheetByName(types.SHEET_NAMES.PERSON);
    if (!sheet) throw new Error('Aba PERSON não encontrada.');

    var data = sheet.getDataRange().getValues();
    var results = [];
    var cpfNorm = filtros.cpf ? filtros.cpf.toString().replace(/\D+/g, '') : '';

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowCpf = (row[types.PERSON_COL.CPF] || '').toString().replace(/\D+/g, '');
      if (cpfNorm && rowCpf.indexOf(cpfNorm) === -1) continue;

      var street = row[types.PERSON_COL.STREET] || '';
      var neighborhood = row[types.PERSON_COL.NEIGHBORHOOD] || '';
      var city = row[types.PERSON_COL.CITY] || '';
      var state = row[types.PERSON_COL.STATE] || '';

      if (street || neighborhood || city || state) {
        results.push({
          cpf: row[types.PERSON_COL.CPF] || '',
          logradouro: street,
          bairro: neighborhood,
          cidade: city,
          estado: state,
          createdBy: row[types.PERSON_COL.CREATED_BY] || '',
          createdAt: row[types.PERSON_COL.CREATED_AT] || '',
          updatedBy: row[types.PERSON_COL.UPDATED_BY] || '',
          updatedAt: row[types.PERSON_COL.UPDATED_AT] || ''
        });
      }
    }

    return results;
  } catch (e) {
    Logger.log('searchAddress error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Busca o último atendimento na aba FORM_SEEU por CPF (retorna profissao e interesseEm).
 * @param {string} cpf
 * @param {Spreadsheet} [ss]
 * @returns {Object|null}
 */
function getLastSeeuAttendance(cpf, ss) {
  try {
    if (!cpf) return null;
    var cpfNorm = onlyDigits(cpf);
    var spreadsheet = ss || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(types.SEEU_SHEET_NAMES.FORM_SEEU);
    if (!sheet) return null;
    var data = sheet.getDataRange().getValues();
    var last = null;
    var lastDate = null;
    var c = types.FORM_SEEU_COL;
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowCpf = (row[c.CPF] || '').toString().replace(/\D+/g, '');
      if (rowCpf === cpfNorm) {
        var timestamp = row[c.TIMESTAMP];
        if (!lastDate || (timestamp && new Date(timestamp) > new Date(lastDate))) {
          lastDate = timestamp;
          last = {
            profissao: row[c.PROFISSAO] || '',
            interesseEm: row[c.INTERESSE_EM] || ''
          };
        }
      }
    }
    return last;
  } catch (e) {
    Logger.log('getLastSeeuAttendance error: ' + e.toString());
    return null;
  }
}

/**
 * Busca socioeconômico por CPF. Retorna o último registro (mais recente) ou null.
 * @param {string} cpf - CPF com ou sem máscara
 * @param {Spreadsheet} [ss]
 * @returns {Object|null}
 */
function getSocioByCpf(cpf, ss) {
  try {
    if (!cpf) { Logger.log('getSocioByCpf: cpf ausente'); return null; }
    var cpfNorm = cpf.toString().replace(/\D+/g, '');
    if (!cpfNorm) { Logger.log('getSocioByCpf: cpf normalizado vazio for input=%s', cpf); return null; }

    var spreadsheet = ss || SpreadsheetApp.openById(types.DATABASE_ID);
    var sheet = spreadsheet.getSheetByName(types.SHEET_NAMES.SOCIOECONOMIC);
    if (!sheet) { Logger.log('getSocioByCpf: aba SOCIOECONOMIC não encontrada'); return null; }

    var data = sheet.getDataRange().getValues();
    var lastRow = null;
    var checked = 0;
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowCpf = (row[types.SOCIOECONOMIC_COL.CPF] || '').toString().replace(/\D+/g, '');
      if (!rowCpf) continue;
      checked++;
      if (rowCpf === cpfNorm) {
        lastRow = row;
      }
    }
    Logger.log('getSocioByCpf: cpf=%s cpfNorm=%s checkedRows=%s found=%s', cpf, cpfNorm, checked, lastRow ? 'yes' : 'no');
    if (!lastRow) return null;

    return {
      cpf: lastRow[types.SOCIOECONOMIC_COL.CPF] || '',
      tipoImovel: lastRow[types.SOCIOECONOMIC_COL.TIPO_IMOVEL] || '',
      possuiVeiculo: lastRow[types.SOCIOECONOMIC_COL.POSSUI_VEICULO] || '',
      possuiFilhos: lastRow[types.SOCIOECONOMIC_COL.POSSUI_FILHOS] || '',
      comQuemFilhos: lastRow[types.SOCIOECONOMIC_COL.COM_QUEM_FILHOS] || '',
      createdBy: lastRow[types.SOCIOECONOMIC_COL.CREATED_BY] || '',
      createdAt: lastRow[types.SOCIOECONOMIC_COL.CREATED_AT] || '',
      updatedBy: lastRow[types.SOCIOECONOMIC_COL.UPDATED_BY] || '',
      updatedAt: lastRow[types.SOCIOECONOMIC_COL.UPDATED_AT] || ''
    };
  } catch (e) {
    Logger.log('getSocioByCpf error: ' + e.toString());
    return null;
  }
}

/**
 * Busca registros socioeconômicos com filtros opcionais.
 * @param {Object} filtros - { cpf, tipoImovel, possuiVeiculo, possuiFilhos }
 * @param {Spreadsheet} [ss]
 * @returns {Array} Array de registros socioeconômicos
 */
function searchSocioeconomic(filtros, ss) {
  try {
    filtros = filtros || {};
    var sheet = (ss || SpreadsheetApp.openById(types.DATABASE_ID)).getSheetByName(types.SHEET_NAMES.SOCIOECONOMIC);
    if (!sheet) throw new Error('Aba SOCIOECONOMIC não encontrada.');

    var data = sheet.getDataRange().getValues();
    var resultados = [];

    var cpfNorm = filtros.cpf ? filtros.cpf.toString().replace(/\D+/g, '') : '';
    var tipoNorm = filtros.tipoImovel ? filtros.tipoImovel.toString().trim().toUpperCase() : '';
    var veicNorm = filtros.possuiVeiculo ? filtros.possuiVeiculo.toString().trim().toUpperCase() : '';
    var filhosNorm = filtros.possuiFilhos ? filtros.possuiFilhos.toString().trim().toUpperCase() : '';

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowCpf = (row[types.SOCIOECONOMIC_COL.CPF] || '').toString().replace(/\D+/g, '');
      var rowTipo = (row[types.SOCIOECONOMIC_COL.TIPO_IMOVEL] || '').toString().trim().toUpperCase();
      var rowVeic = (row[types.SOCIOECONOMIC_COL.POSSUI_VEICULO] || '').toString().trim().toUpperCase();
      var rowFilhos = (row[types.SOCIOECONOMIC_COL.POSSUI_FILHOS] || '').toString().trim().toUpperCase();

      var cpfMatch = !cpfNorm || (rowCpf.indexOf(cpfNorm) !== -1);
      var tipoMatch = !tipoNorm || (rowTipo === tipoNorm);
      var veicMatch = !veicNorm || (rowVeic === veicNorm);
      var filhosMatch = !filhosNorm || (rowFilhos === filhosNorm);

      if (cpfMatch && tipoMatch && veicMatch && filhosMatch) {
        resultados.push({
          cpf: row[types.SOCIOECONOMIC_COL.CPF] || '',
          tipoImovel: row[types.SOCIOECONOMIC_COL.TIPO_IMOVEL] || '',
          possuiVeiculo: row[types.SOCIOECONOMIC_COL.POSSUI_VEICULO] || '',
          possuiFilhos: row[types.SOCIOECONOMIC_COL.POSSUI_FILHOS] || '',
          comQuemFilhos: row[types.SOCIOECONOMIC_COL.COM_QUEM_FILHOS] || '',
          createdBy: row[types.SOCIOECONOMIC_COL.CREATED_BY] || '',
          createdAt: row[types.SOCIOECONOMIC_COL.CREATED_AT] || '',
          updatedBy: row[types.SOCIOECONOMIC_COL.UPDATED_BY] || '',
          updatedAt: row[types.SOCIOECONOMIC_COL.UPDATED_AT] || ''
        });
      }
    }

    return resultados;
  } catch (e) {
    Logger.log('searchSocioeconomic error: ' + e.toString());
    return { error: e.toString() };
  }
}



// =============================================================================
// BUSCA DE PESSOAS
// =============================================================================

/**
 * Busca pessoas na aba PERSON com filtros por CPF, nome e nome da mãe.
 * Ignora acentos e case na comparação.
 * @param {Object} filtros - Objeto com os filtros de busca.
 * @param {string} [filtros.cpf] - Filtro por CPF (parcial ou completo).
 * @param {string} [filtros.nome] - Filtro por nome (parcial, ignora acentos).
 * @param {string} [filtros.nomeMae] - Filtro por nome da mãe (parcial, ignora acentos).
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 * @returns {Array} Array de objetos com os registros encontrados.
 */
function searchPerson(filtros, ss) {
  try {
    var sheet = ss.getSheetByName(types.SHEET_NAMES.PERSON);
    if (!sheet) throw new Error('Aba PERSON não encontrada.');

    var data = sheet.getDataRange().getValues();
    var resultados = [];

    // Normalizar filtros
    var cpfNorm = filtros.cpf ? filtros.cpf.replace(/\D+/g, '') : '';
    var nomeNorm = filtros.nome ? normalizeForSearch(filtros.nome) : '';
    var nomeMaeNorm = filtros.nomeMae ? normalizeForSearch(filtros.nomeMae) : '';

    // Iterar por linhas (começar em 1 para pular cabeçalho)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      var rowCpf = row[types.PERSON_COL.CPF] ? row[types.PERSON_COL.CPF].toString().replace(/\D+/g, '') : '';
      var rowNome = row[types.PERSON_COL.NAME] ? normalizeForSearch(row[types.PERSON_COL.NAME]) : '';
      var rowNomeMae = row[types.PERSON_COL.MOTHER_NAME] ? normalizeForSearch(row[types.PERSON_COL.MOTHER_NAME]) : '';

      // Validar filtros
      var cpfMatch = !cpfNorm || rowCpf.indexOf(cpfNorm) !== -1;
      var nomeMatch = !nomeNorm || rowNome.indexOf(nomeNorm) !== -1;
      var nomeMaeMatch = !nomeMaeNorm || rowNomeMae.indexOf(nomeMaeNorm) !== -1;

      if (cpfMatch && nomeMatch && nomeMaeMatch) {
        resultados.push({
          cpf: row[types.PERSON_COL.CPF] || '',
          nome: row[types.PERSON_COL.NAME] || '',
          nomeMae: row[types.PERSON_COL.MOTHER_NAME] || '',
          nomePai: row[types.PERSON_COL.FATHER_NAME] || '',
          dataNascimento: row[types.PERSON_COL.BIRTH_DATE] ? formatDateShort(row[types.PERSON_COL.BIRTH_DATE]) : '',
          escolaridade: row[types.PERSON_COL.EDUCATION] || '',
          telefone: row[types.PERSON_COL.PHONE] || '',
          // Endereço incorporado na mesma linha PERSON (colunas L-O)
          logradouro: row[types.PERSON_COL.STREET] || '',
          bairro: row[types.PERSON_COL.NEIGHBORHOOD] || '',
          cidade: row[types.PERSON_COL.CITY] || '',
          estado: row[types.PERSON_COL.STATE] || '',
          // Campos específicos do ES (novas colunas P-W)
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
        });
      }
    }

    return resultados;
  } catch (e) {
    Logger.log('searchPerson error: ' + e.toString());
    return { error: e.toString() };
  }
}

// =============================================================================
// BUSCA DE PROCEDIMENTOS CRIMINAIS
// =============================================================================

/**
 * Busca procedimentos criminais na aba CRIMINAL_PROCEDURE com filtros.
 * @param {Object} filtros - Objeto com os filtros de busca.
 * @param {string} [filtros.cpf] - Filtro por CPF (parcial ou completo).
 * @param {string} [filtros.processNumber] - Filtro por número do processo (parcial).
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 * @returns {Array} Array de objetos com os registros encontrados.
 */
function searchCriminalProcedure(filtros, ss) {
  try {
    var sheet = ss.getSheetByName(types.SHEET_NAMES.CRIMINAL_PROCEDURE);
    if (!sheet) throw new Error('Aba CRIMINAL_PROCEDURE não encontrada.');

    var data = sheet.getDataRange().getValues();
    var resultados = [];

    var cpfNorm = filtros.cpf ? filtros.cpf.replace(/\D+/g, '') : '';
    var procNorm = filtros.processNumber ? filtros.processNumber.toString().toUpperCase() : '';

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      
      var rowCpf = row[types.CRIMINAL_PROCEDURE_COL.CPF] ? row[types.CRIMINAL_PROCEDURE_COL.CPF].toString().replace(/\D+/g, '') : '';
      var rowProc = row[types.CRIMINAL_PROCEDURE_COL.PROCESS_NUMBER] ? row[types.CRIMINAL_PROCEDURE_COL.PROCESS_NUMBER].toString().toUpperCase() : '';

      var cpfMatch = !cpfNorm || rowCpf.indexOf(cpfNorm) !== -1;
      var procMatch = !procNorm || rowProc.indexOf(procNorm) !== -1;

      if (cpfMatch && procMatch) {
        resultados.push({
          cpf: row[types.CRIMINAL_PROCEDURE_COL.CPF] || '',
          numeroProcesso: row[types.CRIMINAL_PROCEDURE_COL.PROCESS_NUMBER] || '',
          regimePena: row[types.CRIMINAL_PROCEDURE_COL.SENTENCE_REGIME] || '',
          dataProgressao: row[types.CRIMINAL_PROCEDURE_COL.PROGRESSION_DATE] ? formatDateShort(row[types.CRIMINAL_PROCEDURE_COL.PROGRESSION_DATE]) : '',
          criadoPor: row[types.CRIMINAL_PROCEDURE_COL.CREATED_BY] || '',
          criadoEm: row[types.CRIMINAL_PROCEDURE_COL.CREATED_AT] || '',
          atualizadoPor: row[types.CRIMINAL_PROCEDURE_COL.UPDATED_BY] || '',
          atualizadoEm: row[types.CRIMINAL_PROCEDURE_COL.UPDATED_AT] || ''
        });
      }
    }

    return resultados;
  } catch (e) {
    Logger.log('searchCriminalProcedure error: ' + e.toString());
    return { error: e.toString() };
  }
}

// =============================================================================
// BUSCA COMPLETA
// =============================================================================

/**
 * Busca completa: retorna pessoa com endereço e procedimentos associados.
 * @param {Object} filtros - Objeto com os filtros de busca.
 * @param {string} [filtros.cpf] - Filtro por CPF.
 * @param {string} [filtros.nome] - Filtro por nome.
 * @param {string} [filtros.nomeMae] - Filtro por nome da mãe.
 * @param {Spreadsheet} ss - Objeto Spreadsheet já aberto.
 * @returns {Array} Array de objetos com dados completos (pessoa + endereço + procedimentos).
 */
function searchComplete(filtros, ss) {
  // Buscar pessoas
  var pessoas = searchPerson(filtros, ss);
  if (pessoas.error) return pessoas;
  
  // Para cada pessoa, buscar endereço e procedimentos
  var resultados = [];
  for (var i = 0; i < pessoas.length; i++) {
    var pessoa = pessoas[i];
    var cpfDigits = pessoa.cpf ? pessoa.cpf.replace(/\D+/g, '') : '';
    
    // Buscar endereços
    var enderecos = searchAddress({ cpf: cpfDigits }, ss);
    if (!enderecos.error) {
      pessoa.enderecos = enderecos;
    }
    
    // Buscar procedimentos
    var procedimentos = searchCriminalProcedure({ cpf: cpfDigits }, ss);
    if (!procedimentos.error) {
      pessoa.procedimentos = procedimentos;
    }
    
    resultados.push(pessoa);
  }
  
  return resultados;
}
