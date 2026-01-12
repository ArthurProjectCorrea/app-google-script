/**
 * ============================================================================
 * UTILS - FORMAT (Biblioteca GAS)
 * ============================================================================
 * Biblioteca de funções de formatação.
 * Contém funções para formatar CPF, telefone, número de processo, texto e data.
 * 
 * IMPORTANTE: Este arquivo é uma BIBLIOTECA GAS.
 * Adicione ao projeto com identificador "utils".
 * 
 * Uso externo: utils.formatCPF(), utils.formatPhone(), etc.
 * Uso interno: formatCPF(), formatPhone(), etc.
 * ============================================================================
 */

// =============================================================================
// FORMATAÇÃO DE CPF
// =============================================================================

/**
 * Remove tudo que não for dígito e formata CPF como XXX.XXX.XXX-XX.
 * Se tiver menos de 11 dígitos, preenche com zeros à esquerda antes de formatar.
 * @param {string|number} value - CPF de entrada (pode conter pontos, traços, espaços).
 * @returns {string} CPF formatado ou string vazia se entrada inválida.
 */
function formatCPF(value) {
  if (value === null || value === undefined) return '';
  var s = value.toString().replace(/\D+/g, '');
  if (s === '') return '';
  // se houver mais de 11 dígitos, mantém os últimos 11 (possível incluir código país/zeros iniciais)
  if (s.length > 11) s = s.slice(-11);
  // se tiver menos, left-pad com zeros
  while (s.length < 11) s = '0' + s;
  return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// =============================================================================
// FORMATAÇÃO DE TELEFONE
// =============================================================================

/**
 * Formata um número de telefone brasileiro.
 * - Recupera apenas os dígitos
 * - Aceita números com 10 ou 11 dígitos (com ou sem 9 adicional)
 * - Formatos retornados:
 *   (XX) XXXX-XXXX  - para 10 dígitos
 *   (XX) 9XXXX-XXXX - para 11 dígitos
 * - Se dígitos < 10, retorna os dígitos sem formatação
 * @param {string|number} value
 * @returns {string}
 */
function formatPhone(value) {
  if (value === null || value === undefined) return '';
  var s = value.toString().replace(/\D+/g, '');
  if (s === '') return '';
  // keep only last up to 11 digits (in case country codes present)
  if (s.length > 11) s = s.slice(-11);
  if (s.length === 11) {
    return s.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (s.length === 10) {
    return s.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  // fewer than 10 digits: return raw digits
  return s;
}

// =============================================================================
// FORMATAÇÃO DE NÚMERO DE PROCESSO
// =============================================================================

/**
 * Formata número de processo para o padrão: 2000068-64.2020.8.11.0055
 * Aceita entradas com dígitos e separadores variados; retorna string formatada ou lança erro.
 * @param {string|number} input
 * @returns {string}
 */
function formatProcessNumber(input) {
  if (input === null || input === undefined) throw new Error('processNumber vazio');
  var s = input.toString().trim();
  // manter apenas dígitos
  var digits = s.replace(/\D+/g, '');
  // formato esperado tem 20 dígitos: 7-2-4-1-2-4 => total 20
  if (digits.length !== 20) throw new Error('Número de processo inválido (esperado 20 dígitos): ' + s);

  var p1 = digits.substr(0, 7);
  var p2 = digits.substr(7, 2);
  var p3 = digits.substr(9, 4);
  var p4 = digits.substr(13, 1);
  var p5 = digits.substr(14, 2);
  var p6 = digits.substr(16, 4);

  return p1 + '-' + p2 + '.' + p3 + '.' + p4 + '.' + p5 + '.' + p6;
}

// =============================================================================
// FORMATAÇÃO DE TEXTO
// =============================================================================

/**
 * Formata um texto para maiúsculas e remove espaços nas extremidades.
 * @param {string} value - Texto de entrada.
 * @returns {string} Texto formatado em MAIÚSCULAS.
 */
function formatToUpper(value) {
  if (value === null || value === undefined) return '';
  return value.toString().trim().toUpperCase();
}

/**
 * Remove acentos e caracteres especiais de um texto.
 * Útil para comparações de busca que ignoram acentuação.
 * @param {string} value - Texto de entrada.
 * @returns {string} Texto sem acentos.
 */
function removeAccents(value) {
  if (value === null || value === undefined) return '';
  return value.toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza texto para busca: remove acentos, converte para maiúsculas e remove espaços extras.
 * @param {string} value - Texto de entrada.
 * @returns {string} Texto normalizado para comparação.
 */
function normalizeForSearch(value) {
  if (value === null || value === undefined) return '';
  return removeAccents(value.toString().trim().toUpperCase());
}

/**
 * Retorna apenas os dígitos de uma entrada.
 * @param {any} value
 * @returns {string}
 */
function onlyDigits(value) {
  if (value === null || value === undefined) return '';
  return value.toString().replace(/\D+/g, '');
}

/**
 * Parse date in BR format dd/mm/yyyy or ISO string. Returns Date or original string/empty.
 * @param {string|Date} v
 * @returns {Date|string}
 */
function parseDateBR(v) {
  if (!v) return '';
  if (v instanceof Date) return v;
  var s = v.toString().trim();
  var m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  var d = new Date(s);
  return isNaN(d.getTime()) ? s : d;
}

/**
 * Verifica se um texto contém outro, ignorando acentos e case.
 * @param {string} text - Texto onde buscar.
 * @param {string} search - Texto a ser buscado.
 * @returns {boolean} True se contém, false caso contrário.
 */
function containsIgnoreAccents(text, search) {
  if (!search) return true;
  if (!text) return false;
  var normalizedText = normalizeForSearch(text);
  var normalizedSearch = normalizeForSearch(search);
  return normalizedText.indexOf(normalizedSearch) !== -1;
}

// =============================================================================
// FORMATAÇÃO DE DATA
// =============================================================================

/**
 * Formata data para o formato YYYY-MM-DD.
 * Suporta objetos Date do Google Sheets, strings e timestamps.
 * @param {Date|string|number} data - Data a ser formatada.
 * @returns {string} Data no formato YYYY-MM-DD ou string vazia se inválida.
 */
function formatDateShort(data) {
  if (!data) return '';
  
  var d;
  
  // Se for objeto com método getTime (Date do Google Sheets)
  if (typeof data === 'object' && data !== null && typeof data.getTime === 'function') {
    d = data;
  } else if (typeof data === 'number') {
    d = new Date(data);
  } else if (typeof data === 'string') {
    // Se já está no formato YYYY-MM-DD, retorna direto
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return data;
    }
    // Formato DD/MM/YYYY
    var matchDMY = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (matchDMY) {
      return matchDMY[3] + '-' + matchDMY[2] + '-' + matchDMY[1];
    }
    d = new Date(data);
  } else {
    return '';
  }
  
  if (!d || isNaN(d.getTime())) return '';
  
  var ano = d.getFullYear();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  
  return ano + '-' + mes + '-' + dia;
}
