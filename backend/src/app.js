require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const saudeRoutes = require('./routes/saude');
const medicamentosRoutes = require('./routes/medicamentos');
const alertasRoutes = require('./routes/alertas');
const vinculosRoutes = require('./routes/vinculos');
const ttsRoutes      = require('./routes/tts');

const app = express();

const allowedOrigins = [
  'https://saude-plus-alpha.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Render health checks, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin not allowed — ${origin}`));
  },
  credentials: true,
}));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} — origin: ${req.headers.origin || '(none)'}`);
  next();
});

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/saude', saudeRoutes);
app.use('/api/medicamentos', medicamentosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/vinculos', vinculosRoutes);
app.use('/api/tts',     ttsRoutes);

app.use(errorHandler);

module.exports = app;
