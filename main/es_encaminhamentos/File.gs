/**
 * Geração de arquivos PDF para o ES_ENCAMINHAMENTOS.
 * Utiliza o utilitário utils.gerarPdf para criar PDFs a partir de modelos.
 * Só gera PDF se o encaminhamento for "DECLARAÇÃO DE RESIDÊNCIA" ou "DECLARAÇÃO DE AUTÔNOMO".
 */

/**
 * IDs dos modelos de documentos para ES.
 */
var ES_DOCUMENTOS_FOLDER_ID = types.ES_DOCUMENTOS_FOLDER_ID;
var ES_DECLARACAO_RESIDENCIA_TEMPLATE_ID = types.ES_DECLARACAO_RESIDENCIA_TEMPLATE_ID;
var ES_DECLARACAO_AUTONOMO_TEMPLATE_ID = types.ES_DECLARACAO_AUTONOMO_TEMPLATE_ID;

/**
 * Gera PDF de Declaração de Residência.
 * @param {Object} dados - Dados para preencher o documento.
 * @param {string} dados.name - Nome completo.
 * @param {string} dados.cpf - CPF.
 * @param {string} dados.street - Logradouro.
 * @param {string} dados.neighborhood - Bairro.
 * @param {string} dados.city - Cidade.
 * @param {string} dados.state - Estado.
 * @param {string} dados.phone - Telefone.
 * @returns {Object} Objeto com url do PDF ou error.
 */
