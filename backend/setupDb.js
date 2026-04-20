/**
 * Cria as tabelas no Oracle Autonomous Database e insere os dois usuários de teste.
 * Execute uma vez: node setupDb.js
 */
require('dotenv').config();
const oracledb  = require('oracledb');
const bcrypt    = require('bcryptjs');
const path      = require('path');

const walletDir = path.resolve(__dirname, process.env.DB_WALLET_LOCATION || 'wallet');

const DDL = [
  `CREATE TABLE usuarios (
    id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome       VARCHAR2(100)  NOT NULL,
    perfil     VARCHAR2(20)   NOT NULL CHECK (perfil IN ('PACIENTE', 'CUIDADOR')),
    email      VARCHAR2(100)  UNIQUE NOT NULL,
    senha      VARCHAR2(255)  NOT NULL,
    criado_em  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE medicamentos (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  NUMBER        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome        VARCHAR2(100) NOT NULL,
    dosagem     VARCHAR2(50),
    horarios    VARCHAR2(500),
    ativo       NUMBER(1)     DEFAULT 1 CHECK (ativo IN (0, 1)),
    criado_em   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE registros_saude (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  NUMBER       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo        VARCHAR2(20) NOT NULL CHECK (tipo IN ('GLICOSE', 'PRESSAO')),
    valor       VARCHAR2(50) NOT NULL,
    data_hora   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    status      VARCHAR2(20) DEFAULT 'NORMAL' CHECK (status IN ('NORMAL', 'ALTA', 'BAIXA', 'CRITICA')),
    fonte       VARCHAR2(20) DEFAULT 'CHAT' CHECK (fonte IN ('CHAT', 'MANUAL'))
  )`,
  `CREATE TABLE medicamentos_log (
    id               NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    medicamento_id   NUMBER    NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    usuario_id       NUMBER    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_hora        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    horario_previsto VARCHAR2(10),
    tomado           NUMBER(1) DEFAULT 0 CHECK (tomado IN (0, 1))
  )`,
  `CREATE TABLE chat_historico (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  NUMBER        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    role        VARCHAR2(20)  NOT NULL CHECK (role IN ('user', 'assistant')),
    conteudo    CLOB          NOT NULL,
    criado_em   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX idx_registros_usuario ON registros_saude(usuario_id, data_hora DESC)`,
  `CREATE INDEX idx_med_log_usuario   ON medicamentos_log(usuario_id, data_hora DESC)`,
  `CREATE INDEX idx_chat_usuario      ON chat_historico(usuario_id, criado_em DESC)`,
  `CREATE INDEX idx_med_usuario       ON medicamentos(usuario_id)`,
];

async function run() {
  oracledb.autoCommit = true;
  oracledb.outFormat  = oracledb.OUT_FORMAT_OBJECT;

  console.log('Conectando ao Oracle Autonomous Database...');
  const conn = await oracledb.getConnection({
    user:           process.env.DB_USER,
    password:       process.env.DB_PASSWORD,
    connectString:  process.env.DB_CONNECT_STRING,
    configDir:      walletDir,
    walletLocation: walletDir,
    walletPassword: process.env.DB_WALLET_PASSWORD,
  });
  console.log('✅ Conectado.\n');

  // ── DDL ──────────────────────────────────────────────────────────────────
  for (const stmt of DDL) {
    const label = stmt.trim().split('\n')[0].substring(0, 60);
    try {
      await conn.execute(stmt);
      console.log(`✅ ${label}`);
    } catch (err) {
      if (err.errorNum === 955 || err.errorNum === 1408) {
        // 955 = name already used by an existing object
        // 1408 = index already exists
        console.log(`ℹ️  Já existe: ${label}`);
      } else {
        console.error(`❌ Erro em: ${label}`);
        throw err;
      }
    }
  }

  // ── Seed: dois usuários de teste ─────────────────────────────────────────
  console.log('\nVerificando usuários de teste...');
  const senha = bcrypt.hashSync('123456', 10);

  const usuarios = [
    { nome: 'Maria Silva (Paciente)', email: 'paciente@teste.com', perfil: 'PACIENTE' },
    { nome: 'João Cuidador',          email: 'cuidador@teste.com',  perfil: 'CUIDADOR'  },
  ];

  for (const u of usuarios) {
    const exists = await conn.execute(
      `SELECT id FROM usuarios WHERE email = :email`,
      { email: u.email }
    );
    if (exists.rows.length > 0) {
      console.log(`ℹ️  Usuário já existe: ${u.email}`);
    } else {
      await conn.execute(
        `INSERT INTO usuarios (nome, email, senha, perfil) VALUES (:nome, :email, :senha, :perfil)`,
        { nome: u.nome, email: u.email, senha, perfil: u.perfil }
      );
      console.log(`✅ Usuário criado: ${u.email}`);
    }
  }

  await conn.close();
  console.log('\n🎉 Setup concluído! Banco pronto para uso.');
}

run().catch(err => {
  console.error('\n❌ Falha no setup:', err.message || err);
  process.exit(1);
});
