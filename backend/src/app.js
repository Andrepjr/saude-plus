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

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
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
