const { getConnection } = require('../config/database');

async function getRegistros(req, res, next) {
  const usuarioId = req.user.id;
  const { tipo, dias = 7 } = req.query;
  let conn;
  try {
    conn = await getConnection();
    const params = { u_id: usuarioId };
    let sql = `SELECT id, tipo, valor, data_hora, status, fonte
           FROM registros_saude
           WHERE usuario_id = :u_id
           AND data_hora >= SYSTIMESTAMP - ${parseInt(dias)}
           ORDER BY data_hora DESC`;

    if (tipo) {
      sql = `SELECT id, tipo, valor, data_hora, status, fonte
             FROM registros_saude
             WHERE usuario_id = :u_id
             AND tipo = :tp
             AND data_hora >= SYSTIMESTAMP - ${parseInt(dias)}
             ORDER BY data_hora DESC`;
      params.tp = tipo.toUpperCase();
    }

    const result = await conn.execute(sql, params);
    res.json(result.rows.map(r => ({
      id: r.ID,
      tipo: r.TIPO,
      valor: r.VALOR,
      dataHora: r.DATA_HORA,
      status: r.STATUS,
      fonte: r.FONTE,
    })));
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function createRegistro(req, res, next) {
  const usuarioId = req.user.id;
  const { tipo, valor } = req.body;
  let conn;
  try {
    conn = await getConnection();

    let status = 'NORMAL';
    if (tipo === 'GLICOSE') {
      const v = parseFloat(valor);
      if (v < 70) status = 'BAIXA';
      else if (v <= 99) status = 'NORMAL';
      else if (v <= 125) status = 'ALTA';
      else status = 'CRITICA';
    } else if (tipo === 'PRESSAO') {
      const parts = valor.split('/');
      const sis = parseInt(parts[0]);
      const dia = parseInt(parts[1]);
      if (sis >= 180 || dia >= 120) status = 'CRITICA';
      else if (sis >= 140 || dia >= 90) status = 'ALTA';
      else if (sis < 90 || dia < 60) status = 'BAIXA';
    }

    const result = await conn.execute(
      `INSERT INTO registros_saude (usuario_id, tipo, valor, status, fonte)
       VALUES (:u_id, :tp, :valor, :st, 'MANUAL')
       RETURNING id INTO :out_id`,
      {
        u_id: usuarioId,
        tp: tipo.toUpperCase(),
        valor,
        st: status,
        out_id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER },
      }
    );
    res.status(201).json({ id: result.outBinds.out_id[0], tipo, valor, status });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function getUltimos(req, res, next) {
  const usuarioId = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT tipo, valor, data_hora, status
       FROM (
         SELECT tipo, valor, data_hora, status,
                ROW_NUMBER() OVER (PARTITION BY tipo ORDER BY data_hora DESC) AS rn
         FROM registros_saude WHERE usuario_id = :u_id
       ) WHERE rn = 1`,
      { u_id: usuarioId }
    );
    const data = {};
    result.rows.forEach(r => {
      data[r.TIPO] = { valor: r.VALOR, dataHora: r.DATA_HORA, status: r.STATUS };
    });
    res.json(data);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = { getRegistros, createRegistro, getUltimos };