function gerarDeclaracaoResidencia(dados) {
  try {
    if (!dados || !dados.name || !dados.cpf) {
      return { error: 'Dados obrigatórios não informados (nome, cpf).' };
    }

    // Formatar dados
    var dadosFormatados = {
      name: utils.formatToUpper(dados.name),
      cpf: utils.formatCPF(dados.cpf),
      street: utils.formatToUpper(dados.street || ''),
      neighborhood: utils.formatToUpper(dados.neighborhood || ''),
      city: utils.formatToUpper(dados.city || ''),
      state: utils.formatToUpper(dados.state || ''),
      phone: utils.formatPhone(dados.phone || '')
    };

    // Data atual para carimbo
    var hoje = new Date();
    var dia = hoje.getDate().toString();
    var mes = (hoje.getMonth() + 1).toString();
    var ano = hoje.getFullYear().toString();

    // Placeholders
    var placeholders = {
      '{{NOME_COMPLETO}}': dadosFormatados.name,
      '{{CPF}}': dadosFormatados.cpf,
      '{{LOGRADOURO}}': dadosFormatados.street,
      '{{BAIRRO}}': dadosFormatados.neighborhood,
      '{{CIDADE}}': dadosFormatados.city,
      '{{ESTADO}}': dadosFormatados.state,
      '{{TELEFONE}}': dadosFormatados.phone,
      '{{DIA}}': dia,
      '{{MES}}': mes,
      '{{ANO}}': ano
    };

    // Gerar PDF
    var resultado = utils.gerarPdf({
      modeloId: ES_DECLARACAO_RESIDENCIA_TEMPLATE_ID,
      pastaDestinoId: ES_DOCUMENTOS_FOLDER_ID,
      nomeModelo: 'DECLARAÇÃO DE RESIDÊNCIA',
      nomePessoa: dadosFormatados.name,
      dados: placeholders
    });

    return resultado;
  } catch (e) {
    Logger.log('gerarDeclaracaoResidencia error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Gera PDF de Declaração de Autônomo.
 * @param {Object} dados - Dados para preencher o documento.
 * @param {string} dados.name - Nome completo.
 * @param {string} dados.cpf - CPF.
 * @param {string} dados.enderecoCompleto - Endereço completo.
 * @param {string} dados.profissao - Profissão.
 * @param {string} dados.dataInicio - Data de início.
 * @param {string} dados.rendaMensal - Renda mensal.
 * @returns {Object} Objeto com url do PDF ou error.
 */
function gerarDeclaracaoAutonomo(dados) {
  try {
    if (!dados || !dados.name || !dados.cpf) {
      return { error: 'Dados obrigatórios não informados (nome, cpf).' };
    }

    // Formatar dados
    var dadosFormatados = {
      name: utils.formatToUpper(dados.name),
      cpf: utils.formatCPF(dados.cpf),
      enderecoCompleto: utils.formatToUpper(dados.enderecoCompleto || ''),
      profissao: utils.formatToUpper(dados.profissao || ''),
      dataInicio: dados.dataInicio || '',
      rendaMensal: dados.rendaMensal ? 'R$ ' + dados.rendaMensal : ''
    };

    // Data atual para carimbo
    var hoje = new Date();
    var dia = hoje.getDate().toString();
    var mes = (hoje.getMonth() + 1).toString();
    var ano = hoje.getFullYear().toString();

    // Placeholders
    var placeholders = {
      '{{NOME_COMPLETO}}': dadosFormatados.name,
      '{{CPF}}': dadosFormatados.cpf,
      '{{ENDERECO_COMPLETO}}': dadosFormatados.enderecoCompleto,
      '{{PROFISSAO}}': dadosFormatados.profissao,
      '{{DATA_INICIO}}': dadosFormatados.dataInicio,
      '{{RENDA_MENSAL}}': dadosFormatados.rendaMensal,
      '{{DIA}}': dia,
      '{{MES}}': mes,
      '{{ANO}}': ano
    };

    // Gerar PDF
    var resultado = utils.gerarPdf({
      modeloId: ES_DECLARACAO_AUTONOMO_TEMPLATE_ID,
      pastaDestinoId: ES_DOCUMENTOS_FOLDER_ID,
      nomeModelo: 'DECLARAÇÃO DE AUTÔNOMO',
      nomePessoa: dadosFormatados.name,
      dados: placeholders
    });

    return resultado;
  } catch (e) {
    Logger.log('gerarDeclaracaoAutonomo error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Gatilho onSubmit para geração de PDF no ES_ENCAMINHAMENTOS.
 * Só gera PDF se o encaminhamento for "DECLARAÇÃO DE RESIDÊNCIA" ou "DECLARAÇÃO DE AUTÔNOMO".
 * @param {Object} e - Evento do Google Forms.
 */
function onSubmitGeneratePdfEs(e) {
  try {
    Logger.log('onSubmitGeneratePdfEs: evento recebido');

    // Extrair dados do evento
    var values = e.values || [];
    if (values.length === 0) {
      Logger.log('onSubmitGeneratePdfEs: sem valores no evento');
      return { error: 'Sem dados no evento.' };
    }

    // Verificar se o encaminhamento se aplica
    var encaminhamentos = values[types.ES_ENCAMINHAMENTOS_COL.ENCAMINHAMENTOS] || '';
    var encaminhamentoNorm = encaminhamentos.toString().trim().toUpperCase();

    if (encaminhamentoNorm !== 'DECLARAÇÃO DE RESIDÊNCIA' && encaminhamentoNorm !== 'DECLARAÇÃO DE AUTÔNOMO') {
      Logger.log('onSubmitGeneratePdfEs: encaminhamento não se aplica (%s), ignorando', encaminhamentoNorm);
      return { ignored: true, reason: 'Encaminhamento não é declaração de residência ou autônomo.' };
    }

    // Mapear valores conforme estrutura do FORM_ES_ENCAMINHAMENTOS
    var form = {
      name: values[types.ES_ENCAMINHAMENTOS_COL.NAME] || '',
      cpf: values[types.ES_ENCAMINHAMENTOS_COL.CPF] || '',
      street: values[types.ES_ENCAMINHAMENTOS_COL.STREET] || '',
      neighborhood: values[types.ES_ENCAMINHAMENTOS_COL.NEIGHBORHOOD] || '',
      city: values[types.ES_ENCAMINHAMENTOS_COL.CITY] || '',
      state: values[types.ES_ENCAMINHAMENTOS_COL.STATE] || '',
      phone: values[types.ES_ENCAMINHAMENTOS_COL.PHONE] || '',
      currentProfession: values[types.ES_ENCAMINHAMENTOS_COL.CURRENT_PROFESSION] || '',
      startDate: values[types.ES_ENCAMINHAMENTOS_COL.START_DATE] || '',
      monthlyIncome: values[types.ES_ENCAMINHAMENTOS_COL.MONTHLY_INCOME] || ''
    };

    Logger.log('onSubmitGeneratePdfEs: form = %s', JSON.stringify(form));

    // Montar endereço completo
    var enderecoCompleto = '';
    var partes = [];
    if (form.street) partes.push(form.street);
    if (form.neighborhood) partes.push(form.neighborhood);
    if (form.city) partes.push(form.city);
    if (form.state) partes.push(form.state);
    enderecoCompleto = partes.join(', ');

    // Gerar PDF conforme tipo
    var resultado;
    if (encaminhamentoNorm === 'DECLARAÇÃO DE RESIDÊNCIA') {
      resultado = gerarDeclaracaoResidencia({
        name: form.name,
        cpf: form.cpf,
        street: form.street,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        phone: form.phone
      });
    } else if (encaminhamentoNorm === 'DECLARAÇÃO DE AUTÔNOMO') {
      resultado = gerarDeclaracaoAutonomo({
        name: form.name,
        cpf: form.cpf,
        enderecoCompleto: enderecoCompleto,
        profissao: form.currentProfession,
        dataInicio: form.startDate,
        rendaMensal: form.monthlyIncome
      });
    }

    if (resultado.error) {
      Logger.log('onSubmitGeneratePdfEs error: %s', resultado.error);
    } else {
      Logger.log('onSubmitGeneratePdfEs success: %s', resultado.url);
    }

    return resultado;
  } catch (e) {
    Logger.log('onSubmitGeneratePdfEs error: %s', e.toString());
    return { error: e.toString() };
  }
}

/**
 * Função de trigger para o formulário ES_ENCAMINHAMENTOS.
 * Configure como trigger "On form submit" no editor GAS.
 * Chama onSubmitGeneratePdfEs para processar o envio e também envia dados ao database.
 * @param {Object} e - Evento do formulário.
 */
function onFormSubmitFile(e) {
  // Gerar PDF (se aplicável)
  var pdfRes = onSubmitGeneratePdfEs(e);

  // Tentar enviar dados ao database usando onSubmitSend (mapear valores do evento)
  try {
    var values = e.values || [];
    var formForSend = {
      timestamp: values[types.ES_ENCAMINHAMENTOS_COL.TIMESTAMP] || '',
      email: values[types.ES_ENCAMINHAMENTOS_COL.EMAIL] || '',
      name: values[types.ES_ENCAMINHAMENTOS_COL.NAME] || '',
      motherName: values[types.ES_ENCAMINHAMENTOS_COL.MOTHER_NAME] || '',
      fatherName: values[types.ES_ENCAMINHAMENTOS_COL.FATHER_NAME] || '',
      birthDate: values[types.ES_ENCAMINHAMENTOS_COL.BIRTH_DATE] || '',
      cpf: values[types.ES_ENCAMINHAMENTOS_COL.CPF] || '',
      education: values[types.ES_ENCAMINHAMENTOS_COL.EDUCATION] || '',
      civilStatus: values[types.ES_ENCAMINHAMENTOS_COL.CIVIL_STATUS] || '',
      sex: values[types.ES_ENCAMINHAMENTOS_COL.SEX] || '',
      genderIdentity: values[types.ES_ENCAMINHAMENTOS_COL.GENDER_IDENTITY] || '',
      sexualOrientation: values[types.ES_ENCAMINHAMENTOS_COL.SEXUAL_ORIENTATION] || '',
      religion: values[types.ES_ENCAMINHAMENTOS_COL.RELIGION] || '',
      raceSelfDeclared: values[types.ES_ENCAMINHAMENTOS_COL.RACE_SELF_DECLARED] || '',
      nationality: values[types.ES_ENCAMINHAMENTOS_COL.NATIONALITY] || '',
      personType: values[types.ES_ENCAMINHAMENTOS_COL.PERSON_TYPE] || '',
      currentRegime: values[types.ES_ENCAMINHAMENTOS_COL.CURRENT_REGIME] || '',
      phone: values[types.ES_ENCAMINHAMENTOS_COL.PHONE] || '',
      street: values[types.ES_ENCAMINHAMENTOS_COL.STREET] || '',
      neighborhood: values[types.ES_ENCAMINHAMENTOS_COL.NEIGHBORHOOD] || '',
      city: values[types.ES_ENCAMINHAMENTOS_COL.CITY] || '',
      state: values[types.ES_ENCAMINHAMENTOS_COL.STATE] || '',
      propertyType: values[types.ES_ENCAMINHAMENTOS_COL.PROPERTY_TYPE] || '',
      hasVehicle: values[types.ES_ENCAMINHAMENTOS_COL.HAS_VEHICLE] || '',
      hasChildren: values[types.ES_ENCAMINHAMENTOS_COL.HAS_CHILDREN] || '',
      childrenWithWhom: values[types.ES_ENCAMINHAMENTOS_COL.CHILDREN_WITH_WHOM] || '',
      currentProfession: values[types.ES_ENCAMINHAMENTOS_COL.CURRENT_PROFESSION] || '',
      startDate: values[types.ES_ENCAMINHAMENTOS_COL.START_DATE] || '',
      monthlyIncome: values[types.ES_ENCAMINHAMENTOS_COL.MONTHLY_INCOME] || ''
    };

    var sendRes = onSubmitSend(formForSend);
    if (sendRes && sendRes.errors && sendRes.errors.length) {
      Logger.log('onFormSubmitFile: send returned errors: %s', JSON.stringify(sendRes.errors));
    } else {
      Logger.log('onFormSubmitFile: send success');
    }
  } catch (err) {
    Logger.log('onFormSubmitFile send error: %s', err.toString());
  }

  return pdfRes;
}
