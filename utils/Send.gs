/**
 * utils/Send
 * Utility helpers to centralize creation/updating of database records.
 * Used by main/seeu/Send.gs and main/es_encaminhamentos/Send.gs
 *
 * Refactor: add `sendStructured(resources)` which accepts an object with optional
 * properties `person`, `criminalProcedure`, `socioeconomic` and invokes the
 * corresponding `save*` functions in `main/database`. Uses `types.DATABASE_ID`
 * by default so callers don't need to pass the spreadsheet id.
 */

/**
 * Backwards-compatible helpers (kept for compatibility).
 */
function isDatabaseAvailable() {
  return (typeof database !== 'undefined' && database !== null);
}

function sendToDatabase(fnName, payload, databaseId) {
  // prefer explicit spreadsheetId passed; otherwise use types.DATABASE_ID
  
  var ssId = databaseId || (typeof types !== 'undefined' ? types.DATABASE_ID : null);

  var db = (typeof database !== 'undefined') ? database : null;
  if (db && typeof db[fnName] === 'function') {
    return db[fnName](payload, ssId);
  }

  // try global function (no prefix)
  if (typeof globalThis !== 'undefined' && typeof globalThis[fnName] === 'function') {
    return globalThis[fnName](payload, ssId);
  }

  // legacy global lookup
  if (typeof this[fnName] === 'function') {
    return this[fnName](payload, ssId);
  }

  // Helpful error when database library is missing
  if (!isDatabaseAvailable()) {
    throw new Error(fnName + ' não disponível. A biblioteca `database` não parece estar adicionada ao projeto; adicione-a ou exponha uma função global chamada `' + fnName + '`.');
  }

  throw new Error(fnName + ' não disponível');
}

function sendBatch(ops, databaseId) {
  // ops: [{ fnName: 'savePerson', payload: {...}, label: 'PERSON' }, ...]
  var results = {};
  var errors = [];
  var ssId = databaseId || (typeof types !== 'undefined' ? types.DATABASE_ID : null);
  for (var i = 0; i < ops.length; i++) {
    var op = ops[i];
    try {
      var res = sendToDatabase(op.fnName, op.payload, ssId);
      results[op.label || op.fnName] = res;
    } catch (e) {
      // Log for easier debugging
      try { Logger.log('sendBatch error for %s: %s', op.fnName, e.toString()); } catch (logErr) {}
      errors.push({ label: op.label || op.fnName, message: e.toString() });
    }
  }
  return { results: results, errors: errors };
}

/**
 * New: sendStructured(resources)
 * - resources: { person?: {...}, criminalProcedure?: {...}, socioeconomic?: {...} }
 * - Calls the corresponding save* functions (savePerson, saveCriminalProcedure, saveSocioeconomic)
 * - Uses `types.DATABASE_ID` by default
 * - Returns { results: { person, criminalProcedure, socioeconomic }, errors: [ ... ] }
 */
function sendStructured(resources) {
  var results = {};
  var errors = [];
  var ssId = (typeof types !== 'undefined') ? types.DATABASE_ID : null;

  if (!ssId) {
    throw new Error('types.DATABASE_ID não encontrado. Certifique-se que a biblioteca `types` está adicionada ao projeto.');
  }

  // PERSON
  if (resources && resources.person) {
    try {
      results.person = sendToDatabase('savePerson', resources.person, ssId);
    } catch (e) {
      try { Logger.log('sendStructured person error: %s', e.toString()); } catch (logErr) {}
      errors.push({ resource: 'person', message: e.toString() });
    }
  }

  // CRIMINAL_PROCEDURE
  if (resources && resources.criminalProcedure) {
    try {
      results.criminalProcedure = sendToDatabase('saveCriminalProcedure', resources.criminalProcedure, ssId);
    } catch (e) {
      try { Logger.log('sendStructured criminalProcedure error: %s', e.toString()); } catch (logErr) {}
      errors.push({ resource: 'criminalProcedure', message: e.toString() });
    }
  }

  // SOCIOECONOMIC
  if (resources && resources.socioeconomic) {
    try {
      results.socioeconomic = sendToDatabase('saveSocioeconomic', resources.socioeconomic, ssId);
    } catch (e) {
      try { Logger.log('sendStructured socioeconomic error: %s', e.toString()); } catch (logErr) {}
      errors.push({ resource: 'socioeconomic', message: e.toString() });
    }
  }

  return { results: results, errors: errors };
}

