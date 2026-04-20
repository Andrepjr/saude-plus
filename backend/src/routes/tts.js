const router = require('express').Router();
const { textToSpeech } = require('../controllers/ttsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.post('/', textToSpeech);

module.exports = router;
