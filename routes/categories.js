import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryStats,
  getSubcategories,
  getCategoryHierarchy,
  addSubcategory,
  addItemToSubcategory,
  updateEmbeddedItem
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

const addSubcategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subcategory name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subcategory name must be between 2 and 100 characters')
];

const addItemValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Item name must be between 2 and 200 characters'),
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('SKU must be between 2 and 50 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('unit')
    .trim()
    .notEmpty()
    .withMessage('Unit is required')
    .isLength({ max: 20 })
    .withMessage('Unit cannot exceed 20 characters')
];

const updateCategoryValidation = [
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

const getCategoryValidation = [
  param('id').isMongoId().withMessage('Invalid category ID')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Routes

// @route   GET /api/categories
// @desc    Get all categories with pagination and filtering
// @access  Private
router.get('/', protect, queryValidation, getAllCategories);

// @route   POST /api/categories
// @desc    Create new category
// @access  Private (Admin/Manager)
router.post('/', protect, authorize('admin', 'manager'), createCategoryValidation, createCategory);

// @route   GET /api/categories/stats/overview
// @desc    Get category statistics
// @access  Private (Admin/Manager)
router.get('/stats/overview', protect, authorize('admin', 'manager'), getCategoryStats);

// @route   GET /api/categories/hierarchy
// @desc    Get category hierarchy (tree structure)
// @access  Private
router.get('/hierarchy', protect, getCategoryHierarchy);

// @route   GET /api/categories/:id
// @desc    Get single category by ID
// @access  Private
router.get('/:id', protect, getCategoryValidation, getCategoryById);


// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin/Manager)
router.put('/:id', protect, authorize('admin', 'manager'), updateCategoryValidation, updateCategory);

// @route   PATCH /api/categories/:id/toggle-status
// @desc    Toggle category active status
// @access  Private (Admin/Manager)
router.patch('/:id/toggle-status', protect, authorize('admin', 'manager'), getCategoryValidation, toggleCategoryStatus);

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), getCategoryValidation, deleteCategory);

// @route   GET /api/categories/:id/subcategories
// @desc    Get subcategories of a specific category
// @access  Private
router.get('/:id/subcategories', protect, getCategoryValidation, getSubcategories);

// @route   POST /api/categories/:id/subcategories
// @desc    Add subcategory to existing category
// @access  Private (Admin/Manager)
router.post('/:id/subcategories', protect, authorize('admin', 'manager'), addSubcategoryValidation, addSubcategory);

// @route   POST /api/categories/:id/subcategories/:subcategoryId/items
// @desc    Add item to subcategory
// @access  Private (Admin/Manager)
router.post('/:id/subcategories/:subcategoryId/items', protect, authorize('admin', 'manager'), addItemValidation, addItemToSubcategory);

// @route   PUT /api/categories/items/:itemId
// @desc    Update embedded item in category/subcategory
// @access  Private (Admin/Manager/Employee)
router.put('/items/:itemId', protect, authorize('admin', 'manager', 'employee'), updateEmbeddedItem);

export default router;
