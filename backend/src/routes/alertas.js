const router = require('express').Router();
const { getAlertas, getAnaliseIA } = require('../controllers/alertasController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.get('/', getAlertas);
router.get('/analise-ia', getAnaliseIA);

module.exports = router;
