/**
 * ============================================================================
 * TYPES - DATABASE (Biblioteca GAS)
 * ============================================================================
 * Biblioteca de tipos e constantes para a GAS Database.
 * Contém definições de colunas (0-based) e nomes das abas.
 * 
 * IMPORTANTE: Este arquivo é uma BIBLIOTECA GAS.
 * Adicione ao projeto com identificador "types".
 * 
 * Uso externo: types.DATABASE_ID, types.PERSON_COL.NAME, etc.
 * Uso interno: DATABASE_ID, PERSON_COL.NAME, etc.
 * 
 * Abas incluídas: USER, PERSON, CRIMINAL_PROCEDURE
 * ============================================================================
 */

// =============================================================================
// ID DA PLANILHA
// =============================================================================
var DATABASE_ID = '1XRT_oSXn-47Nqzluv_QiaZ3FOtSGbeQC_XVeerO53TY';

// =============================================================================
// NOMES DAS ABAS
// =============================================================================
var SHEET_NAMES = {
  USER: 'USER',
  PERSON: 'PERSON',
  CRIMINAL_PROCEDURE: 'CRIMINAL_PROCEDURE',
  SOCIOECONOMIC: 'SOCIOECONOMIC'
};
// =============================================================================
// ABA: SOCIOECONOMIC
// =============================================================================
/**
 * Representa dados socioeconômicos associados a uma pessoa.
 * 
 * Estrutura da aba SOCIOECONOMIC:
 * Coluna A: CREATED_AT - Data de criação (automático)
 * Coluna B: CREATED_BY - Criado por
 * Coluna C: UPDATED_AT - Data de atualização
 * Coluna D: UPDATED_BY - Atualizado por
 * Coluna E: CPF - CPF associado
 * Coluna F: TIPO_IMOVEL - Tipo de imóvel
 * Coluna G: POSSUI_VEICULO - Possui veículo
 * Coluna H: POSSUI_FILHOS - Possui filhos
 * Coluna I: COM_QUEM_FILHOS - Com quem os filhos residem
 *
 * @typedef {Object} Socioeconomic
 */
var SOCIOECONOMIC_COL = {
  CREATED_AT: 0,         // Coluna A
  CREATED_BY: 1,         // Coluna B
  UPDATED_AT: 2,         // Coluna C
  UPDATED_BY: 3,         // Coluna D
  CPF: 4,                // Coluna E
  RESERVED_F: 5,         // Coluna F (reservada)
  RESERVED_G: 6,         // Coluna G (reservada)
  TIPO_IMOVEL: 7,        // Coluna H
  POSSUI_VEICULO: 8,     // Coluna I
  POSSUI_FILHOS: 9,      // Coluna J
  COM_QUEM_FILHOS: 10    // Coluna K
};

// =============================================================================
// ABA: USER
// =============================================================================
/**
 * Representa um usuário do sistema.
 * 
 * Estrutura da aba USER:
 * Coluna A: NOME - Nome completo do usuário
 * Coluna B: E-MAIL - Email do usuário (identificador único)
 * Coluna C: MATRICULA - Número de matrícula
 * Coluna D: FUNÇÃO - Funções do usuário (pode conter múltiplos valores separados por vírgula)
 * Coluna E: STATUS - Status do usuário (ex.: 'ATIVO', 'INATIVO')
 * 
 * @typedef {Object} User
 * @property {string} nome - Nome completo do usuário
 * @property {string} email - Email do usuário
 * @property {string} matricula - Número de matrícula
 * @property {string} funcao - Funções do usuário
 * @property {string} status - Status do usuário ('ATIVO'|'INATIVO')
 */
var USER_COL = {
  NOME: 0,       // Coluna A
  EMAIL: 1,      // Coluna B
  MATRICULA: 2,  // Coluna C
  FUNCAO: 3,     // Coluna D
  STATUS: 4      // Coluna E
};

var USER_FUNCOES = {
  ATENDENTE_SEEU: 'ATENDENTE SEEU'
};

