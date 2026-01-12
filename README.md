# APP-FUANC - Sistema de Gestão SEEU

Sistema desenvolvido em **Google Apps Script** para gerenciar atendimentos do SEEU (Sistema Eletrônico de Execução Unificada), incluindo cadastro de pessoas, geração de documentos PDF e relatórios.

---

## 🏗️ Arquitetura de Bibliotecas GAS

Este projeto utiliza **Bibliotecas do Google Apps Script** para compartilhar código entre projetos.

### Diagrama de Dependências

```
┌─────────────────────────────────────────────────────────────────┐
│                         PROJETOS GAS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐     ┌─────────────┐                          │
│   │   types     │     │   utils     │  ◄── Bibliotecas Base    │
│   │ (Biblioteca)│     │ (Biblioteca)│                          │
│   └──────┬──────┘     └──────┬──────┘                          │
│          │                   │                                  │
│          ▼                   ▼                                  │
│   ┌──────────────────────────────────┐                         │
│   │           database               │  ◄── Projeto Database   │
│   │         (Biblioteca)             │                          │
│   │  Usa: types, utils               │                          │
│   └──────────────┬───────────────────┘                         │
│                  │                                              │
│                  ▼                                              │
│   ┌──────────────────────────────────┐                         │
│   │             seeu                 │  ◄── Projeto Principal  │
│   │         (Projeto Final)          │                          │
│   │  Usa: types, utils, database     │                          │
│   └──────────────────────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Projetos GAS Necessários

| Projeto GAS | Identificador | Descrição | Arquivos Locais |
|-------------|---------------|-----------|-----------------|
| **types** | `types` | Constantes e estruturas | `types/*.gs` |
| **utils** | `utils` | Funções utilitárias | `utils/*.gs` |
| **database** | `database` | CRUD de dados | `main/database/*.gs` |
| **seeu** | - | Projeto final | `main/seeu/*.gs` |

---

## ⚠️ IMPORTANTE: Como Funcionam Bibliotecas GAS

### Regra de Ouro

Quando você adiciona uma biblioteca ao projeto GAS com identificador (ex: `types`), você acessa suas funções/variáveis pelo identificador:

```javascript
// No projeto "database" ou "seeu", após adicionar biblioteca "types":
var id = types.DATABASE_ID;           // ✅ Acessa via identificador
var col = types.PERSON_COL.NAME;      // ✅ Acessa via identificador

// No próprio projeto "types" (internamente):
var id = DATABASE_ID;                  // ✅ Acessa diretamente
```

### Declaração de Variáveis/Funções nas Bibliotecas

**CORRETO** - Declarar como variáveis/funções globais:
```javascript
// types/Database.gs
var DATABASE_ID = '1XRT...';           // ✅ Variável global
var PERSON_COL = { CPF: 4, NAME: 5 };  // ✅ Variável global
function formatDate(d) { ... }          // ✅ Função global
```

**ERRADO** - NÃO usar namespace interno:
```javascript
// ❌ Isso NÃO funciona para bibliotecas!
var types = types || {};
types.DATABASE_ID = '1XRT...';         // ❌ Não será exportado
```

### Chamadas Internas vs Externas

| Contexto | Como Chamar |
|----------|-------------|
| **Dentro** da biblioteca `utils` | `formatCPF(value)` |
| **Fora** (em `database` ou `seeu`) | `utils.formatCPF(value)` |

---

## 📁 Estrutura do Projeto

```
app-fuanc/
├── main/
│   ├── database/            # Projeto GAS "database"
│   │   ├── CriminalProcedure.gs
│   │   ├── Person.gs
│   │   └── Test.gs
│   └── seeu/                # Projeto GAS "seeu"
│       ├── File.gs
│       ├── Form.gs
│       ├── Main.gs
│       ├── Report.gs
│       ├── Send.gs
│       ├── Test.gs
│       ├── Index.html
│       └── Template.html
├── types/                   # Projeto GAS "types" (Biblioteca)
│   ├── Database.gs          # Constantes do Database
│   └── Seeu.gs              # Constantes do SEEU
└── utils/                   # Projeto GAS "utils" (Biblioteca)
    ├── File.gs              # Geração de PDF
    ├── Form.gs              # URLs de autopreenchimento
    ├── Format.gs            # Formatação (CPF, telefone, etc.)
    ├── Search.gs            # Busca no database
    └── Validate.gs          # Validação de dados
```

---

## 🔧 Como Configurar os Projetos GAS

### 1. Criar Projeto "types"

1. No Google Apps Script, crie um novo projeto chamado `types`
2. Copie o conteúdo de `types/Database.gs` e `types/Seeu.gs`
3. Clique em **Configurações do projeto** → copie o **ID do script**
4. Crie uma **implantação versionada** (Deploy > Nova implantação > Biblioteca)

### 2. Criar Projeto "utils"

1. Crie um novo projeto chamado `utils`
2. Copie todos os arquivos de `utils/*.gs`
3. Adicione a biblioteca `types`:
   - Bibliotecas > Adicionar > Cole o ID do projeto `types`
   - Identificador: `types`
4. Crie uma implantação versionada

### 3. Criar Projeto "database"

1. Crie um novo projeto chamado `database`
2. Copie todos os arquivos de `main/database/*.gs`
3. Adicione as bibliotecas:
   - `types` (identificador: `types`)
   - `utils` (identificador: `utils`)
4. Crie uma implantação versionada

### 4. Criar Projeto "seeu"

1. Crie um novo projeto chamado `seeu`
2. Copie todos os arquivos de `main/seeu/*.gs` e `.html`
3. Adicione as bibliotecas:
   - `types` (identificador: `types`)
   - `utils` (identificador: `utils`)
   - `database` (identificador: `database`)

---

## 📚 Referência das Bibliotecas

### types - Constantes

| Constante | Descrição |
|-----------|-----------|
| `types.DATABASE_ID` | ID da planilha Database |
| `types.SEEU_ID` | ID da planilha SEEU |
| `types.SHEET_NAMES` | Nomes das abas do Database |
| `types.SEEU_SHEET_NAMES` | Nomes das abas do SEEU |
| `types.PERSON_COL` | Índices de colunas da aba PERSON |
| `types.CRIMINAL_PROCEDURE_COL` | Índices de colunas da aba CRIMINAL_PROCEDURE |
| `types.FORM_SEEU_COL` | Índices de colunas da aba FORM_SEEU |
| `types.TERMO_COMPARECIMENTO_TEMPLATE_ID` | ID do template do termo |
| `types.DOCUMENTOS_FOLDER_ID` | ID da pasta de documentos |

### utils - Funções Utilitárias

#### Formatação
| Função | Descrição |
|--------|-----------|
| `utils.formatCPF(value)` | Formata CPF: `123.456.789-00` |
| `utils.formatPhone(value)` | Formata telefone: `(65) 99999-9999` |
| `utils.formatProcessNumber(value)` | Formata processo: `0001234-56.2025.8.11.0055` |
| `utils.formatToUpper(value)` | Converte para maiúsculas |
| `utils.onlyDigits(value)` | Retorna apenas dígitos |
| `utils.formatDateShort(date)` | Formata data: `YYYY-MM-DD` |

#### Validação
| Função | Descrição |
|--------|-----------|
| `utils.validateEducation(value)` | Valida escolaridade |
| `utils.validateSentenceRegime(value)` | Valida regime de pena |
| `utils.validateState(value)` | Valida estado brasileiro |

#### Busca
| Função | Descrição |
|--------|-----------|
| `utils.searchPerson(filtros, ss)` | Busca pessoas |
| `utils.searchCriminalProcedure(filtros, ss)` | Busca procedimentos |
| `utils.searchComplete(filtros, ss)` | Busca completa |
| `utils.findRowByColumnValue(ss, sheet, col, value)` | Encontra linha por valor |
| `utils.getAllUsers(ss)` | Lista todos usuários |
| `utils.getUsersByFuncao(funcao, ss)` | Usuários por função |

#### PDF e Formulários
| Função | Descrição |
|--------|-----------|
| `utils.gerarPdf(config)` | Gera PDF de template |
| `utils.generatePrefillUrl(baseUrl, entries)` | Gera URL de autopreenchimento |

### database - CRUD

| Função | Descrição |
|--------|-----------|
| `database.savePerson(data, spreadsheetId)` | Salva/atualiza pessoa |
| `database.createPerson(data, ss)` | Cria pessoa |
| `database.updatePerson(data, ss)` | Atualiza pessoa |
| `database.saveCriminalProcedure(data, spreadsheetId)` | Salva/atualiza procedimento |
| `database.createCriminalProcedure(data, ss)` | Cria procedimento |
| `database.updateCriminalProcedure(data, ss)` | Atualiza procedimento |

---

## 🧪 Testes

### Testar Database

No projeto `database`, execute `testCreatePersonWithCriminalProcedure()`:

```javascript
function testCreatePersonWithCriminalProcedure() {
  // Verifica bibliotecas types e utils
  // Cria Person com dados de teste
  // Cria CriminalProcedure associado
}
```

### Testar SEEU

No projeto `seeu`, execute `runTestFullFlow()`:

```javascript
function runTestFullFlow() {
  // Testa o fluxo completo:
  // 1. onSubmitForm (Send.gs)
  // 2. gerarTermoComparecimento (File.gs)
  // 3. gerarRelatorioSeeu (Report.gs)
}
```

---

## ⚡ Solução de Problemas

### Erro: "types.DATABASE_ID não está definido"

**Causa**: A biblioteca `types` não foi adicionada ao projeto GAS.

**Solução**:
1. No editor GAS, clique em **Bibliotecas** > **+**
2. Cole o ID do script do projeto `types`
3. Selecione a versão mais recente
4. Defina o identificador como `types`
5. Clique em **Adicionar**

### Erro: "utils.formatCPF is not a function"

**Causa**: A biblioteca `utils` não foi adicionada ou está desatualizada.

**Solução**:
1. Verifique se `utils` está nas bibliotecas do projeto
2. Atualize para a versão mais recente
3. Verifique se o identificador é exatamente `utils`

### Erro: "Invalid argument: id"

**Causa**: `SpreadsheetApp.openById()` recebeu um valor inválido.

**Solução**:
1. Verifique se `types.DATABASE_ID` está definido
2. Confirme que o ID da planilha está correto
3. Verifique permissões de acesso à planilha

---

## 📋 Índices de Colunas (0-based)

### PERSON (Database)
| Índice | Coluna | Campo |
|--------|--------|-------|
| 0 | A | CREATED_AT |
| 1 | B | CREATED_BY |
| 2 | C | UPDATED_AT |
| 3 | D | UPDATED_BY |
| 4 | E | CPF |
| 5 | F | NAME |
| 6 | G | MOTHER_NAME |
| 7 | H | FATHER_NAME |
| 8 | I | BIRTH_DATE |
| 9 | J | EDUCATION |
| 10 | K | PHONE |
| 11 | L | STREET |
| 12 | M | NEIGHBORHOOD |
| 13 | N | CITY |
| 14 | O | STATE |

### CRIMINAL_PROCEDURE (Database)
| Índice | Coluna | Campo |
|--------|--------|-------|
| 0 | A | CREATED_AT |
| 1 | B | CREATED_BY |
| 2 | C | UPDATED_AT |
| 3 | D | UPDATED_BY |
| 4 | E | CPF |
| 7 | H | PROCESS_NUMBER |
| 8 | I | SENTENCE_REGIME |
| 9 | J | PROGRESSION_DATE |

### FORM_SEEU (SEEU)
| Índice | Coluna | Campo |
|--------|--------|-------|
| 0 | A | TIMESTAMP |
| 1 | B | EMAIL |
| 2 | C | PROCESS_NUMBER |
| 3 | D | NAME |
| 4 | E | MOTHER_NAME |
| 5 | F | FATHER_NAME |
| 6 | G | BIRTH_DATE |
| 7 | H | CPF |
| 8 | I | PHONE |
| 9 | J | STREET |
| 10 | K | REGIME_ATUAL |
| 11 | L | PROGRESSION_DATE |
| 14 | O | EDUCATION |
| 19 | T | NEIGHBORHOOD |
| 20 | U | CITY |
| 21 | V | STATE |

---

## ⚙️ Configuração de Triggers

### Trigger para Geração Automática de PDF no ES

Para ativar a geração automática de PDFs no envio do formulário ES_ENCAMINHAMENTOS:

1. **Acesse o Editor GAS** do projeto `es_encaminhamentos`
2. **Abra o menu** "Editar" → "Triggers do projeto atual"
3. **Clique em "Adicionar Trigger"**
4. **Configure o trigger**:
   - **Função a executar**: `onFormSubmit`
   - **Implante**: `Head`
   - **Eventos**: `Do Google Forms` → `On form submit`
5. **Salve o trigger**

O trigger irá gerar PDFs automaticamente apenas para encaminhamentos do tipo "DECLARAÇÃO DE RESIDÊNCIA" ou "DECLARAÇÃO DE AUTÔNOMO".

### Testes

Execute os testes no editor GAS:
- `testOnSubmitGeneratePdfEsResidencia()` - Testa geração de declaração de residência
- `testOnSubmitGeneratePdfEsAutonomo()` - Testa geração de declaração de autônomo
- `testOnSubmitGeneratePdfEsIgnored()` - Testa que outros encaminhamentos são ignorados

---

## 📝 Licença

Projeto interno FUNAC-MT.
