/**
 * Geração de arquivos PDF para o SEEU.
 * Utiliza o utilitário utils.gerarPdf para criar PDFs a partir de modelos.
 */

/**
 * IDs dos modelos de documentos.
 */
// Usar constantes de Types.SEEU_* para modelos e pastas

/**
 * Gera PDF de Termo de Comparecimento.
 * Usa os mesmos placeholders do modelo original.
 * @param {Object} dados - Dados para preencher o documento.
 * @param {string} dados.email - Email do atendente (para buscar nome/matrícula/pasta).
 * @param {string} dados.processNumber - Número do processo.
 * @param {string} dados.name - Nome completo da pessoa.
 * @param {string} dados.motherName - Nome da mãe.
 * @param {string} dados.cpf - CPF da pessoa.
 * @param {string} dados.phone - Telefone.
 * @param {string} dados.endereco - Endereço completo.
 * @param {string} dados.comprovanteResidencia - Comprovante de residência.
 * @param {string} dados.comprovanteTrabalho - Comprovante de trabalho.
 * @param {string} dados.comprovanteDispensaLegal - Comprovante de dispensa legal.
 * @param {string} dados.primeiraAssinatura - Primeira assinatura (SIM/NÃO).
 * @returns {Object} Objeto com url do PDF ou error.
 */
