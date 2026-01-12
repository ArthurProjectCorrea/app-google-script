# Copilot Instructions - APP-FUANC

## Project Overview

Google Apps Script (GAS) project for managing SEEU (Sistema Eletrônico de Execução Unificada) attendances. Uses spreadsheets as databases, generates PDFs, and provides web interfaces.

**Workflow**: This is a local development/visualization environment. Code is copied and pasted manually into Google Apps Script editor. No automated deploy or local testing.

## Architecture: GAS Libraries

This project uses **Google Apps Script Libraries** to share code between projects.

### Library Structure

```
types (Library)     → Constants and column indices
utils (Library)     → Utility functions (uses types)
database (Library)  → CRUD operations (uses types, utils)
seeu (Project)      → Main application (uses types, utils, database)
```

### Critical Rule: How to Declare in Libraries

**CORRECT** - Declare as global variables/functions:
```javascript
// types/Database.gs
var DATABASE_ID = '1XRT...';           // ✅ Global variable
var PERSON_COL = { CPF: 4, NAME: 5 };  // ✅ Global variable
function formatDate(d) { ... }          // ✅ Global function
```

**WRONG** - Do NOT use namespace objects:
```javascript
// ❌ This does NOT work for libraries!
var types = types || {};
types.DATABASE_ID = '1XRT...';         // ❌ Not exported
```

### Internal vs External Calls

| Context | How to Call |
|---------|-------------|
| **Inside** `utils` library | `formatCPF(value)` |
| **Outside** (in `database` or `seeu`) | `utils.formatCPF(value)` |
| **Inside** `types` library | `DATABASE_ID` |
| **Outside** (in other projects) | `types.DATABASE_ID` |

### Directory Structure

| Directory | GAS Project | Library Identifier |
|-----------|-------------|-------------------|
| `types/` | types | `types` |
| `utils/` | utils | `utils` |
| `main/database/` | database | `database` |
| `main/seeu/` | seeu | - (main project) |

## Key Conventions

### Column Indices

All spreadsheet columns are **0-based** and defined in `types/`:

```javascript
// External access: types.PERSON_COL.NAME (returns 5)
// Internal access (inside types): PERSON_COL.NAME
var PERSON_COL = {
  CREATED_AT: 0,  // Column A
  CPF: 4,         // Column E
  NAME: 5,        // Column F
};
```

### Formatting Functions

External calls use `utils.*`:

```javascript
utils.formatCPF('12345678900');           // "123.456.789-00"
utils.formatPhone('65999999999');         // "(65) 99999-9999"
utils.formatProcessNumber('2000068...');  // "2000068-64.2020.8.11.0055"
utils.formatToUpper('joão');              // "JOÃO"
utils.onlyDigits('123.456');              // "123456"
```

### Validation

Use `utils.validate*` before saving data:

```javascript
utils.validateEducation('MÉDIO COMPLETO');  // throws if invalid
utils.validateSentenceRegime('ABERTO');     // returns normalized value
utils.validateState('RJ');                  // accepts "RJ" or "Rio de Janeiro"
```

### Search Functions

All search functions require a `Spreadsheet` object:

```javascript
var ss = SpreadsheetApp.openById(types.DATABASE_ID);
var results = utils.searchPerson({ cpf: '123...', nome: 'João' }, ss);
```

## File Patterns for New GAS Modules

When creating a new attendance module (like `main/novo/`), follow this structure:

| File | Purpose |
|------|---------|
| `Main.gs` | `doGet()`, HTML interface functions |
| `File.gs` | PDF generation using `utils.gerarPdf()` |
| `Form.gs` | Form prefill URLs using `utils.generatePrefillUrl()` |
| `Send.gs` | `onSubmitForm()` trigger, calls `database.*` |
| `Report.gs` | Report generation |
| `Test.gs` | Test functions |
| `Index.html` | Main web interface |

## Common Pitfalls

