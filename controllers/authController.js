import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  findUserByEmail,
  createUser,
  updateUserLastLogin
} from '../repositories/userRepository.js';
import { generateToken } from '../middleware/auth.js';

// Validation rules
export const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .bail()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
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
    .withMessage('ZIP code cannot exceed 10 characters'),
  body('agreeToTerms')
    .custom((value) => value === true || value === 'true')
    .withMessage('You must agree to the terms and conditions')
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

// export const profileUpdateValidation = [
//   body('firstName')
//     .optional()
//     .trim()
//     .isLength({ max: 50 })
//     .withMessage('First name cannot exceed 50 characters'),
//   body('lastName')
//     .optional()
//     .trim()
//     .isLength({ max: 50 })
//     .withMessage('Last name cannot exceed 50 characters'),
//   body('phone')
//     .optional()
//     .matches(/^[\+]?[1-9][\d]{0,15}$/)
//     .withMessage('Please enter a valid phone number'),
//   body('address.street')
//     .optional()
//     .trim(),
//   body('address.city')
//     .optional()
//     .trim(),
//   body('address.state')
//     .optional()
//     .trim(),
//   body('address.zipCode')
//     .optional()
//     .trim()
// ];
//
// export const changePasswordValidation = [
//   body('currentPassword')
//     .notEmpty()
//     .withMessage('Current password is required'),
//   body('newPassword')
//     .isLength({ min: 6 })
//     .withMessage('New password must be at least 6 characters long')
// ];
//
// export const forgotPasswordValidation = [
//   body('email')
//     .isEmail()
//     .withMessage('Please enter a valid email')
//     .normalizeEmail()
// ];
//
// export const verifyOTPValidation = [
//   body('email')
//     .isEmail()
//     .withMessage('Please enter a valid email')
//     .normalizeEmail(),
//   body('otp')
//     .isLength({ min: 6, max: 6 })
//     .withMessage('OTP must be exactly 6 digits')
//     .isNumeric()
//     .withMessage('OTP must contain only numbers')
// ];
//
// export const resetPasswordValidation = [
//   body('email')
//     .isEmail()
//     .withMessage('Please enter a valid email')
//     .normalizeEmail(),
//   body('otp')
//     .isLength({ min: 6, max: 6 })
//     .withMessage('OTP must be exactly 6 digits')
//     .isNumeric()
//     .withMessage('OTP must contain only numbers'),
//   body('newPassword')
//     .isLength({ min: 6 })
//     .withMessage('New password must be at least 6 characters long')
// ];
//
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (candidate, hash) => bcrypt.compare(candidate, hash);

const sanitizeUserResponse = (user) => {
  if (!user) return null;
  return {
    ...user,
    passwordHash: undefined,
    password_hash: undefined,
    resetPasswordOTP: undefined,
    reset_password_otp: undefined,
    resetPasswordOtpExpiresAt: undefined,
    reset_password_otp_expires_at: undefined
  };
};

