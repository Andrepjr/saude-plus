/**
 * Cria as tabelas vinculos_codigo e vinculos.
 * Execute uma vez: node setupVinculos.js
 */
require('dotenv').config();
const oracledb = require('oracledb');
const path     = require('path');

const walletDir = path.resolve(__dirname, process.env.DB_WALLET_LOCATION || 'wallet');

const DDL = [
  `CREATE TABLE vinculos_codigo (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    paciente_id NUMBER       NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo      VARCHAR2(6)  NOT NULL,
    expira_em   TIMESTAMP    NOT NULL,
    criado_em   TIMESTAMP    DEFAULT SYSTIMESTAMP
  )`,
  `CREATE TABLE vinculos (
    id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cuidador_id   NUMBER    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    paciente_id   NUMBER    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_vinculo  TIMESTAMP DEFAULT SYSTIMESTAMP,
    CONSTRAINT uq_vinculo UNIQUE (cuidador_id, paciente_id)
  )`,
  `CREATE INDEX idx_vinculos_codigo   ON vinculos_codigo(codigo, expira_em)`,
  `CREATE INDEX idx_vinculos_cuidador ON vinculos(cuidador_id)`,
  `CREATE INDEX idx_vinculos_paciente ON vinculos(paciente_id)`,
];

async function run() {
  oracledb.autoCommit = true;
  oracledb.outFormat  = oracledb.OUT_FORMAT_OBJECT;

  console.log('Conectando...');
  const conn = await oracledb.getConnection({
    user:           process.env.DB_USER,
    password:       process.env.DB_PASSWORD,
    connectString:  process.env.DB_CONNECT_STRING,
    configDir:      walletDir,
    walletLocation: walletDir,
    walletPassword: process.env.DB_WALLET_PASSWORD,
  });
  console.log('✅ Conectado.\n');

  for (const stmt of DDL) {
    const label = stmt.trim().split('\n')[0].substring(0, 60);
    try {
      await conn.execute(stmt);
      console.log(`✅ ${label}`);
    } catch (err) {
      if (err.errorNum === 955 || err.errorNum === 1408) {
        console.log(`ℹ️  Já existe: ${label}`);
      } else {
        console.error(`❌ Erro: ${label}`);
        throw err;
      }
    }
  }

  await conn.close();
  console.log('\n🎉 Tabelas de vínculos criadas!');
}

run().catch(err => {
  console.error('\n❌ Falha:', err.message || err);
  process.exit(1);
});
