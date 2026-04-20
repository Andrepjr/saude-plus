/**
 * Resolve o usuario_id alvo para queries de cuidador.
 * Se o requisitante for CUIDADOR e passar pacienteId (body ou query),
 * valida o vínculo e retorna o ID do paciente.
 * Caso contrário, retorna req.user.id.
 */
async function resolveTargetId(req, conn) {
  const raw = req.body?.pacienteId ?? req.query?.pacienteId;
  if (raw != null && req.user.perfil === 'CUIDADOR') {
    const pid = parseInt(raw);
    if (isNaN(pid)) {
      const err = new Error('pacienteId inválido.');
      err.status = 400;
      throw err;
    }
    const check = await conn.execute(
      `SELECT id FROM vinculos WHERE cuidador_id = :cid AND paciente_id = :pid`,
      { cid: req.user.id, pid }
    );
    if (check.rows.length === 0) {
      const err = new Error('Vínculo não encontrado.');
      err.status = 403;
      throw err;
    }
    return pid;
  }
  return req.user.id;
}

module.exports = { resolveTargetId };
