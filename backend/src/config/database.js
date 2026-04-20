const oracledb = require('oracledb');
const path = require('path');

let pool = null;

function walletDir() {
  // DB_WALLET_LOCATION is relative to the backend root (two levels up from this file)
  const base = path.resolve(__dirname, '../../');
  return path.resolve(base, process.env.DB_WALLET_LOCATION || 'wallet');
}

async function initPool() {
  if (pool) return;

  oracledb.autoCommit = true;
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  oracledb.fetchAsString = [oracledb.CLOB];  // return CLOB columns as plain strings

  const dir = walletDir();

  pool = await oracledb.createPool({
    user:           process.env.DB_USER,
    password:       process.env.DB_PASSWORD,
    connectString:  process.env.DB_CONNECT_STRING,
    configDir:      dir,   // where tnsnames.ora lives
    walletLocation: dir,   // where ewallet.pem lives (mTLS)
    walletPassword: process.env.DB_WALLET_PASSWORD,
    poolMin:        2,
    poolMax:        10,
    poolIncrement:  1,
  });

  console.log('✅ Oracle connection pool created.');
}

async function getConnection() {
  if (!pool) await initPool();
  return pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.close(0);
    pool = null;
  }
}

module.exports = { initPool, getConnection, closePool };
