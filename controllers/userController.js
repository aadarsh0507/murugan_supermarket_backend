// Temporarily commented out to isolate login and register modules.
// Original implementation preserved below for future reactivation.

// import { body, validationResult, query as queryValidator } from 'express-validator';
// import bcrypt from 'bcryptjs';
// import {
//   listUsers as listUsersRepo,
//   getUserById as getUserByIdRepo,
//   createUser as createUserRepo,
//   updateUser as updateUserRepo,
//   getStoreById
// } from '../repositories/userRepository.js';
// import { query as dbQuery } from '../db/index.js';
//
// // Validation rules
// export const getUsersValidation = [
//   queryValidator('page')
//     .optional()
//     .isInt({ min: 1 })
//     .withMessage('Page must be a positive integer'),
//   queryValidator('limit')
//     .optional()
//     .isInt({ min: 1, max: 100 })
//     .withMessage('Limit must be between 1 and 100'),
//   queryValidator('role')
//     .optional()
//     .isIn(['admin', 'manager', 'employee', 'cashier'])
//     .withMessage('Invalid role filter'),
//   queryValidator('department')
//     .optional()
//     .isIn(['management', 'sales', 'inventory', 'billing', 'reports'])
//     .withMessage('Invalid department filter'),
//   queryValidator('isActive')
//     .optional()
//     .isBoolean()
//     .withMessage('isActive must be a boolean')
// ];
//
// export const createUserValidation = [
//   body('firstName')
//     .trim()
//     .notEmpty()
//     .withMessage('First name is required')
//     .isLength({ max: 50 })
//     .withMessage('First name cannot exceed 50 characters'),
//   body('lastName')
//     .trim()
//     .notEmpty()
//     .withMessage('Last name is required')
//     .isLength({ max: 50 })
//     .withMessage('Last name cannot exceed 50 characters'),
//   body('email')
//     .isEmail()
//     .withMessage('Please enter a valid email')
//     .normalizeEmail(),
//   body('password')
//     .isLength({ min: 6 })
//     .withMessage('Password must be at least 6 characters long'),
//   body('role')
//     .isIn(['admin', 'manager', 'employee', 'cashier'])
//     .withMessage('Invalid role'),
//   body('department')
//     .isIn(['management', 'sales', 'inventory', 'billing', 'reports'])
//     .withMessage('Invalid department'),
//   body('phone')
//     .optional()
//     .matches(/^[\+]?[1-9][\d]{0,15}$/)
//     .withMessage('Please enter a valid phone number')
// ];
//
// export const updateUserValidation = [
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
//   body('email')
//     .optional()
//     .isEmail()
//     .withMessage('Please enter a valid email')
//     .normalizeEmail(),
//   body('role')
//     .optional()
//     .isIn(['admin', 'manager', 'employee', 'cashier'])
//     .withMessage('Invalid role'),
//   body('department')
//     .optional()
//     .isIn(['management', 'sales', 'inventory', 'billing', 'reports'])
//     .withMessage('Invalid department'),
//   body('phone')
//     .optional()
//     .matches(/^[\+]?[1-9][\d]{0,15}$/)
//     .withMessage('Please enter a valid phone number'),
//   body('isActive')
//     .optional()
//     .isBoolean()
//     .withMessage('isActive must be a boolean')
// ];
//
// const hashPassword = async (password) => {
//   const salt = await bcrypt.genSalt(10);
//   return bcrypt.hash(password, salt);
// };
//
// // @desc    Get all users (with pagination and filtering)
// export const getUsers = async (req, res) => {
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
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = parseInt(req.query.limit, 10) || 10;
//
//     const { users, pagination } = await listUsersRepo({
//       page,
//       limit,
//       role: req.query.role,
//       department: req.query.department,
//       isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
//     });
//
//     res.json({
//       status: 'success',
//       data: {
//         users,
//         pagination
//       }
//     });
//   } catch (error) {
//     console.error('Get users error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while fetching users'
//     });
//   }
// };
//
// // @desc    Get user by ID
// export const getUserById = async (req, res) => {
//   try {
//     const userId = Number(req.params.id);
//
//     if (req.user._id !== userId && !['admin', 'manager'].includes(req.user.role)) {
//       return res.status(403).json({
//         status: 'error',
//         message: 'Access denied. You can only view your own profile.'
//       });
//     }
//
//     const user = await getUserByIdRepo(userId);
//
//     if (!user) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'User not found'
//       });
//     }
//
//     res.json({
//       status: 'success',
//       data: {
//         user
//       }
//     });
//   } catch (error) {
//     console.error('Get user error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while fetching user'
//     });
//   }
// };
//
// // @desc    Create a new user
// export const createUser = async (req, res) => {
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
//     const { firstName, lastName, email, password, role, department, phone, address, stores } = req.body;
//
//     const normalizedEmail = email?.trim().toLowerCase();
//
//     const hashedPassword = await hashPassword(password);
//
//     const user = await createUserRepo({
//       firstName: firstName?.trim(),
//       lastName: lastName?.trim(),
//       email: normalizedEmail,
//       username: normalizedEmail,
//       passwordHash: hashedPassword,
//       role,
//       department,
//       phone,
//       address,
//       stores: stores || [],
//       createdBy: req.user?._id
//     });
//
//     res.status(201).json({
//       status: 'success',
//       message: 'User created successfully',
//       data: {
//         user
//       }
//     });
//   } catch (error) {
//     console.error('Create user error:', error);
//     if (error?.code === 'ER_DUP_ENTRY' || error?.code === 'EMAIL_IN_USE') {
//       return res.status(400).json({
//         status: 'error',
//         message: 'User with this email already exists'
//       });
//     }
//     if (error?.code === 'USERNAME_IN_USE') {
//       return res.status(400).json({
//         status: 'error',
//         message: 'User with this username already exists'
//       });
//     }
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while creating user'
//     });
//   }
// };
//
// // @desc    Update user
// export const updateUser = async (req, res) => {
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
//     const userId = Number(req.params.id);
//     const isAdmin = req.user.role === 'admin';
//     const isOwnProfile = req.user._id === userId;
//
//     if (!isAdmin && !isOwnProfile) {
//       return res.status(403).json({
//         status: 'error',
//         message: 'Access denied. You can only update your own profile.'
//       });
//     }
//
//     const allowedUpdates = isAdmin
//       ? ['firstName', 'lastName', 'email', 'role', 'department', 'phone', 'address', 'isActive', 'preferences', 'stores', 'selectedStoreId']
//       : ['firstName', 'lastName', 'phone', 'address', 'preferences', 'selectedStoreId'];
//
//     const updates = {};
//     Object.keys(req.body).forEach((key) => {
//       if (allowedUpdates.includes(key)) {
//         updates[key] = req.body[key];
//       }
//     });
//
//     try {
//       const user = await updateUserRepo(userId, updates);
//       if (!user) {
//         return res.status(404).json({
//           status: 'error',
//           message: 'User not found'
//         });
//       }
//
//       res.json({
//         status: 'success',
//         message: 'User updated successfully',
//         data: {
//           user
//         }
//       });
//     } catch (error) {
//       if (error.code === 'EMAIL_IN_USE' || error.code === 'USERNAME_IN_USE') {
//         return res.status(400).json({
//           status: 'error',
//           message: error.message
//         });
//       }
//       throw error;
//     }
//   } catch (error) {
//     console.error('Update user error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while updating user'
//     });
//   }
// };
//
// // @desc    Delete user (soft delete by setting isActive to false)
// export const deleteUser = async (req, res) => {
//   try {
//     const userId = Number(req.params.id);
//
//     if (req.user._id === userId) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'You cannot delete your own account'
//       });
//     }
//
//     const user = await updateUserRepo(userId, { isActive: false });
//
//     if (!user) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'User not found'
//       });
//     }
//
//     res.json({
//       status: 'success',
//       message: 'User deactivated successfully',
//       data: {
//         user
//       }
//     });
//   } catch (error) {
//     console.error('Delete user error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while deleting user'
//     });
//   }
// };
//
// // @desc    Activate user account
// export const activateUser = async (req, res) => {
//   try {
//     const userId = Number(req.params.id);
//
//     const user = await updateUserRepo(userId, { isActive: true });
//
//     if (!user) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'User not found'
//       });
//     }
//
//     res.json({
//       status: 'success',
//       message: 'User activated successfully',
//       data: {
//         user
//       }
//     });
//   } catch (error) {
//     console.error('Activate user error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while activating user'
//     });
//   }
// };
//
// // @desc    Set selected store for current user
// export const setSelectedStore = async (req, res) => {
//   try {
//     const { storeId } = req.body;
//     const userId = req.user._id;
//
//     if (!storeId) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Store ID is required'
//       });
//     }
//
//     const store = await getStoreById(Number(storeId));
//     if (!store) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Store not found'
//       });
//     }
//
//     const user = await updateUserRepo(userId, { selectedStoreId: Number(storeId) });
//
//     if (!user) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'User not found'
//       });
//     }
//
//     res.json({
//       status: 'success',
//       message: 'Selected store updated successfully',
//       data: {
//         user,
//         selectedStore: store
//       }
//     });
//   } catch (error) {
//     console.error('Set selected store error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while setting selected store',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };
//
// // @desc    Get selected store for current user
// export const getSelectedStore = async (req, res) => {
//   try {
//     const user = await getUserByIdRepo(req.user._id);
//
//     if (!user) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'User not found'
//       });
//     }
//
//     res.json({
//       status: 'success',
//       data: {
//         selectedStore: user.selectedStore || null
//       }
//     });
//   } catch (error) {
//     console.error('Get selected store error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while getting selected store',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };
//
// // @desc    Get user statistics overview
// export const getUserStats = async (req, res) => {
//   try {
//     const [overview] = await dbQuery(`
//       SELECT
//         COUNT(*) AS totalUsers,
//         SUM(is_active = 1) AS activeUsers,
//         SUM(is_active = 0) AS inactiveUsers,
//         SUM(created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS recentRegistrations
//       FROM users
//     `);
//
//     const roleStats = await dbQuery(`
//       SELECT role AS _id, COUNT(*) AS count
//       FROM users
//       WHERE is_active = 1
//       GROUP BY role
//     `);
//
//     const departmentStats = await dbQuery(`
//       SELECT department AS _id, COUNT(*) AS count
//       FROM users
//       WHERE is_active = 1
//       GROUP BY department
//     `);
//
//     res.json({
//       status: 'success',
//       data: {
//         overview: {
//           totalUsers: Number(overview?.totalUsers || 0),
//           activeUsers: Number(overview?.activeUsers || 0),
//           inactiveUsers: Number(overview?.inactiveUsers || 0),
//           recentRegistrations: Number(overview?.recentRegistrations || 0)
//         },
//         roleStats,
//         departmentStats
//       }
//     });
//   } catch (error) {
//     console.error('Get user stats error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Server error while fetching user statistics'
//     });
//   }
// };
//
