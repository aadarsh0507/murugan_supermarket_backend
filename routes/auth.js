import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOTP,
  resetPassword,
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  verifyOTPValidation,
  resetPasswordValidation
} from '../controllers/authController.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (in production, you might want to restrict this)
router.post('/register', registerValidation, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, login);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticate, logout);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, profileUpdateValidation, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticate, changePasswordValidation, changePassword);

// @route   POST /api/auth/forgot-password
// @desc    Send OTP to email for password reset
// @access  Public
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post('/verify-otp', verifyOTPValidation, verifyOTP);

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', resetPasswordValidation, resetPassword);

export default router;
