const { getConnection } = require('../config/database');

function gerarCodigo6Digitos() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function gerarCodigoVinculo(req, res, next) {
  if (req.user.perfil !== 'PACIENTE')
    return res.status(403).json({ error: 'Apenas pacientes podem gerar códigos de vínculo.' });

  const pacienteId = req.user.id;
  let conn;
  try {
    conn = await getConnection();

    // Expira imediatamente todos os códigos anteriores deste paciente
    await conn.execute(
      `UPDATE vinculos_codigo SET expira_em = SYSTIMESTAMP WHERE paciente_id = :pid`,
      { pid: pacienteId }
    );

    const codigo = gerarCodigo6Digitos();
    await conn.execute(
      `INSERT INTO vinculos_codigo (paciente_id, codigo, expira_em)
       VALUES (:pid, :cod, SYSTIMESTAMP + INTERVAL '10' MINUTE)`,
      { pid: pacienteId, cod: codigo }
    );

    res.json({ codigo, expiraEm: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function vincularPaciente(req, res, next) {
  if (req.user.perfil !== 'CUIDADOR')
    return res.status(403).json({ error: 'Apenas cuidadores podem vincular pacientes.' });

  const cuidadorId = req.user.id;
  const { codigo } = req.body;
  if (!codigo) return res.status(400).json({ error: 'Código obrigatório.' });

  let conn;
  try {
    conn = await getConnection();

    // Busca código válido e não expirado
    const codeResult = await conn.execute(
      `SELECT vc.id, vc.paciente_id, u.nome, u.email
       FROM vinculos_codigo vc
       JOIN usuarios u ON u.id = vc.paciente_id
       WHERE vc.codigo = :cod
       AND vc.expira_em > SYSTIMESTAMP`,
      { cod: codigo.trim() }
    );

    if (codeResult.rows.length === 0)
      return res.status(400).json({ error: 'Código inválido ou expirado. Peça ao paciente um novo código.' });

    const row = codeResult.rows[0];
    const pacienteId   = row.PACIENTE_ID;
    const pacienteNome = String(row.NOME);

    if (pacienteId === cuidadorId)
      return res.status(400).json({ error: 'Você não pode se vincular a si mesmo.' });

    // Cria vínculo (ignora se já existir)
    const exists = await conn.execute(
      `SELECT id FROM vinculos WHERE cuidador_id = :cid AND paciente_id = :pid`,
      { cid: cuidadorId, pid: pacienteId }
    );

    if (exists.rows.length === 0) {
      await conn.execute(
        `INSERT INTO vinculos (cuidador_id, paciente_id) VALUES (:cid, :pid)`,
        { cid: cuidadorId, pid: pacienteId }
      );
    }

    // Expira o código (uso único)
    await conn.execute(
      `UPDATE vinculos_codigo SET expira_em = SYSTIMESTAMP WHERE id = :vid`,
      { vid: row.ID }
    );

    res.json({
      pacienteId,
      pacienteNome,
      pacienteEmail: String(row.EMAIL),
      message: `Vinculado com sucesso a ${pacienteNome}!`,
      jaVinculado: exists.rows.length > 0,
    });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function getPacientesVinculados(req, res, next) {
  if (req.user.perfil !== 'CUIDADOR')
    return res.status(403).json({ error: 'Apenas cuidadores podem listar pacientes vinculados.' });

  const cuidadorId = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT u.id, u.nome, u.email, v.data_vinculo
       FROM vinculos v
       JOIN usuarios u ON u.id = v.paciente_id
       WHERE v.cuidador_id = :cid
       ORDER BY v.data_vinculo`,
      { cid: cuidadorId }
    );
    res.json(result.rows.map(r => ({
      id: r.ID,
      nome: String(r.NOME),
      email: String(r.EMAIL),
      dataVinculo: r.DATA_VINCULO,
    })));
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function desvincularPaciente(req, res, next) {
  if (req.user.perfil !== 'CUIDADOR')
    return res.status(403).json({ error: 'Apenas cuidadores podem desvincular pacientes.' });

  const cuidadorId = req.user.id;
  const pacienteId = parseInt(req.params.pacienteId);
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `DELETE FROM vinculos WHERE cuidador_id = :cid AND paciente_id = :pid`,
      { cid: cuidadorId, pid: pacienteId }
    );
    res.json({ message: 'Vínculo removido.' });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = { gerarCodigoVinculo, vincularPaciente, getPacientesVinculados, desvincularPaciente };
