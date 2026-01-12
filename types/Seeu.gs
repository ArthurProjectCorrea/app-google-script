/**
 * ============================================================================
 * TYPES - FORM SEEU (Biblioteca GAS)
 * ============================================================================
 * Biblioteca de tipos e constantes para a GAS SEEU.
 * Contém definições de colunas (0-based) e nomes das abas.
 * 
 * IMPORTANTE: Este arquivo é uma BIBLIOTECA GAS.
 * Adicione ao projeto com identificador "types".
 * 
 * Uso externo: types.SEEU_ID, types.FORM_SEEU_COL.NAME, etc.
 * Uso interno: SEEU_ID, FORM_SEEU_COL.NAME, etc.
 * 
 * Abas incluídas: FORM_SEEU (respostas do formulário), REPORT
 * ============================================================================
 */

// =============================================================================
// ID DA PLANILHA SEEU
// =============================================================================
var SEEU_ID = '1xNrS5VhlYj351fMMPghn_CvXvz34d9KsYa1VSGo6TRg';

// =============================================================================
// URL DO FORMULÁRIO SEEU
// =============================================================================
// IMPORTANTE: Deve ser a URL completa (docs.google.com/forms) para suportar autopreenchimento.
// URLs encurtadas (forms.gle) não funcionam com parâmetros de prefill.
var SEEU_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScoVCu331B6CwLa1aTinOnq8Cf_zyjhuoMd4cCTc63MSe-sIw/viewform';

// ID DO FORMULÁRIO SEEU (usado para controle de compartilhamento)
var SEEU_FORM_ID = '1UZD5J4icd5cWs8UbWYwcSkYDIhttmNeFQ0j-PcaezTs'; // Compartilhamento por e-mail via DriveApp


// =============================================================================
// ID DO MODELO DO TERMO DE COMPARECIMENTO
// =============================================================================
var TERMO_COMPARECIMENTO_TEMPLATE_ID = '1w23HIre0O91X5qwXXoApEJpXhPRigH7pmd0uFcdTJcU';

// =============================================================================
// ID DA PASTA DE DOCUMENTOS
// =============================================================================
var DOCUMENTOS_FOLDER_ID = '1eRv_JuqxdCpyOOnL47AO-xFYmt2yBTXa';

// =============================================================================
// NOMES DAS ABAS SEEU
// =============================================================================
var SEEU_SHEET_NAMES = {
  FORM_SEEU: 'FORM_SEEU',
  REPORT: 'REPORT',
  REPORT_LIFTING: 'REPORT_LIFTING'
};

// =============================================================================
// ABA: REPORT
// =============================================================================
var REPORT_COL = {
  DIA: 0,          // Coluna A
  NOME: 1,         // Coluna B
  ATENDIMENTOS: 2  // Coluna C
};

// =============================================================================
// ABA: REPORT_LIFTING
// =============================================================================
var REPORT_LIFTING_COL = {
  INTERESSE_EM_SERVICOS: 0,  // Coluna A
  QUANTIDADES: 1             // Coluna B
};

// =============================================================================
// ABA: FORM_SEEU (Respostas do Formulário)
// =============================================================================
/**
 * Representa uma resposta do formulário SEEU.
 * 
 * Estrutura da aba FORM_SEEU:
 * Coluna A: TIMESTAMP - Carimbo de data/hora
 * Coluna B: EMAIL - Endereço de e-mail
 * Coluna C: PROCESS_NUMBER - Nº do Processo
 * Coluna D: NAME - Nome Completo
 * Coluna E: MOTHER_NAME - Nome Completo da Mãe
 * Coluna F: FATHER_NAME - Nome Completo do Pai
 * Coluna G: BIRTH_DATE - Data de Nascimento
 * Coluna H: CPF - CPF
 * Coluna I: PHONE - Telefone
 * Coluna J: STREET - Logradouro
 * Coluna K: REGIME_ATUAL - Regime Atual
 * Coluna L: PROGRESSION_DATE - Data Prevista para Progressão de Regime
 * Coluna M: PROFISSAO - Qual a Profissão Atual
 * Coluna N: INTERESSE_EM - Interesse Em
 * Coluna O: EDUCATION - Escolaridade
 * Coluna P: COMPROVANTE_RESIDENCIA - Apresentou Comprovante de Residência?
 * Coluna Q: COMPROVANTE_TRABALHO - Apresentou Comprovante de Trabalho Lícito?
 * Coluna R: PRIMEIRA_ASSINATURA - É a Primeira Assinatura?
 * Coluna S: COMPROVANTE_DISPENSA_LEGAL - Apresentou Comprovante de Dispensa Legal?
 * Coluna T: NEIGHBORHOOD - Bairro
 * Coluna U: CITY - Cidade
 * Coluna V: STATE - Estado
 */