// @desc    Register a new user
// @access  Public (in production, you might want to restrict this)
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      phone,
      address,
      agreeToTerms
    } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    if (agreeToTerms !== true && agreeToTerms !== 'true') {
      return res.status(400).json({
        status: 'error',
        message: 'You must agree to the terms and conditions'
      });
    }

    const hashedPassword = await hashPassword(password);

    const sanitizedAddress = address
      ? {
        street: address.street?.trim() || null,
        city: address.city?.trim() || null,
        state: address.state?.trim() || null,
        zipCode: address.zipCode?.trim() || null,
        country: address.country?.trim() || undefined
      }
      : undefined;

    const user = await createUser({
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      email: normalizedEmail,
      username: normalizedEmail,
      passwordHash: hashedPassword,
      role: role || 'employee',
      department: department || 'sales',
      phone: phone?.trim() || null,
      address: sanitizedAddress,
      createdBy: null
    });

    const token = generateToken(user.id);
    const safeUser = sanitizeUserResponse(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error?.code === 'ER_DUP_ENTRY' || error?.code === 'EMAIL_IN_USE') {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, rememberMe } = req.body;

    const user = await findUserByEmail(email?.trim().toLowerCase(), { includePassword: true });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    await updateUserLastLogin(user.id);

    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const safeUser = sanitizeUserResponse(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: safeUser,
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

// @desc    Logout user
// @access  Private
export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
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
//
// @desc    Get current user profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.user._id);
    res.json({
      status: 'success',
      data: {
        user: sanitizeUserResponse(user)
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
//
// @desc    Update user profile
// @access  Private
// export const updateProfile = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }
//
//     const allowedUpdates = ['firstName', 'lastName', 'phone', 'address', 'preferences'];
//     const updates = {};
//
//     Object.keys(req.body).forEach((key) => {
//       if (allowedUpdates.includes(key)) {
//         updates[key] = req.body[key];
//       }
//     });
//
//     const updatedUser = await updateUser(req.user._id, updates);
//
//     res.json({
//       status: 'success',
//       message: 'Profile updated successfully',
//       data: {
//         user: updatedUser
//       }
//     });
//   } catch (error) {
//     console.error('Profile update error:', error);
//     if (error.code === 'EMAIL_IN_USE' || error.code === 'USERNAME_IN_USE') {
//       return res.status(400).json({
//         status: 'error',
//         message: error.message
//       });
//     }
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while updating profile'
//     });
//   }
// };
//
// @desc    Change user password
// @access  Private
// export const changePassword = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }
//
//     const { currentPassword, newPassword } = req.body;
//
//     const user = await findUserByEmail(req.user.email, { includePassword: true });
//
//     if (!user) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'User not found'
//       });
//     }
//
//     const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
//     if (!isCurrentPasswordValid) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Current password is incorrect'
//       });
//     }
//
//     const hashedPassword = await hashPassword(newPassword);
//     await updateUserPassword(user.id, hashedPassword);
//
//     res.json({
//       status: 'success',
//       message: 'Password changed successfully'
//     });
//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while changing password'
//     });
//   }
// };
//
// @desc    Forgot password - send OTP to email
// @access  Public
// export const forgotPassword = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }
//
//     const { email } = req.body;
//
//     const user = await findUserByEmail(email?.trim().toLowerCase());
//
//     if (!user) {
//       return res.json({
//         status: 'success',
//         message: 'If an account with that email exists, an OTP has been sent.'
//       });
//     }
//
//     const otp = crypto.randomInt(100000, 999999).toString();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
//
//     await saveResetPasswordOTP(user.id, otp, expiresAt);
//
//     const emailResult = await sendOTPEmail(email, otp);
//
//     if (emailResult.success) {
//       console.log(`Password reset OTP sent to ${email}: ${otp}`);
//       console.log(`OTP expires in 10 minutes`);
//
//       res.json({
//         status: 'success',
//         message: 'If an account with that email exists, an OTP has been sent.',
//         ...(process.env.NODE_ENV === 'development' && { otp })
//       });
//     } else {
//       console.error('Failed to send OTP email:', emailResult.error);
//
//       res.json({
//         status: 'success',
//         message: 'If an account with that email exists, an OTP has been sent.',
//         ...(process.env.NODE_ENV === 'development' && { otp, emailError: emailResult.error })
//       });
//     }
//   } catch (error) {
//     console.error('Forgot password error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while processing forgot password request'
//     });
//   }
// };
//
// @desc    Verify OTP for password reset
// @access  Public
// export const verifyOTP = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }
//
//     const { email, otp } = req.body;
//
//     const user = await findUserByEmail(email?.trim().toLowerCase());
//     if (!user) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid email or OTP'
//       });
//     }
//
//     const isOTPValid = await verifyOTPForUser(user.id, otp);
//     if (!isOTPValid) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid or expired OTP'
//       });
//     }
//
//     await clearResetPasswordOTP(user.id);
//
//     res.json({
//       status: 'success',
//       message: 'OTP verified successfully'
//     });
//   } catch (error) {
//     console.error('Verify OTP error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while verifying OTP'
//     });
//   }
// };
//
// @desc    Reset password with OTP
// @access  Public
// export const resetPassword = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }
//
//     const { email, otp, newPassword } = req.body;
//
//     const user = await findUserByEmail(email?.trim().toLowerCase(), { includePassword: true });
//     if (!user) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid email or OTP'
//       });
//     }
//
//     const isOTPValid = await verifyOTPForUser(user.id, otp);
//     if (!isOTPValid) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid or expired OTP'
//       });
//     }
//
//     const hashedPassword = await hashPassword(newPassword);
//     await updateUserPassword(user.id, hashedPassword);
//     await clearResetPasswordOTP(user.id);
//
//     res.json({
//       status: 'success',
//       message: 'Password reset successfully'
//     });
//   } catch (error) {
//     console.error('Reset password error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while resetting password'
//     });
//   }
// };
//