1. **Never use namespace pattern in library files** - Use global `var` and `function` declarations
2. **External calls need prefix** - Use `types.`, `utils.`, `database.` when calling from other projects
3. **Internal calls are direct** - Inside `utils`, call `formatCPF()` not `utils.formatCPF()`
4. **Spreadsheet IDs** - Use `types.DATABASE_ID` or `types.SEEU_ID` from external projects

## Deployment (Manual)

### Setting Up Libraries

1. Create GAS project `types`:
   - Copy files from `types/`
   - Create versioned deployment
   - Copy Script ID

2. Create GAS project `utils`:
   - Copy files from `utils/`
   - Add library `types` (identifier: `types`)
   - Create versioned deployment
   - Copy Script ID

3. Create GAS project `database`:
   - Copy files from `main/database/`
   - Add libraries: `types`, `utils`
   - Create versioned deployment
   - Copy Script ID

4. Create GAS project `seeu`:
   - Copy files from `main/seeu/`
   - Add libraries: `types`, `utils`, `database`

### Testing

- In `database` project: run `testCreatePersonWithCriminalProcedure()`
- In `seeu` project: run `runTestFullFlow()`

## Key Files Reference

- `types/Database.gs` - Database constants: `DATABASE_ID`, `PERSON_COL`, `CRIMINAL_PROCEDURE_COL`
- `types/Seeu.gs` - SEEU constants: `SEEU_ID`, `FORM_SEEU_COL`, form URLs
- `utils/Format.gs` - All formatting functions
- `utils/Search.gs` - All search functions, `parseFormSeeuEvent()`
- `utils/Validate.gs` - Validation functions and valid value arrays
- `main/database/Person.gs` - `savePerson()`, `createPerson()`, `updatePerson()`
- `main/database/CriminalProcedure.gs` - `saveCriminalProcedure()`, etc.

---

## Practical editing checks (for PRs)
- Library exports: verify `types`, `utils`, `database` files declare globals (e.g., `var DATABASE_ID = '...'` or `function formatCPF(...) {}`), not namespace objects (`var types = types || {};`).
- External calls: ensure cross-project calls are prefixed with the library identifier (e.g., `types.DATABASE_ID`, `utils.formatCPF()`).
- Tests & guards: add runtime checks in `Test.gs` when adding new features (e.g., `if (typeof types === 'undefined') { throw new Error('types library missing') }`).
- Column indices: prefer `types.PERSON_COL` constants over numeric literals; remember indices are 0-based.

## Local dev & deployment notes
- Manual GAS workflow: create GAS projects for `types`, `utils`, `database`, `seeu`; copy files into each project; add library references by script ID and set identifiers (`types`, `utils`, `database`); create versioned deployments for libraries.
- Test entrypoints:
  - `database`: run `testCreatePersonWithCriminalProcedure()` in the GAS editor
  - `seeu`: run `runTestFullFlow()` in the GAS editor

## Troubleshooting: common errors & fixes
- `types.DATABASE_ID is not defined` → add `types` library (script ID) to the GAS project and confirm identifier `types` and version.
- `utils.formatCPF is not a function` → ensure `utils` library is added/updated; check the identifier `utils`.
- `Invalid argument: id` (Spreadsheet) → confirm `types.DATABASE_ID` value and that the script/project has access to the spreadsheet.

## Behavioral expectations for AI edits
- Keep changes targeted and local to the module being modified; modify dependent code only when necessary and document the reason in the PR description.
- When changing or introducing exported symbols in a library, update README and add/modify tests in `main/*/Test.gs` that validate library availability at runtime.
- Add a concise test plan in the PR description: which GAS test to run, which GAS project to run it in, and what successful output looks like.

---

If you'd like, I can also:
- Add a short PR checklist to the file (verify exports, update README, add test), or
- Insert example code snippets (from `types/Database.gs` and `utils/Format.gs`) demonstrating the correct global declaration patterns.

Please tell me which addition you prefer or if any wording should be changed for your team.
