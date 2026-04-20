require('dotenv').config();
const app = require('./src/app');
const { initPool } = require('./src/config/database');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await initPool();
    app.listen(PORT, () => {
      console.log(`Saúde+ backend rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error('Falha ao iniciar o servidor:', err);
    process.exit(1);
  }
}

start();
