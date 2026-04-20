const router = require('express').Router();
const { getRegistros, createRegistro, getUltimos } = require('../controllers/saudeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.get('/', getRegistros);
router.get('/ultimos', getUltimos);
router.post('/', createRegistro);

module.exports = router;