// =============================================================================
// ABA: PERSON
// =============================================================================
/**
 * Representa uma pessoa no sistema.
 * 
 * Estrutura da aba PERSON:
 * Coluna A: CREATED_AT - Data de criação (automático)
 * Coluna B: CREATED_BY - Criado por
 * Coluna C: UPDATED_AT - Data de atualização
 * Coluna D: UPDATED_BY - Atualizado por
 * Coluna E: CPF - CPF da pessoa
 * Coluna F: NAME - Nome completo
 * Coluna G: MOTHER_NAME - Nome da mãe
 * Coluna H: FATHER_NAME - Nome do pai
 * Coluna I: BIRTH_DATE - Data de nascimento
 * Coluna J: EDUCATION - Escolaridade
 * Coluna K: PHONE - Telefone
 * Coluna L: STREET - Logradouro
 * Coluna M: NEIGHBORHOOD - Bairro
 * Coluna N: CITY - Cidade
 * Coluna O: STATE - Estado
 * 
 * @typedef {Object} Person
 */
var PERSON_COL = {
  CREATED_AT: 0,   // Coluna A
  CREATED_BY: 1,   // Coluna B
  UPDATED_AT: 2,   // Coluna C
  UPDATED_BY: 3,   // Coluna D
  CPF: 4,          // Coluna E
  NAME: 5,         // Coluna F
  MOTHER_NAME: 6,  // Coluna G
  FATHER_NAME: 7,  // Coluna H
  BIRTH_DATE: 8,   // Coluna I
  EDUCATION: 9,    // Coluna J
  PHONE: 10,       // Coluna K
  STREET: 11,      // Coluna L
  NEIGHBORHOOD: 12,// Coluna M
  CITY: 13,        // Coluna N
  STATE: 14,       // Coluna O
  // Novas colunas (P - W)
  MARITAL_STATUS: 15,        // Coluna P - ESTADO CIVIL
  SEX: 16,                   // Coluna Q - SEXO
  GENDER_IDENTITY: 17,       // Coluna R - IDENTIDADE DE GÊNERO
  SEXUAL_ORIENTATION: 18,    // Coluna S - ORIENTAÇÃO SEXUAL
  RELIGION: 19,              // Coluna T - RELIGIÃO
  RACE_SELF_DECLARED: 20,    // Coluna U - RAÇA - AUTODECLARADA
  NATIONALITY: 21,           // Coluna V - NACIONALIDADE
  PERSON_TYPE: 22,           // Coluna W - TIPO DE PESSOA
  PROFISSAO_ATUAL: 23        // Coluna X - PROFISSÃO ATUAL
};

// =============================================================================
// ABA: CRIMINAL_PROCEDURE
// =============================================================================
/**
 * Representa um procedimento criminal associado a uma pessoa.
 * 
 * Estrutura da aba CRIMINAL_PROCEDURE:
 * Coluna A: CREATED_AT - Data de criação (automático)
 * Coluna B: CREATED_BY - Criado por
 * Coluna C: UPDATED_AT - Data de atualização
 * Coluna D: UPDATED_BY - Atualizado por
 * Coluna E: CPF - CPF associado
 * Coluna F: RESERVED_F - Reservada
 * Coluna G: RESERVED_G - Reservada
 * Coluna H: PROCESS_NUMBER - Nº do Processo
 * Coluna I: SENTENCE_REGIME - Regime de Pena
 * Coluna J: PROGRESSION_DATE - Data de Progressão
 * 
 * @typedef {Object} CriminalProcedure
 */
var CRIMINAL_PROCEDURE_COL = {
  CREATED_AT: 0,       // Coluna A
  CREATED_BY: 1,       // Coluna B
  UPDATED_AT: 2,       // Coluna C
  UPDATED_BY: 3,       // Coluna D
  CPF: 4,              // Coluna E
  RESERVED_F: 5,       // Coluna F
  RESERVED_G: 6,       // Coluna G
  PROCESS_NUMBER: 7,   // Coluna H
  SENTENCE_REGIME: 8,  // Coluna I
  PROGRESSION_DATE: 9  // Coluna J
};

// =============================================================================
// COLUNAS COMUNS (padrão de auditoria)
// =============================================================================
var AUDIT_COL = {
  CREATED_AT: 0,  // Coluna A
  CREATED_BY: 1,  // Coluna B
  UPDATED_AT: 2,  // Coluna C
  UPDATED_BY: 3,  // Coluna D
  CPF: 4          // Coluna E
};
