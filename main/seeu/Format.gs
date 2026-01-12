/**
 * formata os dados para o formato esperado por FORM_SEEU
 * Recebe um objeto com possíveis chaves: nome, cpf, nomeMae, nomePai,
 * numeroProcesso, telefone, logradouro, bairro, cidade, profissao
 * Retorna um objeto `FORM_SEEU` com os mesmas chaves, textos em MAIÚSCULAS
 * e CPF/telefone contendo somente dígitos.
 */
function formatFormSEEU(input) {
	input = input || {};

	function up(v){
		// usar util formatToUpper se disponível
		if (typeof utils.formatToUpper === 'function') return utils.formatToUpper(v);
		if (v === null || v === undefined) return '';
		return String(v).toUpperCase().trim();
	}

	function digits(v){
		// usar util onlyDigits se disponível
		if (typeof utils.onlyDigits === 'function') return utils.onlyDigits(v);
		if (v === null || v === undefined) return '';
		return String(v).replace(/\D+/g, '');
	}

	var FORM_SEEU = {
		// Se `input` for um array (linha da planilha), usar os índices de `types.FORM_SEEU_COL`
		nome: up(Array.isArray(input) ? (input[types.FORM_SEEU_COL.NAME] || '') : (input.nome || input.nomeCompleto || input.fullName || '')),
		cpf: digits(Array.isArray(input) ? (input[types.FORM_SEEU_COL.CPF] || '') : (input.cpf || input.cpfFormatted || '')),
		nomeMae: up(Array.isArray(input) ? (input[types.FORM_SEEU_COL.MOTHER_NAME] || '') : (input.nomeMae || input.nome_da_mae || '')),
		nomePai: up(Array.isArray(input) ? (input[types.FORM_SEEU_COL.FATHER_NAME] || '') : (input.nomePai || input.nome_do_pai || '')),
		numeroProcesso: (function(){
			var raw = Array.isArray(input) ? (input[types.FORM_SEEU_COL.PROCESS_NUMBER] || '') : (input.numeroProcesso || input.numProcesso || input.processo || '');
			if (typeof utils.formatProcessNumber === 'function'){
				try { return utils.formatProcessNumber(raw); } catch(e){ return String(raw||'').toUpperCase(); }
			}
			return up(raw);
		})(),
		telefone: digits(Array.isArray(input) ? (input[types.FORM_SEEU_COL.PHONE] || '') : (input.telefone || input.tel || '')),
		telefoneFormatted: (function(){
			var ph = Array.isArray(input) ? (input[types.FORM_SEEU_COL.PHONE] || '') : (input.telefone || input.tel || '');
			if (typeof utils.formatPhone === 'function') return utils.formatPhone(ph);
			return ph;
		})(),
		logradouro: up(Array.isArray(input) ? (input[types.FORM_SEEU_COL.STREET] || '') : (input.logradouro || input.endereco || '')),
		bairro: up(Array.isArray(input) ? (input[types.FORM_SEEU_COL.NEIGHBORHOOD] || '') : (input.bairro || '')),
		cidade: up(Array.isArray(input) ? (input[types.FORM_SEEU_COL.CITY] || '') : (input.cidade || '')),
		profissao: up(Array.isArray(input) ? (input[types.FORM_SEEU_COL.PROFISSAO] || '') : (input.profissao || input.prof || ''))
	};

	return FORM_SEEU;
}


/**
 * Verifica se duas datas têm o mesmo dia (ano/mês/dia) local.
 */
function _isSameLocalDay(a, b){
	if(!a || !b) return false;
	var da = new Date(a);
	var db = new Date(b);
	return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

/**
 * Recebe um array de objetos (registros do FORM_SEEU) e retorna um novo
 * array onde os registros com `timestamp` correspondente ao dia anterior
 * à execução aparecem primeiro (mantendo ordem relativa), todos já
 * formatados via `formatFormSEEU`.
 *
 * Exemplo de uso:
 * var ordered = formatAndPrioritize(rows);
 */
function formatAndPrioritize(records){
	records = records || [];

	var now = new Date();
	var yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);

	var prevDay = [];
	var others = [];

	for(var i=0;i<records.length;i++){
		var r = records[i] || {};
		var ts = r.timestamp || r[types.FORM_SEEU_COL.TIMESTAMP] || r["TIMESTAMP"] || null;

		// Normaliza timestamp para Date quando possível
		var tsDate = null;
		try { tsDate = ts ? new Date(ts) : null; } catch(e){ tsDate = null; }

		if(tsDate && _isSameLocalDay(tsDate, yesterday)){
			prevDay.push(formatFormSEEU(r));
		} else {
			others.push(formatFormSEEU(r));
		}
	}

	return prevDay.concat(others);
}


