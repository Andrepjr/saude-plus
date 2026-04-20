const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const validateRegister = [
  body('nome').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('senha').isLength({ min: 6 }),
  body('perfil').isIn(['PACIENTE', 'CUIDADOR', 'paciente', 'cuidador']),
];

router.post('/register', validateRegister, register);
router.post('/login', login);
router.get('/me', authMiddleware, me);

module.exports = router;
