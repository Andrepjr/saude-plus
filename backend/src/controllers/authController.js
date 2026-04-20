const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');

async function register(req, res, next) {
  const { nome, email, senha, perfil } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const hash = await bcrypt.hash(senha, 10);
    const result = await conn.execute(
      `INSERT INTO usuarios (nome, email, senha, perfil)
       VALUES (:nome, :email, :senha, :perfil)
       RETURNING id INTO :out_id`,
      { nome, email, senha: hash, perfil: perfil.toUpperCase(), out_id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER } }
    );
    const id = result.outBinds.out_id[0];
    const token = jwt.sign({ id, nome, email, perfil: perfil.toUpperCase() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id, nome, email, perfil: perfil.toUpperCase() } });
  } catch (err) {
    if (err.errorNum === 1) return res.status(409).json({ error: 'E-mail já cadastrado.' });
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function login(req, res, next) {
  const { email, senha } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      'SELECT id, nome, email, senha, perfil FROM usuarios WHERE email = :eml',
      { eml: email }
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const valid = await bcrypt.compare(senha, user.SENHA);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign(
      { id: user.ID, nome: user.NOME, email: user.EMAIL, perfil: user.PERFIL },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.ID, nome: user.NOME, email: user.EMAIL, perfil: user.PERFIL } });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };
