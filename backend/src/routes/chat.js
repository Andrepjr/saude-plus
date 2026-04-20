const router = require('express').Router();
const { sendMessage, getHistorico } = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.post('/message', sendMessage);
router.get('/historico', getHistorico);

module.exports = router;
