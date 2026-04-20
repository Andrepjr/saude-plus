const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  gerarCodigoVinculo,
  vincularPaciente,
  getPacientesVinculados,
  desvincularPaciente,
} = require('../controllers/vinculosController');

router.use(authMiddleware);

router.post('/gerar-codigo',       gerarCodigoVinculo);
router.post('/vincular',           vincularPaciente);
router.get('/pacientes',           getPacientesVinculados);
router.delete('/pacientes/:pacienteId', desvincularPaciente);

module.exports = router;
