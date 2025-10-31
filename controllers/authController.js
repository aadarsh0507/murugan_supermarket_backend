import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { sendOTPEmail } from '../utils/emailService.js';

// Validation rules
export const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee', 'cashier'])
    .withMessage('Invalid role'),
  body('department')
    .optional()
    .isIn(['management', 'sales', 'inventory', 'billing', 'reports'])
    .withMessage('Invalid department'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street address cannot exceed 100 characters'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('ZIP code cannot exceed 10 characters')
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const profileUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('address.street')
    .optional()
    .trim(),
  body('address.city')
    .optional()
    .trim(),
  body('address.state')
    .optional()
    .trim(),
  body('address.zipCode')
    .optional()
    .trim()
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

export const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
];

export const verifyOTPValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

export const resetPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// @desc    Register a new user
// @access  Public (in production, you might want to restrict this)
export const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, role, department, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || 'employee',
      department: department || 'sales',
      phone,
      address
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @access  Public
export const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, rememberMe } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email })
      .select('+password')
      .populate('selectedStore', 'name code address');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token with different expiry based on remember me
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Remove password from response and ensure selectedStore is populated
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login'
    });
  }
};

// @desc    Logout user (client-side token removal)
// @access  Private
export const logout = async (req, res) => {
  try {
    // In a more sophisticated setup, you might maintain a blacklist of tokens
    // For now, we'll just return success as token removal is handled client-side
    res.json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during logout'
    });
  }
};

// @desc    Get current user profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Update user profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['firstName', 'lastName', 'phone', 'address', 'preferences'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Change user password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while changing password'
    });
  }
};

// @desc    Forgot password - send OTP to email
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    
    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      return res.json({
        status: 'success',
        message: 'If an account with that email exists, an OTP has been sent.'
      });
    }

    // Generate OTP
    const otp = user.generateResetPasswordOTP();
    await user.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (emailResult.success) {
      console.log(`Password reset OTP sent to ${email}: ${otp}`);
      console.log(`OTP expires in 10 minutes`);
      
      res.json({
        status: 'success',
        message: 'If an account with that email exists, an OTP has been sent.',
        // In development, include the OTP for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      });
    } else {
      console.error('Failed to send OTP email:', emailResult.error);
      
      res.json({
        status: 'success',
        message: 'If an account with that email exists, an OTP has been sent.',
        // In development, include the OTP for testing even if email fails
        ...(process.env.NODE_ENV === 'development' && { otp, emailError: emailResult.error })
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while processing forgot password request'
    });
  }
};

// @desc    Verify OTP for password reset
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email or OTP'
      });
    }

    // Verify OTP
    const isOTPValid = user.verifyResetPasswordOTP(otp);
    if (!isOTPValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    // Save the user to clear any expired OTP
    await user.save();

    res.json({
      status: 'success',
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while verifying OTP'
    });
  }
};

// @desc    Reset password with OTP
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp, newPassword } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email or OTP'
      });
    }

    // Verify OTP
    const isOTPValid = user.verifyResetPasswordOTP(otp);
    if (!isOTPValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired OTP'
      });
    }

    // Update password
    user.password = newPassword;
    
    // Clear the OTP after successful password reset
    await user.clearResetPasswordOTP();

    res.json({
      status: 'success',
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while resetting password'
    });
  }
};
