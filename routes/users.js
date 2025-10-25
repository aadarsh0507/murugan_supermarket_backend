import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  getUserStats,
  getUsersValidation,
  createUserValidation,
  updateUserValidation
} from '../controllers/userController.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (with pagination and filtering)
// @access  Private (Admin/Manager/Employee)
router.get('/', authenticate, authorize('admin', 'manager', 'employee'), getUsersValidation, getUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin/Manager only, or user accessing their own profile)
router.get('/:id', authenticate, getUserById);

// @route   POST /api/users
// @desc    Create a new user
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), createUserValidation, createUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only, or user updating their own profile)
router.put('/:id', authenticate, updateUserValidation, updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete by setting isActive to false)
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

// @route   PUT /api/users/:id/activate
// @desc    Activate user account
// @access  Private (Admin only)
router.put('/:id/activate', authenticate, authorize('admin'), activateUser);

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview
// @access  Private (Admin/Manager only)
router.get('/stats/overview', authenticate, authorize('admin', 'manager'), getUserStats);

export default router;
