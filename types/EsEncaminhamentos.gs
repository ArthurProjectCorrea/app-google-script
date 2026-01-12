/**
 * ============================================================================
 * TYPES - FORM ES ENCAMINHAMENTOS (Biblioteca GAS)
 * ============================================================================
 * Constantes e mapeamento de colunas para a GAS de Encaminhamentos do
 * Escritório Social (aba FORM_ES_ENCAMINHAMENTOS).
 *
 * IMPORTANTE: Este arquivo é uma BIBLIOTECA GAS.
 * Adicione ao projeto com identificador "types" ou copie as constantes para
 * o projeto que consumirá estas constantes.
 * ============================================================================
 */

// =============================================================================
// ID DA PLANILHA
// =============================================================================
var ES_ENCAMINHAMENTOS_ID = '11Pcms1OhZwcw61hTai-QIF7zMgbwxNPM8ILRloJLo5A';

// =============================================================================
// URL E ID DO FORMULÁRIO
// =============================================================================
var ES_ENCAMINHAMENTOS_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdTbf2bYMEzZotQtpHBeMNLckCT3b-zKl7q55O2m0636C0Iyg/viewform?usp=header';
var ES_ENCAMINHAMENTOS_FORM_ID = '1DHIXFEJG8O0TIXzEAlQjB8zmBuuexL8eGSBdcmA9-u8';

// =============================================================================
// PASTA E MODELOS PARA PDFs
// =============================================================================
var ES_DOCUMENTOS_FOLDER_ID = '14PE5EcnHOx3kon_R7zqg3iSouElO9a-e';
var ES_DECLARACAO_RESIDENCIA_TEMPLATE_ID = '1ZXDB0oBjAzf6UBae1u9yBJwxF8AvUF_Mp0fah8yccdE';
var ES_DECLARACAO_AUTONOMO_TEMPLATE_ID = '1uAd37A-_TojMy8sDbFlqFPn7TfZ_glsBCLauA_BRrqY';

// =============================================================================
// NOME DA ABA
// =============================================================================
var ES_ENCAMINHAMENTOS_SHEET_NAME = 'FORM_ES_ENCAMINHAMENTOS';

// =============================================================================
// ABA: FORM_ES_ENCAMINHAMENTOS
// Mapeamento de colunas (0-based)
// =============================================================================
/**
 * Estrutura da aba FORM_ES_ENCAMINHAMENTOS (colunas A..AE):
 * A: TIMESTAMP
 * B: EMAIL
 * C: TIPO_ATENDIMENTO
 * D: NAME
 * E: MOTHER_NAME
 * F: FATHER_NAME
 * G: BIRTH_DATE
 * H: CPF
 * I: EDUCATION
 * J: CIVIL_STATUS
 * K: SEX
 * L: GENDER_IDENTITY
 * M: SEXUAL_ORIENTATION
 * N: RELIGION
 * O: RACE_SELF_DECLARED
 * P: NATIONALITY
 * Q: PERSON_TYPE
 * R: CURRENT_REGIME
 * S: PHONE
 * T: STREET
 * U: NEIGHBORHOOD
 * V: CITY
 * W: STATE
 * X: PROPERTY_TYPE
 * Y: HAS_VEHICLE
 * Z: HAS_CHILDREN
 * AA: CHILDREN_WITH_WHOM
 * AB: ENCAMINHAMENTOS
 * AC: CURRENT_PROFESSION
 * AD: START_DATE
 * AE: MONTHLY_INCOME
 */
var ES_ENCAMINHAMENTOS_COL = {
  TIMESTAMP: 0,
  EMAIL: 1,
  TIPO_ATENDIMENTO: 2,
  NAME: 3,
  MOTHER_NAME: 4,
  FATHER_NAME: 5,
  BIRTH_DATE: 6,
  CPF: 7,
  EDUCATION: 8,
  CIVIL_STATUS: 9,
  SEX: 10,
  GENDER_IDENTITY: 11,
  SEXUAL_ORIENTATION: 12,
  RELIGION: 13,
  RACE_SELF_DECLARED: 14,
  NATIONALITY: 15,
  PERSON_TYPE: 16,
  CURRENT_REGIME: 17,
  PHONE: 18,
  STREET: 19,
  NEIGHBORHOOD: 20,
  CITY: 21,
  STATE: 22,
  PROPERTY_TYPE: 23,
  HAS_VEHICLE: 24,
  HAS_CHILDREN: 25,
  CHILDREN_WITH_WHOM: 26,
  ENCAMINHAMENTOS: 27,
  CURRENT_PROFESSION: 28,
  START_DATE: 29,
  MONTHLY_INCOME: 30
};

// Export helper: nomes de aba para uso consistente
var ES_ENCAMINHAMENTOS_SHEET_NAMES = {
  FORM_ES_ENCAMINHAMENTOS: ES_ENCAMINHAMENTOS_SHEET_NAME
};

/**
 * Nota: use `ES_ENCAMINHAMENTOS_ID` para abrir a planilha e
 * `ES_ENCAMINHAMENTOS_FORM_ID` para operações com FormApp.
 */
