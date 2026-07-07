const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  updatePassword,
  uploadAvatar
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validation');
const upload = require('../middleware/upload');

const router = express.Router();

// Brute-force rate limiting for login endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per 15 mins
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', validateSchema(schemas.register), register);
router.post('/login', loginLimiter, validateSchema(schemas.login), login);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);
router.post('/forgot-password', validateSchema(schemas.forgotPassword), forgotPassword);
router.post('/reset-password', validateSchema(schemas.resetPassword), resetPassword);
router.get('/me', protect, getMe);

// Settings & profile update routes
router.patch('/update-profile', protect, updateProfile);
router.patch('/update-password', protect, updatePassword);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
