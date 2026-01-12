/**
 * ============================================================================
 * UTILS - FILE (Biblioteca GAS)
 * ============================================================================
 * Utilitário para geração de PDFs a partir de modelos Google Docs.
 * 
 * IMPORTANTE: Este arquivo é uma BIBLIOTECA GAS.
 * Adicione ao projeto com identificador "utils".
 * 
 * Uso externo: utils.gerarPdf(), utils.substituirPlaceholders(), etc.
 * Uso interno: gerarPdf(), substituirPlaceholders(), etc.
 * ============================================================================
 */

/**
 * Gera um PDF a partir de um modelo Google Docs.
 * @param {Object} config - Configuração para geração do PDF.
 * @param {string} config.modeloId - ID do documento Google Docs modelo.
 * @param {string} config.pastaDestinoId - ID da pasta no Google Drive para salvar o PDF.
 * @param {string} config.nomeModelo - Nome do tipo de documento (ex: "DECLARAÇÃO DE AUTÔNOMO").
 * @param {string} config.nomePessoa - Nome da pessoa para compor o nome do arquivo.
 * @param {Object} config.dados - Objeto com placeholders e seus valores { "{{PLACEHOLDER}}": "valor" }.
 * @returns {Object} Objeto com url do PDF ou error.
 */
function gerarPdf(config) {
  try {
    // Validar parâmetros obrigatórios
    if (!config.modeloId) {
      return { error: 'ID do modelo não informado.' };
    }
    if (!config.pastaDestinoId) {
      return { error: 'ID da pasta destino não informado.' };
    }
    if (!config.nomeModelo) {
      return { error: 'Nome do modelo não informado.' };
    }
    if (!config.nomePessoa) {
      return { error: 'Nome da pessoa não informado.' };
    }
    
    var modeloId = config.modeloId;
    var pastaDestinoId = config.pastaDestinoId;
    var nomeModelo = config.nomeModelo;
    var nomePessoa = config.nomePessoa;
    var dados = config.dados || {};
    
    Logger.log('[PDF] Gerando PDF: ' + nomeModelo + ' para ' + nomePessoa);
    
    // Obter pasta destino (defensivo: validar ID e tratar exceções de DriveApp)
    try {
      if (pastaDestinoId === null || pastaDestinoId === undefined || pastaDestinoId === '') {
        throw new Error('ID da pasta destino vazio');
      }
      if (typeof pastaDestinoId !== 'string') {
        pastaDestinoId = String(pastaDestinoId);
      }
      var folder = DriveApp.getFolderById(pastaDestinoId);
    } catch (e) {
      Logger.log('[PDF] Falha ao obter pasta destino (id=%s): %s', pastaDestinoId, e.toString());
      return { error: 'Falha ao acessar a pasta destino: ' + e.toString() };
    }
    
    // Criar cópia temporária do modelo
    var nomeTemp = 'TEMP_' + nomeModelo.replace(/\s+/g, '_') + '_' + nomePessoa + '_' + new Date().getTime();
    var docTemp = DriveApp.getFileById(modeloId).makeCopy(nomeTemp, folder);
    var doc = DocumentApp.openById(docTemp.getId());
    
    // Substituir placeholders no documento
    substituirPlaceholders(doc, dados);
    
    // Salvar e fechar documento
    doc.saveAndClose();
    
    // Gerar PDF
    var pdfBlob = DriveApp.getFileById(docTemp.getId()).getAs('application/pdf');
    var timestamp = formatarTimestampPdf();
    var pdfNome = nomePessoa + ' - ' + nomeModelo + ' - ' + timestamp + '.pdf';
    var pdfFile = folder.createFile(pdfBlob).setName(pdfNome);
    
    // Remover documento temporário
    DriveApp.getFileById(docTemp.getId()).setTrashed(true);
    
    Logger.log('[PDF] PDF gerado com sucesso: ' + pdfFile.getUrl());
    
    return {
      url: pdfFile.getUrl(),
      id: pdfFile.getId(),
      nome: pdfNome
    };
  } catch (e) {
    Logger.log('[PDF] Erro ao gerar PDF: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Substitui todos os placeholders em um documento Google Docs.
 * @param {GoogleAppsScript.Document.Document} doc - Documento aberto.
 * @param {Object} dados - Objeto com placeholders e seus valores.
 */
function substituirPlaceholders(doc, dados) {
  var body = doc.getBody();
  var header = doc.getHeader();
  var footer = doc.getFooter();
  
  for (var placeholder in dados) {
    if (dados.hasOwnProperty(placeholder)) {
      var valor = dados[placeholder] || '';
      
      // Substituir no corpo
      body.replaceText(placeholder, valor);
      
      // Substituir no cabeçalho (se existir)
      if (header) {
        header.replaceText(placeholder, valor);
      }
      
      // Substituir no rodapé (se existir)
      if (footer) {
        footer.replaceText(placeholder, valor);
      }
    }
  }
}

/**
 * Formata timestamp para nome de arquivo.
 * @returns {string} Timestamp no formato YYYYMMDD_HHmmss.
 */
function formatarTimestampPdf() {
  var agora = new Date();
  var ano = agora.getFullYear();
  var mes = String(agora.getMonth() + 1).padStart(2, '0');
  var dia = String(agora.getDate()).padStart(2, '0');
  var hora = String(agora.getHours()).padStart(2, '0');
  var minuto = String(agora.getMinutes()).padStart(2, '0');
  var segundo = String(agora.getSeconds()).padStart(2, '0');
  
  return ano + mes + dia + '_' + hora + minuto + segundo;
}

/**
 * Retorna o nome do mês por extenso.
 * @param {number} mesIndex - Índice do mês (0-11).
 * @returns {string} Nome do mês.
 */
function getMesPorExtensoUtil(mesIndex) {
  var meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  return meses[mesIndex] || '';
}

/**
 * Formata data no formato DD/MM/YYYY.
 * @param {Date|string} data - Data a ser formatada.
 * @returns {string} Data formatada.
 */
function formatarDataPdf(data) {
  if (!data) return '';
  
  var d;
  if (typeof data === 'object' && typeof data.getTime === 'function') {
    d = data;
  } else {
    d = new Date(data);
  }
  
  if (isNaN(d.getTime())) return '';
  
  var dia = String(d.getDate()).padStart(2, '0');
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var ano = d.getFullYear();
  
  return dia + '/' + mes + '/' + ano;
}

/**
 * Formata valor monetário para exibição.
 * @param {number|string} valor - Valor numérico.
 * @returns {string} Valor formatado (ex: "R$ 1.234,56").
 */
function formatarMoedaPdf(valor) {
  if (!valor && valor !== 0) return '';
  
  var numero = parseFloat(valor);
  if (isNaN(numero)) return '';
  
  return 'R$ ' + numero.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formata endereço completo a partir de componentes.
 * @param {string} logradouro - Logradouro.
 * @param {string} numero - Número.
 * @param {string} complemento - Complemento.
 * @param {string} bairro - Bairro.
 * @param {string} cidadeEstado - Cidade/Estado.
 * @returns {string} Endereço formatado.
 */
function formatarEnderecoPdf(logradouro, numero, complemento, bairro, cidadeEstado) {
  var partes = [];
  
  if (logradouro) {
    var endComNumero = logradouro;
    if (numero) endComNumero += ', ' + numero;
    if (complemento) endComNumero += ' - ' + complemento;
    partes.push(endComNumero);
  }
  
  if (bairro) partes.push(bairro);
  if (cidadeEstado) partes.push(cidadeEstado);
  
  return partes.join(', ');
}
