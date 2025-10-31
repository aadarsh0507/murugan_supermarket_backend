import { body, validationResult, query } from 'express-validator';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Validation rules
export const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['admin', 'manager', 'employee', 'cashier'])
    .withMessage('Invalid role filter'),
  query('department')
    .optional()
    .isIn(['management', 'sales', 'inventory', 'billing', 'reports'])
    .withMessage('Invalid department filter'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

export const createUserValidation = [
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
    .isIn(['admin', 'manager', 'employee', 'cashier'])
    .withMessage('Invalid role'),
  body('department')
    .isIn(['management', 'sales', 'inventory', 'billing', 'reports'])
    .withMessage('Invalid department'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number')
];

export const updateUserValidation = [
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
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
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
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// @desc    Get all users (with pagination and filtering)
// @access  Private (Admin/Manager only)
export const getUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .populate('stores', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching users'
    });
  }
};

// @desc    Get user by ID
// @access  Private (Admin/Manager only, or user accessing their own profile)
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user is accessing their own profile or has admin/manager role
    if (req.user._id.toString() !== userId && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const user = await User.findById(userId)
      .select('-password')
      .populate('stores', 'name code');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching user'
    });
  }
};

// @desc    Create a new user
// @access  Private (Admin only)
export const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, role, department, phone, address, stores } = req.body;

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
      role,
      department,
      phone,
      address,
      stores: stores || []
    });

    await user.save();

    // Populate stores for response
    await user.populate('stores', 'name code');

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating user'
    });
  }
};

// @desc    Update user
// @access  Private (Admin only, or user updating their own profile)
export const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.params.id;
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = req.user._id.toString() === userId;

    // Check permissions
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own profile.'
      });
    }

    // Non-admin users can't update certain fields
    const allowedUpdates = isAdmin 
      ? ['firstName', 'lastName', 'email', 'role', 'department', 'phone', 'address', 'isActive', 'preferences', 'stores', 'selectedStore']
      : ['firstName', 'lastName', 'phone', 'address', 'preferences', 'selectedStore'];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Check if email is being changed and if it already exists
    if (updates.email) {
      const existingUser = await User.findOne({ email: updates.email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'User with this email already exists'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('stores', 'name code')
      .populate('selectedStore', 'name code address');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating user'
    });
  }
};

// @desc    Delete user (soft delete by setting isActive to false)
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: 'User deactivated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting user'
    });
  }
};

// @desc    Activate user account
// @access  Private (Admin only)
export const activateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: 'User activated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while activating user'
    });
  }
};

// @desc    Set selected store for current user
// @route   PUT /api/users/selected-store
// @access  Private
export const setSelectedStore = async (req, res) => {
  try {
    const { storeId } = req.body;
    const userId = req.user._id;

    // Validate storeId
    if (!storeId) {
      return res.status(400).json({
        status: 'error',
        message: 'Store ID is required'
      });
    }

    // Verify store exists
    const Store = mongoose.model('Store');
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        status: 'error',
        message: 'Store not found'
      });
    }

    // Update user's selected store
    const user = await User.findByIdAndUpdate(
      userId,
      { selectedStore: storeId },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('selectedStore', 'name code address');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Selected store updated successfully',
      data: {
        user,
        selectedStore: user.selectedStore
      }
    });
  } catch (error) {
    console.error('Set selected store error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while setting selected store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get selected store for current user
// @route   GET /api/users/selected-store
// @access  Private
export const getSelectedStore = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select('selectedStore')
      .populate('selectedStore', 'name code address phone email');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        selectedStore: user.selectedStore
      }
    });
  } catch (error) {
    console.error('Get selected store error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while getting selected store',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user statistics overview
// @access  Private (Admin/Manager only)
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = totalUsers - activeUsers;

    // Count by role
    const roleStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Count by department
    const departmentStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      status: 'success',
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          recentRegistrations
        },
        roleStats,
        departmentStats
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching user statistics'
    });
  }
};
