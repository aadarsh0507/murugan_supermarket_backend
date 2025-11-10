import express from 'express';
import {
  register,
  login,
  logout,
  registerValidation,
  loginValidation,
  getProfile
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (in production, you might want to restrict this)
router.post('/register', registerValidation, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, login);

router.get('/me', authenticate, getProfile);
router.post('/logout', authenticate, logout);

// Additional auth endpoints are temporarily disabled to focus on login/register testing.

export default router;