/**
 * Rotina a ser usada em trigger diária (ex: time-driven - início do dia).
 * Formata os campos principais da aba `FORM_SEEU` usando `formatFormSEEU`
 * e prioriza (coloca primeiro) os registros cujo `timestamp` seja do
 * dia anterior à execução.
 */
function dailyFormatAndPrioritize(){
	try {
		var ss = SpreadsheetApp.openById(types.SEEU_ID);
		var sheet = ss.getSheetByName(types.SEEU_SHEET_NAMES.FORM_SEEU);
		if (!sheet) { Logger.log('dailyFormatAndPrioritize: aba FORM_SEEU não encontrada'); return; }

		var data = sheet.getDataRange().getValues();
		if (!data || data.length <= 1) { Logger.log('dailyFormatAndPrioritize: sem dados'); return; }

		var header = data[0];
		var rows = data.slice(1);

		var now = new Date();
		var yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);

		var prevDayRows = [];
		var otherRows = [];

		for (var i = 0; i < rows.length; i++){
			var row = rows[i] || [];
			var ts = row[types.FORM_SEEU_COL.TIMESTAMP] || row[0] || null;
			var tsDate = null;
			try { tsDate = ts ? new Date(ts) : null; } catch(e){ tsDate = null; }

			// Formatar a linha (retorna objeto com campos formatados)
			var fmt = formatFormSEEU(row);

			// Montar nova linha preservando colunas não listadas
			var newRow = row.slice(); // clone

			// Aplicar formatações nas colunas correspondentes
			// PROCESS_NUMBER
			newRow[types.FORM_SEEU_COL.PROCESS_NUMBER] = fmt.numeroProcesso || newRow[types.FORM_SEEU_COL.PROCESS_NUMBER];
			// NAME
			newRow[types.FORM_SEEU_COL.NAME] = fmt.nome || newRow[types.FORM_SEEU_COL.NAME];
			// MOTHER_NAME
			newRow[types.FORM_SEEU_COL.MOTHER_NAME] = fmt.nomeMae || newRow[types.FORM_SEEU_COL.MOTHER_NAME];
			// FATHER_NAME
			newRow[types.FORM_SEEU_COL.FATHER_NAME] = fmt.nomePai || newRow[types.FORM_SEEU_COL.FATHER_NAME];
			// CPF - usar formatCPF se disponível
			if (typeof utils.formatCPF === 'function') newRow[types.FORM_SEEU_COL.CPF] = utils.formatCPF(fmt.cpf || newRow[types.FORM_SEEU_COL.CPF]); else newRow[types.FORM_SEEU_COL.CPF] = fmt.cpf || newRow[types.FORM_SEEU_COL.CPF];
			// PHONE - usar formatPhone se disponível
			if (typeof utils.formatPhone === 'function') newRow[types.FORM_SEEU_COL.PHONE] = utils.formatPhone(fmt.telefone || newRow[types.FORM_SEEU_COL.PHONE]); else newRow[types.FORM_SEEU_COL.PHONE] = fmt.telefone || newRow[types.FORM_SEEU_COL.PHONE];
			// STREET / NEIGHBORHOOD / CITY / PROFISSAO
			newRow[types.FORM_SEEU_COL.STREET] = fmt.logradouro || newRow[types.FORM_SEEU_COL.STREET];
			newRow[types.FORM_SEEU_COL.NEIGHBORHOOD] = fmt.bairro || newRow[types.FORM_SEEU_COL.NEIGHBORHOOD];
			newRow[types.FORM_SEEU_COL.CITY] = fmt.cidade || newRow[types.FORM_SEEU_COL.CITY];
			newRow[types.FORM_SEEU_COL.PROFISSAO] = fmt.profissao || newRow[types.FORM_SEEU_COL.PROFISSAO];

			if (tsDate && _isSameLocalDay(tsDate, yesterday)) prevDayRows.push(newRow);
			else otherRows.push(newRow);
		}

		var ordered = prevDayRows.concat(otherRows);

		// reconstruir matriz para escrita (incluir cabeçalho)
		var out = [header].concat(ordered);

		// Garantir que a área a ser escrita tenha o mesmo número de colunas
		var colCount = header.length;
		// Ajustar largura de cada linha ao colCount
		for (var r = 0; r < out.length; r++){
			if (!out[r]) out[r] = new Array(colCount).fill('');
			if (out[r].length < colCount) {
				while (out[r].length < colCount) out[r].push('');
			} else if (out[r].length > colCount) {
				out[r] = out[r].slice(0, colCount);
			}
		}

		// Clear existing data range and write new ordered/formatted data
		var writeRange = sheet.getRange(1,1,out.length,colCount);
		writeRange.clearContent();
		writeRange.setValues(out);

		Logger.log('dailyFormatAndPrioritize: formatado ' + ordered.length + ' linhas (incluindo priorizadas).');
	} catch (e) {
		Logger.log('dailyFormatAndPrioritize error: ' + e.toString());
		throw e;
	}
}