var FORM_SEEU_COL = {
  TIMESTAMP: 0,                // Coluna A
  EMAIL: 1,                    // Coluna B
  PROCESS_NUMBER: 2,           // Coluna C
  NAME: 3,                     // Coluna D
  MOTHER_NAME: 4,              // Coluna E
  FATHER_NAME: 5,              // Coluna F
  BIRTH_DATE: 6,               // Coluna G
  CPF: 7,                      // Coluna H
  PHONE: 8,                    // Coluna I
  STREET: 9,                   // Coluna J
  REGIME_ATUAL: 10,            // Coluna K
  PROGRESSION_DATE: 11,        // Coluna L
  PROFISSAO: 12,               // Coluna M
  INTERESSE_EM: 13,            // Coluna N
  EDUCATION: 14,               // Coluna O
  COMPROVANTE_RESIDENCIA: 15,  // Coluna P
  COMPROVANTE_TRABALHO: 16,    // Coluna Q
  PRIMEIRA_ASSINATURA: 17,     // Coluna R
  COMPROVANTE_DISPENSA_LEGAL: 18, // Coluna S
  NEIGHBORHOOD: 19,            // Coluna T
  CITY: 20,                    // Coluna U
  STATE: 21                    // Coluna V
};

// =============================================================================
// ABA: FORM_ES_ENCAMINHAMENTOS (Respostas do Formulário ES)
// =============================================================================
/**
 * Representa uma resposta do formulário ES Encaminhamentos.
 * 
 * Estrutura da aba FORM_ES_ENCAMINHAMENTOS:
 * Coluna A: TIMESTAMP - Carimbo de data/hora
 * Coluna B: EMAIL - Endereço de e-mail
 * ... (definir conforme o formulário)
 */
var ES_ENCAMINHAMENTOS_COL = {
  TIMESTAMP: 0,                // Coluna A
  EMAIL: 1,                    // Coluna B
  NAME: 2,                     // Coluna C
  MOTHER_NAME: 3,              // Coluna D
  FATHER_NAME: 4,              // Coluna E
  BIRTH_DATE: 5,               // Coluna F
  CPF: 6,                      // Coluna G
  EDUCATION: 7,                // Coluna H
  CIVIL_STATUS: 8,             // Coluna I
  SEX: 9,                      // Coluna J
  GENDER_IDENTITY: 10,         // Coluna K
  SEXUAL_ORIENTATION: 11,      // Coluna L
  RELIGION: 12,                // Coluna M
  RACE_SELF_DECLARED: 13,      // Coluna N
  NATIONALITY: 14,             // Coluna O
  PERSON_TYPE: 15,             // Coluna P
  PHONE: 16,                   // Coluna Q
  STREET: 17,                  // Coluna R
  NEIGHBORHOOD: 18,            // Coluna S
  CITY: 19,                    // Coluna T
  STATE: 20,                   // Coluna U
  REGIME: 21,                  // Coluna V
  PROFISSAO_ATUAL: 22,         // Coluna W
  ENCAMINHAMENTOS: 23,         // Coluna X - Tipo de encaminhamento
  CURRENT_PROFESSION: 24,      // Coluna Y - Profissão atual (para autônomo)
  START_DATE: 25,              // Coluna Z - Data de início
  MONTHLY_INCOME: 26           // Coluna AA - Renda mensal
};