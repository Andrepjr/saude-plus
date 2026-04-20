const { store, nextId } = require('./store');

function extractDias(s) {
  const m = s.match(/systimestamp\s*-\s*(\d+)/);
  return m ? parseInt(m[1]) : 30;
}

function hoje() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function detectOutKey(params) {
  return Object.keys(params).find(k => params[k] !== null && typeof params[k] === 'object' && 'dir' in params[k]);
}

function mockExecute(s, params) {
  params = params || {};
  const uid = params.u_id;  // controllers use :u_id (renamed from :uid which is Oracle reserved)

  // ── QUERIES ESPECIAIS ─────────────────────────────────────────────────────

  if (s.includes('row_number()')) {
    const tipos = ['GLICOSE', 'PRESSAO'];
    const rows = tipos.map(tipo => {
      const sorted = store.registros_saude
        .filter(r => r.USUARIO_ID === uid && r.TIPO === tipo)
        .sort((a, b) => new Date(b.DATA_HORA) - new Date(a.DATA_HORA));
      return sorted[0] || null;
    }).filter(Boolean).map(r => ({
      TIPO: r.TIPO, VALOR: r.VALOR, DATA_HORA: r.DATA_HORA, STATUS: r.STATUS,
    }));
    return { rows, outBinds: {} };
  }

  if (s.includes('nvl(ml.tomado')) {
    const meds = store.medicamentos.filter(m => m.USUARIO_ID === uid && m.ATIVO === 1);
    const rows = meds.map(m => {
      const log = store.medicamentos_log.find(l =>
        l.MEDICAMENTO_ID === m.ID && l.USUARIO_ID === uid &&
        new Date(l.DATA_HORA) >= hoje()
      );
      return {
        ID: m.ID, NOME: m.NOME, DOSAGEM: m.DOSAGEM, HORARIOS: m.HORARIOS,
        TOMADO: log ? log.TOMADO : 0,
        HORARIO_PREVISTO: log ? log.HORARIO_PREVISTO : null,
        DATA_HORA: log ? log.DATA_HORA : null,
      };
    });
    return { rows, outBinds: {} };
  }

  if (s.includes('m.nome') && s.includes('ml.horario_previsto')) {
    const meds = store.medicamentos.filter(m => m.USUARIO_ID === uid && m.ATIVO === 1);
    const rows = meds.filter(m => {
      const log = store.medicamentos_log.find(l =>
        l.MEDICAMENTO_ID === m.ID && l.USUARIO_ID === uid &&
        new Date(l.DATA_HORA) >= hoje() && l.TOMADO === 1
      );
      return !log;
    }).map(m => {
      const log = store.medicamentos_log.find(l =>
        l.MEDICAMENTO_ID === m.ID && l.USUARIO_ID === uid &&
        new Date(l.DATA_HORA) >= hoje()
      );
      return { NOME: m.NOME, HORARIO_PREVISTO: log ? log.HORARIO_PREVISTO : null };
    });
    return { rows, outBinds: {} };
  }

  if (s.includes('count(*) as total')) {
    const dias = extractDias(s);
    const corte = new Date(Date.now() - dias * 86400000);
    const logs = store.medicamentos_log.filter(l =>
      l.USUARIO_ID === uid && new Date(l.DATA_HORA) >= corte
    );
    return {
      rows: [{ TOTAL: logs.length, TOMADOS: logs.filter(l => l.TOMADO === 1).length }],
      outBinds: {},
    };
  }

  // ── OPERAÇÕES SIMPLES POR TABELA ─────────────────────────────────────────

  const op = s.startsWith('select') ? 'SELECT'
           : s.startsWith('insert') ? 'INSERT'
           : s.startsWith('update') ? 'UPDATE'
           : 'OTHER';

  // ── usuarios ──
  if (s.includes('usuarios')) {
    if (op === 'SELECT') {
      const rows = store.usuarios.filter(u => u.EMAIL === params.eml);
      return { rows, outBinds: {} };
    }
    if (op === 'INSERT') {
      const id = nextId('usuarios');
      store.usuarios.push({
        ID: id, NOME: params.nome, EMAIL: params.email,
        SENHA: params.senha, PERFIL: params.perfil, CRIADO_EM: new Date(),
      });
      const outKey = detectOutKey(params);
      return { rows: [], outBinds: outKey ? { [outKey]: [id] } : {} };
    }
  }

  // ── chat_historico ──
  if (s.includes('chat_historico')) {
    if (op === 'SELECT') {
      const limit = parseInt((s.match(/fetch first (\d+) rows/i) || [])[1]) || 50;
      const rows = store.chat_historico
        .filter(c => c.USUARIO_ID === uid)
        .sort((a, b) => new Date(b.CRIADO_EM) - new Date(a.CRIADO_EM))
        .slice(0, limit)
        .map(c => ({ ROLE: c.ROLE, CONTEUDO: c.CONTEUDO, CRIADO_EM: c.CRIADO_EM }));
      return { rows, outBinds: {} };
    }
    if (op === 'INSERT') {
      const role = s.includes("'assistant'") ? 'assistant' : 'user';
      store.chat_historico.push({
        ID: nextId('chat_historico'),
        USUARIO_ID: uid,
        ROLE: role,
        CONTEUDO: params.msg || '',
        CRIADO_EM: new Date(),
      });
      return { rows: [], outBinds: {} };
    }
  }

  // ── registros_saude ──
  if (s.includes('registros_saude')) {
    if (op === 'SELECT') {
      let tipo = params.tp ? params.tp.toUpperCase() : null;
      if (!tipo) {
        if (s.includes("tipo = 'glicose'")) tipo = 'GLICOSE';
        else if (s.includes("tipo = 'pressao'")) tipo = 'PRESSAO';
      }
      const dias = extractDias(s);
      const corte = new Date(Date.now() - dias * 86400000);
      const isAlerta = s.includes("status in");
      const limit = parseInt((s.match(/fetch first (\d+) rows/i) || [])[1]) || 999;

      const rows = store.registros_saude
        .filter(r => {
          if (r.USUARIO_ID !== uid) return false;
          if (tipo && r.TIPO !== tipo) return false;
          if (isAlerta && !['ALTA', 'CRITICA'].includes(r.STATUS)) return false;
          if (new Date(r.DATA_HORA) < corte) return false;
          return true;
        })
        .sort((a, b) => new Date(b.DATA_HORA) - new Date(a.DATA_HORA))
        .slice(0, limit)
        .map(r => ({ ID: r.ID, TIPO: r.TIPO, VALOR: r.VALOR, DATA_HORA: r.DATA_HORA, STATUS: r.STATUS, FONTE: r.FONTE }));

      return { rows, outBinds: {} };
    }
    if (op === 'INSERT') {
      const id = nextId('registros_saude');
      store.registros_saude.push({
        ID: id, USUARIO_ID: uid, TIPO: params.tp,
        VALOR: params.valor, STATUS: params.st,
        FONTE: s.includes("'chat'") ? 'CHAT' : 'MANUAL',
        DATA_HORA: new Date(),
      });
      const outKey = detectOutKey(params);
      return { rows: [], outBinds: outKey ? { [outKey]: [id] } : {} };
    }
  }

  // ── medicamentos ──
  if (s.includes('medicamentos') && !s.includes('medicamentos_log')) {
    if (op === 'SELECT') {
      const rows = store.medicamentos
        .filter(m => m.USUARIO_ID === uid && m.ATIVO === 1)
        .sort((a, b) => a.NOME.localeCompare(b.NOME))
        .map(m => ({ ID: m.ID, NOME: m.NOME, DOSAGEM: m.DOSAGEM, HORARIOS: m.HORARIOS, ATIVO: m.ATIVO, CRIADO_EM: m.CRIADO_EM }));
      return { rows, outBinds: {} };
    }
    if (op === 'INSERT') {
      const id = nextId('medicamentos');
      store.medicamentos.push({
        ID: id, USUARIO_ID: uid, NOME: params.nome,
        DOSAGEM: params.dosagem || null, HORARIOS: params.horarios,
        ATIVO: 1, CRIADO_EM: new Date(),
      });
      const outKey = detectOutKey(params);
      return { rows: [], outBinds: outKey ? { [outKey]: [id] } : {} };
    }
    if (op === 'UPDATE') {
      const m = store.medicamentos.find(x => x.ID === params.med_id && x.USUARIO_ID === uid);
      if (m) {
        if (params.nome !== undefined)     m.NOME     = params.nome;
        if (params.dosagem !== undefined)  m.DOSAGEM  = params.dosagem;
        if (params.horarios !== undefined) m.HORARIOS = params.horarios;
        if (params.ativo !== undefined)    m.ATIVO    = params.ativo;
        if (s.includes('ativo = 0') && params.med_id) m.ATIVO = 0;
      }
      return { rows: [], outBinds: {} };
    }
  }

  // ── medicamentos_log ──
  if (s.includes('medicamentos_log')) {
    if (op === 'SELECT') {
      const rows = store.medicamentos_log.filter(l =>
        l.MEDICAMENTO_ID === params.mid && l.USUARIO_ID === uid &&
        l.HORARIO_PREVISTO === params.hp && new Date(l.DATA_HORA) >= hoje()
      ).map(l => ({ ID: l.ID }));
      return { rows, outBinds: {} };
    }
    if (op === 'INSERT') {
      const id = nextId('medicamentos_log');
      store.medicamentos_log.push({
        ID: id, MEDICAMENTO_ID: params.mid, USUARIO_ID: uid,
        HORARIO_PREVISTO: params.hp, TOMADO: params.tom,
        DATA_HORA: new Date(),
      });
      return { rows: [], outBinds: {} };
    }
    if (op === 'UPDATE') {
      const entry = store.medicamentos_log.find(l => l.ID === params.log_id);
      if (entry) {
        entry.TOMADO    = params.tom;
        entry.DATA_HORA = new Date();
      }
      return { rows: [], outBinds: {} };
    }
  }

  return { rows: [], outBinds: {} };
}

function getMockConnection() {
  return {
    execute(sql, params) {
      const s = sql.replace(/\s+/g, ' ').toLowerCase().trim();
      return Promise.resolve(mockExecute(s, params));
    },
    close() { return Promise.resolve(); },
  };
}

module.exports = { getMockConnection };
