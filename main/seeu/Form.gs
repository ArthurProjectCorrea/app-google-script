/**
 * Testa a função de geração de URL para debug.
 * @param {string} cpf - CPF de teste.
 */
function testarGeracaoUrl(cpf) {
  var result = gerarUrlAutopreenchimento(cpf || '12345678900');
  Logger.log('Resultado do teste:');
  Logger.log(JSON.stringify(result, null, 2));
  if (result.url) {
    Logger.log('URL completa: ' + result.url);
    Logger.log('URL base: ' + types.SEEU_FORM_URL);
  }
  return result;
}

/**
 * Converte sigla de estado para nome completo.
 * Se for sigla, retorna o nome; se for nome, retorna como está.
 * @param {string} estado - Sigla ou nome do estado
 * @returns {string} Nome completo do estado
 */
function converterEstado(estado) {
  if (!estado) return '';
  
  var estNorm = estado.toString().toUpperCase().trim();
  
  // Se tem 2 caracteres, tentar como sigla
  if (estNorm.length === 2) {
    return utils.BRAZILIAN_STATES[estNorm] || estNorm;
  }
  
  // Se tem mais de 2, já é nome completo
  return estNorm;
}

/**
 * Mapeamento dos IDs dos campos do formulário Google.
 * Cada chave corresponde a um campo do database.
 */
var FORM_ENTRY_IDS = {
  numeroProcesso: 'entry.282227578',      // 0000000-00.0000.0.00.0000
  regimePena: 'entry.327146951',          // FECHADO
  nome: 'entry.589085831',                // NOME COMPLETO
  nomeMae: 'entry.2094736893',            // NOME COMPLETO DA MÃE
  nomePai: 'entry.345144533',             // NOME COMPLETO DO PAI
  dataNascimento: 'entry.291640223',      // 2026-01-09 (formato YYYY-MM-DD)
  cpf: 'entry.1899021276',                // 000.000.000-00
  telefone: 'entry.567672537',            // (65) 9 0000-0000
  logradouro: 'entry.1317263561',         // LOGRADOURO
  bairro: 'entry.763954859',              // BAIRRO
  cidade: 'entry.1324728307',             // CIDADE
  estado: 'entry.459809787',              // MINAS GERAIS
  dataProgressao: 'entry.1135606117',     // 2026-01-09 (formato YYYY-MM-DD)
  escolaridade: 'entry.1381483926',       // NÃO ESCOLARIZADO
  profissao: 'entry.1485129040',          // QUAL A PROFISSÃO ATUAL (vem do FORM_SEEU)
  interesseEm: 'entry.637547767'          // Oportunidades - checkbox múltiplo (vem do FORM_SEEU)
};

/**
 * Gera URL de autopreenchimento do formulário Google com dados do database.
 * Busca pessoa, endereço e procedimento criminal pelo CPF e monta a URL.
 * @param {string} cpf - CPF para buscar os dados (com ou sem máscara).
 * @param {string} numeroProcesso - Número do processo específico (opcional). Se não fornecido, usa o primeiro.
 * @returns {Object} Objeto com url (string) ou error (string).
 */
