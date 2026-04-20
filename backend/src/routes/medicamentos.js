const router = require('express').Router();
const {
  getMedicamentos,
  createMedicamento,
  updateMedicamento,
  deleteMedicamento,
  getStatusDia,
  registrarTomada,
} = require('../controllers/medicamentosController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.get('/', getMedicamentos);
router.get('/status-dia', getStatusDia);
router.post('/', createMedicamento);
router.put('/:id', updateMedicamento);
router.delete('/:id', deleteMedicamento);
router.post('/tomada', registrarTomada);

module.exports = router;
