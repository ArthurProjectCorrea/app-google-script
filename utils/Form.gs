/**
 * ============================================================================
 * UTILS - FORM (Biblioteca GAS)
 * ============================================================================
 * Biblioteca de funções para manipulação de formulários Google.
 * 
 * IMPORTANTE: Este arquivo é uma BIBLIOTECA GAS.
 * Adicione ao projeto com identificador "utils".
 * 
 * Uso externo: utils.generatePrefillUrl(), utils.isValidGoogleFormsUrl(), etc.
 * Uso interno: generatePrefillUrl(), isValidGoogleFormsUrl(), etc.
 * ============================================================================
 */

/**
 * Gera URL de autopreenchimento do Google Forms.
 * @param {string} baseUrl - URL base do formulário (ex: https://docs.google.com/forms/d/e/[ID]/viewform)
 * @param {Object} entries - Objeto com mapeamento { entryId: valor } para autopreenchimento
 * @returns {string} URL completa com parâmetros de autopreenchimento
 * 
 * @example
 * var url = generatePrefillUrl(
 *   'https://docs.google.com/forms/d/e/ABC123/viewform',
 *   {
 *     'entry.123': 'João Silva',
 *     'entry.456': '123.456.789-00'
 *   }
 * );
 */
function generatePrefillUrl(baseUrl, entries) {
  if (!baseUrl) {
    throw new Error('URL base do formulário não fornecida');
  }
  
  if (!entries || typeof entries !== 'object') {
    return baseUrl;
  }
  
  var params = [];
  
  for (var entryId in entries) {
    if (entries.hasOwnProperty(entryId)) {
      var value = entries[entryId];
      
      // Pular valores nulos, undefined ou strings vazias
      if (value === null || value === undefined || value === '') {
        continue;
      }
      
      // Se for array, adicionar múltiplos valores com mesmo entry (para checkboxes)
      if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
          if (value[i] !== null && value[i] !== undefined && value[i] !== '') {
            params.push(entryId + '=' + encodeURIComponent(value[i]));
          }
        }
      } else {
        // Valor único
        params.push(entryId + '=' + encodeURIComponent(value.toString()));
      }
    }
  }
  
  // Construir URL com parâmetros
  var url = baseUrl;
  if (params.length > 0) {
    // Adicionar ?usp=pp_url se a URL não tiver parâmetros ainda
    var separator = baseUrl.indexOf('?') === -1 ? '?usp=pp_url&' : '&';
    url += separator + params.join('&');
  }
  
  return url;
}

/**
 * Valida se uma URL é uma URL válida do Google Forms.
 * @param {string} url - URL a ser validada
 * @returns {boolean} True se for URL válida do Google Forms
 */
function isValidGoogleFormsUrl(url) {
  if (!url) return false;
  
  // Aceita tanto URLs completas quanto encurtadas
  return url.indexOf('docs.google.com/forms') !== -1 || 
         url.indexOf('forms.gle') !== -1;
}

/**
 * Converte URL encurtada do Google Forms para URL completa (se possível).
 * Nota: A conversão completa requer acesso ao Form ID, que não é possível apenas com a URL encurtada.
 * Esta função apenas valida e retorna a URL fornecida.
 * @param {string} shortUrl - URL encurtada (ex: https://forms.gle/ABC123)
 * @returns {string} A mesma URL (usuário deve fornecer URL completa manualmente)
 */
function expandGoogleFormsUrl(shortUrl) {
  // Não é possível expandir programaticamente sem API do Forms
  // Retornar a URL original
  return shortUrl;
}