function gerarUrlAutopreenchimento(cpf, numeroProcesso) {
  try {
    if (!cpf) {
      return { error: 'CPF não informado.' };
    }

    // Normalizar CPF (remover máscara)
    var cpfDigits = cpf.replace(/\D+/g, '');
    
    // Buscar dados completos (pessoa + endereço + procedimentos)
    var filtros = { cpf: cpfDigits };
    var ss = SpreadsheetApp.openById(types.DATABASE_ID);
    var resultados = utils.searchComplete(filtros, ss);
    
    if (resultados.error) {
      return { error: resultados.error };
    }
    
    if (!resultados || resultados.length === 0) {
      return { error: 'Nenhum registro encontrado para o CPF informado.' };
    }
    
    // Pegar primeiro resultado
    var pessoa = resultados[0];
    // Log completo para depuração (mostra todas as chaves retornadas por searchPerson/searchComplete)
    Logger.log('gerarUrlAutopreenchimento: pessoa completa = %s', JSON.stringify(pessoa));

    // Construir endereço verificando várias chaves possíveis para compatibilidade
    var endereco = {};
    var streetVal = pessoa.logradouro || pessoa.street || pessoa.endereco || pessoa.address || '';
    var bairroVal = pessoa.bairro || pessoa.neighborhood || '';
    var cityVal = pessoa.cidade || pessoa.city || '';
    var stateVal = pessoa.estado || pessoa.state || '';

    if (streetVal || bairroVal || cityVal || stateVal) {
      endereco.logradouro = utils.formatToUpper(streetVal || '');
      endereco.bairro = utils.formatToUpper(bairroVal || '');
      endereco.cidade = utils.formatToUpper(cityVal || '');
      endereco.estado = stateVal || '';
      Logger.log('gerarUrlAutopreenchimento: usando endereço detectado = %s', JSON.stringify(endereco));
    } else {
      // fallback para pessoa.enderecos (compatibilidade retroativa)
      var fallback = pessoa.enderecos && pessoa.enderecos.length > 0 ? pessoa.enderecos[0] : {};
      endereco.logradouro = utils.formatToUpper(fallback.logradouro || fallback.street || '');
      endereco.bairro = utils.formatToUpper(fallback.bairro || fallback.neighborhood || '');
      endereco.cidade = utils.formatToUpper(fallback.cidade || fallback.city || '');
      endereco.estado = fallback.estado || fallback.state || '';
      Logger.log('gerarUrlAutopreenchimento: usando pessoa.enderecos fallback = %s', JSON.stringify(endereco));
    }
    
    // Se numeroProcesso foi fornecido, buscar o procedimento específico
    var procedimento = {};
    if (numeroProcesso && pessoa.procedimentos && pessoa.procedimentos.length > 0) {
      // Normalizar número do processo para comparação (remover formatação)
      var processoDigits = numeroProcesso.replace(/\D+/g, '');
      
      // Buscar procedimento com número correspondente
      for (var i = 0; i < pessoa.procedimentos.length; i++) {
        var proc = pessoa.procedimentos[i];
        var procDigits = proc.numeroProcesso ? proc.numeroProcesso.replace(/\D+/g, '') : '';
        if (procDigits === processoDigits) {
          procedimento = proc;
          break;
        }
      }
      
      // Se não encontrou, usar o primeiro
      if (!procedimento.numeroProcesso) {
        procedimento = pessoa.procedimentos[0];
      }
    } else if (pessoa.procedimentos && pessoa.procedimentos.length > 0) {
      // Se não foi especificado número, usar o primeiro
      procedimento = pessoa.procedimentos[0];
    }
    
    // Preparar objeto de entries para autopreenchimento
    var entries = {};
    
    // Dados da pessoa
    if (pessoa.cpf) {
      entries[FORM_ENTRY_IDS.cpf] = utils.formatCPF(pessoa.cpf);
    }
    if (pessoa.nome) {
      entries[FORM_ENTRY_IDS.nome] = pessoa.nome;
    }
    if (pessoa.nomeMae) {
      entries[FORM_ENTRY_IDS.nomeMae] = pessoa.nomeMae;
    }
    if (pessoa.nomePai) {
      entries[FORM_ENTRY_IDS.nomePai] = pessoa.nomePai;
    }
    if (pessoa.dataNascimento) {
      entries[FORM_ENTRY_IDS.dataNascimento] = pessoa.dataNascimento;
    }
    if (pessoa.telefone) {
      entries[FORM_ENTRY_IDS.telefone] = pessoa.telefone;
    }
    if (pessoa.escolaridade) {
      entries[FORM_ENTRY_IDS.escolaridade] = pessoa.escolaridade;
    }
    
    // Dados do endereço
    if (endereco.logradouro) {
      entries[FORM_ENTRY_IDS.logradouro] = endereco.logradouro;
      Logger.log('gerarUrlAutopreenchimento: logradouro = %s', endereco.logradouro);
    }
    if (endereco.bairro) {
      entries[FORM_ENTRY_IDS.bairro] = endereco.bairro;
      Logger.log('gerarUrlAutopreenchimento: bairro = %s', endereco.bairro);
    }
    if (endereco.cidade) {
      entries[FORM_ENTRY_IDS.cidade] = endereco.cidade;
      Logger.log('gerarUrlAutopreenchimento: cidade = %s', endereco.cidade);
    }
    if (endereco.estado) {
      // converterEstado já aceita sigla ou nome; garantir formato aceito pelo Form
      entries[FORM_ENTRY_IDS.estado] = converterEstado(endereco.estado);
      Logger.log('gerarUrlAutopreenchimento: estado = %s -> %s', endereco.estado, converterEstado(endereco.estado));
    }
    
    // Dados do procedimento criminal
    if (procedimento.numeroProcesso) {
      entries[FORM_ENTRY_IDS.numeroProcesso] = procedimento.numeroProcesso;
    }
    if (procedimento.regimePena) {
      entries[FORM_ENTRY_IDS.regimePena] = procedimento.regimePena;
    }
    if (procedimento.dataProgressao) {
      entries[FORM_ENTRY_IDS.dataProgressao] = procedimento.dataProgressao;
    }
    
    // Profissão atual - agora pega de person.profissaoAtual
    if (pessoa.profissaoAtual) {
      entries[FORM_ENTRY_IDS.profissao] = pessoa.profissaoAtual;
    }
    
    // Dados do último atendimento (FORM_SEEU) - interesseEm ainda vem de lá
    var ultimoAtendimento = utils.getLastSeeuAttendance(cpfDigits);
    if (ultimoAtendimento) {
      if (ultimoAtendimento.interesseEm) {
        // interesseEm pode ter múltiplos valores separados por vírgula
        var interesses = ultimoAtendimento.interesseEm.toString().split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s !== ''; });
        if (interesses.length > 0) {
          entries[FORM_ENTRY_IDS.interesseEm] = interesses;
        }
      }
    }
    
    // Obter URL base
    var baseUrl = types.SEEU_FORM_URL;
    
    // Validar se a URL base foi obtida
    if (!baseUrl) {
      Logger.log('gerarUrlAutopreenchimento error: URL base do formulário não encontrada');
      return { error: 'URL do formulário não configurada. Verifique types.SEEU_FORM_URL' };
    }
    
    // Gerar URL com autopreenchimento usando utils
    var url = utils.generatePrefillUrl(baseUrl, entries);
    
    Logger.log('gerarUrlAutopreenchimento: entries = %s', JSON.stringify(entries));
    Logger.log('gerarUrlAutopreenchimento: url = %s', url);
    return { url: url };
  } catch (e) {
    Logger.log('gerarUrlAutopreenchimento error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Formata CPF com máscara XXX.XXX.XXX-XX
 * @param {string} cpf - CPF com ou sem máscara.
 * @returns {string} CPF formatado.
 */
// usar Utils.getLastSeeuAttendance e Utils.formatCPF