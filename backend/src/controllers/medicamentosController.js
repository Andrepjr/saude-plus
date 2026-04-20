const { getConnection } = require('../config/database');
const oracledb = require('oracledb');

async function getMedicamentos(req, res, next) {
  const usuarioId = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT id, nome, dosagem, horarios, ativo, criado_em
       FROM medicamentos WHERE usuario_id = :u_id AND ativo = 1 ORDER BY nome`,
      { u_id: usuarioId }
    );
    res.json(result.rows.map(r => ({
      id: r.ID,
      nome: r.NOME,
      dosagem: r.DOSAGEM,
      horarios: JSON.parse(r.HORARIOS || '[]'),
      ativo: r.ATIVO === 1,
      criadoEm: r.CRIADO_EM,
    })));
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function createMedicamento(req, res, next) {
  const usuarioId = req.user.id;
  const { nome, dosagem, horarios } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO medicamentos (usuario_id, nome, dosagem, horarios)
       VALUES (:u_id, :nome, :dosagem, :horarios)
       RETURNING id INTO :out_id`,
      {
        u_id: usuarioId,
        nome,
        dosagem: dosagem || null,
        horarios: JSON.stringify(horarios || []),
        out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    res.status(201).json({ id: result.outBinds.out_id[0], nome, dosagem, horarios });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function updateMedicamento(req, res, next) {
  const usuarioId = req.user.id;
  const { id } = req.params;
  const { nome, dosagem, horarios, ativo } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE medicamentos SET nome = :nome, dosagem = :dosagem,
       horarios = :horarios, ativo = :ativo
       WHERE id = :med_id AND usuario_id = :u_id`,
      {
        nome,
        dosagem: dosagem || null,
        horarios: JSON.stringify(horarios || []),
        ativo: ativo === false ? 0 : 1,
        med_id: parseInt(id),
        u_id: usuarioId,
      }
    );
    res.json({ message: 'Medicamento atualizado.' });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function deleteMedicamento(req, res, next) {
  const usuarioId = req.user.id;
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE medicamentos SET ativo = 0 WHERE id = :med_id AND usuario_id = :u_id`,
      { med_id: parseInt(id), u_id: usuarioId }
    );
    res.json({ message: 'Medicamento removido.' });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function getStatusDia(req, res, next) {
  const usuarioId = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT m.id, m.nome, m.dosagem, m.horarios,
              NVL(ml.tomado, 0) AS tomado, ml.horario_previsto, ml.data_hora
       FROM medicamentos m
       LEFT JOIN medicamentos_log ml
         ON ml.medicamento_id = m.id
         AND TRUNC(ml.data_hora) = TRUNC(SYSDATE)
       WHERE m.usuario_id = :u_id AND m.ativo = 1
       ORDER BY m.nome`,
      { u_id: usuarioId }
    );
    res.json(result.rows.map(r => ({
      id: r.ID,
      nome: r.NOME,
      dosagem: r.DOSAGEM,
      horarios: JSON.parse(r.HORARIOS || '[]'),
      tomado: r.TOMADO === 1,
      horarioPrevisto: r.HORARIO_PREVISTO,
      dataHora: r.DATA_HORA,
    })));
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function registrarTomada(req, res, next) {
  const usuarioId = req.user.id;
  const { medicamentoId, horarioPrevisto, tomado } = req.body;
  let conn;
  try {
    conn = await getConnection();

    const check = await conn.execute(
      `SELECT id FROM medicamentos_log
       WHERE medicamento_id = :mid AND usuario_id = :u_id
       AND TRUNC(data_hora) = TRUNC(SYSDATE)
       AND horario_previsto = :hp`,
      { mid: medicamentoId, u_id: usuarioId, hp: horarioPrevisto }
    );

    if (check.rows.length > 0) {
      await conn.execute(
        `UPDATE medicamentos_log SET tomado = :tom, data_hora = SYSTIMESTAMP
         WHERE id = :log_id`,
        { tom: tomado ? 1 : 0, log_id: check.rows[0].ID }
      );
    } else {
      await conn.execute(
        `INSERT INTO medicamentos_log (medicamento_id, usuario_id, horario_previsto, tomado)
         VALUES (:mid, :u_id, :hp, :tom)`,
        { mid: medicamentoId, u_id: usuarioId, hp: horarioPrevisto, tom: tomado ? 1 : 0 }
      );
    }

    res.json({ message: 'Registro atualizado.' });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  getMedicamentos,
  createMedicamento,
  updateMedicamento,
  deleteMedicamento,
  getStatusDia,
  registrarTomada,
};