function gerarTermoComparecimento(dados) {
  try {
    if (!dados || !dados.name) {
      return { error: 'Dados obrigatórios não informados.' };
    }
    
    // Formatar dados antes de usar
    var dadosFormatados = {
      email: dados.email,
      processNumber: utils.formatProcessNumber(dados.processNumber),
      name: utils.formatToUpper(dados.name),
      motherName: utils.formatToUpper(dados.motherName),
      cpf: utils.formatCPF(dados.cpf),
      phone: utils.formatPhone(dados.phone),
      endereco: utils.formatToUpper(dados.endereco),
      comprovanteResidencia: dados.comprovanteResidencia,
      comprovanteTrabalho: dados.comprovanteTrabalho,
      comprovanteDispensaLegal: dados.comprovanteDispensaLegal,
      primeiraAssinatura: dados.primeiraAssinatura
    };
    
    // Buscar dados do atendente (nome e matrícula). A pasta é única: use types.DOCUMENTOS_FOLDER_ID
    var atendente = buscarAtendente(dadosFormatados.email);
    var responsibleClerk = atendente ? atendente.nome : '';
    var enrollment = atendente ? atendente.matricula : '';
    var folderId = types.DOCUMENTOS_FOLDER_ID; // pasta única do projeto
    Logger.log('[PDF] usando pasta única DOCUMENTOS_FOLDER_ID: %s', folderId);
    
    // Montar texto do PRESENT_WORK
    var presentWorkText = '';
    if (dadosFormatados.comprovanteTrabalho && normalizeText(dadosFormatados.comprovanteTrabalho) !== 'DISPENSA LEGAL') {
      presentWorkText = 'Apresentou comprovante de Trabalho Lícito: ' + dadosFormatados.comprovanteTrabalho;
    } else {
      presentWorkText = 'Apresentou comprovante de Dispensa Legal: ' + (dadosFormatados.comprovanteDispensaLegal || '');
    }
    
    // Lógica da FIRST_SUBSCRIPTION
    var firstSubscription = '';
    if (normalizeText(dadosFormatados.primeiraAssinatura) === 'SIM') {
      var nextTuesday = getNextTuesday();
      firstSubscription = 'Sim - Orientado a comparecer na SALA DE REINTEGRAÇÃO SOCIAL na data ' + nextTuesday + ' às 09h00min e juntar o comprovante no processo.';
    } else {
      firstSubscription = dadosFormatados.primeiraAssinatura || '';
    }
    
    // Data longa formatada
    var dateFormattedCap = formatDateLongPtBR();
    
    // Montar placeholders conforme modelo
    var placeholders = {
      '{{DATE}}': dateFormattedCap,
      '{{CASE_NUMBER}}': dadosFormatados.processNumber || '',
      '{{NAME}}': dadosFormatados.name || '',
      '{{CPF}}': dadosFormatados.cpf || '',
      '{{MOTHERS_NAME}}': dadosFormatados.motherName || '',
      '{{TELEPHONE}}': dadosFormatados.phone || '',
      '{{ADDRESS}}': dadosFormatados.endereco || '',
      '{{PRESENT_RESIDENCE}}': dadosFormatados.comprovanteResidencia || '',
      '{{PRESENT_WORK}}': presentWorkText,
      '{{FIRST_SUBSCRIPTION}}': firstSubscription,
      '{{RESPONSIBLE_CLERK}}': responsibleClerk,
      '{{ENROLLMENT}}': enrollment
    };
    
    // Chamar utilitário de geração de PDF
    var resultado = utils.gerarPdf({
      modeloId: types.TERMO_COMPARECIMENTO_TEMPLATE_ID,
      pastaDestinoId: folderId,
      nomeModelo: 'TERMO DE COMPARECIMENTO',
      nomePessoa: dadosFormatados.name,
      dados: placeholders
    });
    
    return resultado;
  } catch (e) {
    Logger.log('gerarTermoComparecimento error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Busca dados do atendente na aba USER pelo email.
 * @param {string} email - Email do atendente.
 * @returns {Object|null} Objeto com nome, matricula, folder ou null se não encontrado.
 */
function buscarAtendente(email) {
  try {
    if (!email) return null;
    
    var emailNorm = email.toString().toLowerCase().trim();
    var ss = SpreadsheetApp.openById(types.DATABASE_ID);
    var sheet = ss.getSheetByName('USER');
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    
    // Colunas esperadas (variam por implantação): A=NOME, B=E-MAIL, C=MATRICULA, D=FUNÇÃO, E=STATUS, F=FOLDER (opcional)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowEmail = row[1] ? row[1].toString().toLowerCase().trim() : '';
      
      if (rowEmail === emailNorm) {
        return {
          nome: row[0] || '',
          matricula: row[2] || ''
        };
      }
    }
    
    return null;
  } catch (e) {
    Logger.log('buscarAtendente error: ' + e.toString());
    return null;
  }
}

/**
 * Normaliza texto para comparação (maiúsculas, sem espaços extras).
 * @param {string} value - Texto a normalizar.
 * @returns {string} Texto normalizado.
 */
function normalizeText(value) {
  if (!value) return '';
  return value.toString().toUpperCase().trim();
}

/**
 * Retorna a próxima terça-feira no formato DD/MM/YYYY.
 * @returns {string} Data formatada.
 */
function getNextTuesday() {
  var hoje = new Date();
  var dayOfWeek = hoje.getDay(); // 0 = domingo, 2 = terça
  var daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
  if (daysUntilTuesday === 0) daysUntilTuesday = 7; // Se hoje é terça, pega a próxima
  
  var nextTuesday = new Date(hoje);
  nextTuesday.setDate(hoje.getDate() + daysUntilTuesday);
  
  var dia = String(nextTuesday.getDate()).padStart(2, '0');
  var mes = String(nextTuesday.getMonth() + 1).padStart(2, '0');
  var ano = nextTuesday.getFullYear();
  
  return dia + '/' + mes + '/' + ano;
}

/**
 * Formata data longa em português (ex: "09 de janeiro de 2026").
 * @returns {string} Data formatada.
 */
function formatDateLongPtBR() {
  var meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  
  var hoje = new Date();
  var dia = hoje.getDate().toString();
  var mes = meses[hoje.getMonth()];
  var ano = hoje.getFullYear().toString();
  
  return dia + ' de ' + mes + ' de ' + ano;
}

/**
 * Gera PDF a partir de dados do database para uma pessoa.
 * Busca dados completos pelo CPF e gera o documento.
 * @param {string} cpf - CPF da pessoa.
 * @param {string} tipoDocumento - Tipo de documento a gerar.
 * @returns {Object} Objeto com url do PDF ou error.
 */
function gerarPdfPorCpf(cpf, tipoDocumento) {
  try {
    if (!cpf) {
      return { error: 'CPF não informado.' };
    }
    
    // Buscar dados completos do database
    var cpfDigits = cpf.replace(/\D+/g, '');
    var resultados = utils.searchComplete({ cpf: cpfDigits }, SpreadsheetApp.openById(types.DATABASE_ID));
    
    if (resultados.error) {
      return { error: resultados.error };
    }
    
    if (!resultados || resultados.length === 0) {
      return { error: 'Pessoa não encontrada no database.' };
    }
    
    var pessoa = resultados[0];
    var endereco = pessoa.enderecos && pessoa.enderecos.length > 0 ? pessoa.enderecos[0] : {};
    
    // Gerar documento conforme tipo
    switch (tipoDocumento) {
      case 'TERMO_COMPARECIMENTO':
        return gerarTermoComparecimento({
          name: pessoa.nome,
          cpf: pessoa.cpf,
          motherName: pessoa.nomeMae,
          endereco: endereco.logradouro ? 
            endereco.logradouro + ', ' + endereco.bairro + ', ' + endereco.cidade + ' - ' + endereco.estado : '',
          phone: pessoa.telefone || ''
        });
      
      default:
        return { error: 'Tipo de documento não reconhecido: ' + tipoDocumento };
    }
  } catch (e) {
    Logger.log('gerarPdfPorCpf error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Gatilho onSubmit para geração de PDF.
 * Deve ser configurado como trigger do formulário.
 * @param {Object} e - Evento do Google Forms.
 */
function onSubmitGeneratePdf(e) {
  try {
    Logger.log('onSubmitGeneratePdf: evento recebido');
    
    // Extrair dados do evento
    var values = e.values || [];
    if (values.length === 0) {
      Logger.log('onSubmitGeneratePdf: sem valores no evento');
      return { error: 'Sem dados no evento.' };
    }
    
    // Mapear valores conforme estrutura do FORM_SEEU
    // A=timestamp, B=email, C=processNumber, D=name, E=motherName, F=fatherName,
    // G=birthDate, H=cpf, I=phone, J=street, K=regimeAtual, L=progressionDate,
    // M=profissao, N=interesseEm, O=education, P=comprovanteResidencia,
    // Q=comprovanteTrabalho, R=primeiraAssinatura, S=comprovanteDispensaLegal,
    // T=neighborhood, U=city, V=state
    
    var form = {
      timestamp: values[0] || '',
      email: values[1] || '',
      processNumber: values[2] || '',
      name: values[3] || '',
      motherName: values[4] || '',
      cpf: values[7] || '',
      phone: values[8] || '',
      street: values[9] || '',
      neighborhood: values[19] || '',
      city: values[20] || '',
      state: values[21] || '',
      comprovanteResidencia: values[15] || '',
      comprovanteTrabalho: values[16] || '',
      primeiraAssinatura: values[17] || '',
      comprovanteDispensaLegal: values[18] || ''
    };
    
    Logger.log('onSubmitGeneratePdf: form = %s', JSON.stringify(form));
    
    // Formatar dados antes de montar endereço
    var formFormatado = {
      email: form.email,
      processNumber: utils.formatProcessNumber(form.processNumber),
      name: utils.formatToUpper(form.name),
      motherName: utils.formatToUpper(form.motherName),
      cpf: utils.formatCPF(form.cpf),
      phone: utils.formatPhone(form.phone),
      street: utils.formatToUpper(form.street),
      neighborhood: utils.formatToUpper(form.neighborhood),
      city: utils.formatToUpper(form.city),
      state: form.state, // Estado será validado depois se necessário
      comprovanteResidencia: form.comprovanteResidencia,
      comprovanteTrabalho: form.comprovanteTrabalho,
      primeiraAssinatura: form.primeiraAssinatura,
      comprovanteDispensaLegal: form.comprovanteDispensaLegal
    };
    
    // Montar endereço completo com dados formatados
    var enderecoCompleto = '';
    var partes = [];
    if (formFormatado.street) partes.push(formFormatado.street);
    if (formFormatado.neighborhood) partes.push(formFormatado.neighborhood);
    if (formFormatado.city) partes.push(formFormatado.city);
    if (formFormatado.state) partes.push(formFormatado.state);
    enderecoCompleto = partes.join(', ');
    
    // Gerar PDF
    var resultado = gerarTermoComparecimento({
      email: formFormatado.email,
      processNumber: formFormatado.processNumber,
      name: formFormatado.name,
      motherName: formFormatado.motherName,
      cpf: formFormatado.cpf,
      phone: formFormatado.phone,
      endereco: enderecoCompleto,
      comprovanteResidencia: formFormatado.comprovanteResidencia,
      comprovanteTrabalho: formFormatado.comprovanteTrabalho,
      comprovanteDispensaLegal: formFormatado.comprovanteDispensaLegal,
      primeiraAssinatura: formFormatado.primeiraAssinatura
    });
    
    if (resultado.error) {
      Logger.log('onSubmitGeneratePdf error: %s', resultado.error);
    } else {
      Logger.log('onSubmitGeneratePdf success: %s', resultado.url);
    }
    
    return resultado;
  } catch (e) {
    Logger.log('onSubmitGeneratePdf error: %s', e.toString());
    return { error: e.toString() };
  }
}