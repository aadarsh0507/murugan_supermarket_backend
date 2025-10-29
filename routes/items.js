import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  toggleItemStatus,
  getItemStats,
  getLowStockItems,
  getItemsBySubcategory,
  getStockWithBatches,
  serveItemImage
} from '../controllers/itemController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const createItemValidation = [
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
  body('subcategory')
    .isMongoId()
    .withMessage('Subcategory must be a valid category ID'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('unit')
    .trim()
    .notEmpty()
    .withMessage('Unit is required')
    .isLength({ max: 20 })
    .withMessage('Unit cannot exceed 20 characters'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  body('maxStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum stock must be a non-negative integer'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  body('barcode')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Barcode cannot exceed 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*.url')
    .optional()
    .isString()
    .withMessage('Image URL must be a string'),
  body('images.*.alt')
    .optional()
    .isString()
    .withMessage('Image alt text must be a string'),
  body('images.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('Image isPrimary must be a boolean'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  body('isDigital')
    .optional()
    .isBoolean()
    .withMessage('isDigital must be a boolean value'),
  body('requiresPrescription')
    .optional()
    .isBoolean()
    .withMessage('requiresPrescription must be a boolean value'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
];

const updateItemValidation = [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Item name must be between 2 and 200 characters'),
  body('sku')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('SKU must be between 2 and 50 characters'),
  body('subcategory')
    .optional()
    .isMongoId()
    .withMessage('Subcategory must be a valid category ID'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Unit cannot exceed 20 characters'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  body('maxStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum stock must be a non-negative integer'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  body('barcode')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Barcode cannot exceed 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*.url')
    .optional()
    .isString()
    .withMessage('Image URL must be a string'),
  body('images.*.alt')
    .optional()
    .isString()
    .withMessage('Image alt text must be a string'),
  body('images.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('Image isPrimary must be a boolean'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  body('isDigital')
    .optional()
    .isBoolean()
    .withMessage('isDigital must be a boolean value'),
  body('requiresPrescription')
    .optional()
    .isBoolean()
    .withMessage('requiresPrescription must be a boolean value'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
];

const getItemValidation = [
  param('id').isMongoId().withMessage('Invalid item ID')
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
  query('subcategory')
    .optional()
    .isMongoId()
    .withMessage('Subcategory must be a valid category ID'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'stock', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('lowStock')
    .optional()
    .isBoolean()
    .withMessage('lowStock must be a boolean value')
];

// Routes

// @route   GET /api/items/image/:filename
// @desc    Serve item images
// @access  Public
router.get('/image/:filename', serveItemImage);

// @route   GET /api/items
// @desc    Get all items with pagination and filtering
// @access  Private
router.get('/', protect, queryValidation, getAllItems);

// @route   GET /api/items/stats/overview
// @desc    Get item statistics
// @access  Private (Admin/Manager)
router.get('/stats/overview', protect, authorize('admin', 'manager'), getItemStats);

// @route   GET /api/items/low-stock
// @desc    Get low stock items
// @access  Private
router.get('/low-stock', protect, getLowStockItems);

// @route   GET /api/items/stock-with-batches
// @desc    Get stock with batch numbers
// @access  Private
router.get('/stock-with-batches', protect, getStockWithBatches);

// @route   GET /api/items/subcategory/:id
// @desc    Get items by subcategory
// @access  Private
router.get('/subcategory/:id', protect, getItemValidation, getItemsBySubcategory);

// @route   GET /api/items/:id
// @desc    Get single item by ID
// @access  Private
router.get('/:id', protect, getItemValidation, getItemById);

// @route   POST /api/items
// @desc    Create new item
// @access  Private (Admin/Manager/Employee)
router.post('/', protect, authorize('admin', 'manager', 'employee'), createItemValidation, createItem);

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private (Admin/Manager/Employee)
router.put('/:id', protect, authorize('admin', 'manager', 'employee'), updateItemValidation, updateItem);

// @route   PATCH /api/items/:id/toggle-status
// @desc    Toggle item active status
// @access  Private (Admin/Manager)
router.patch('/:id/toggle-status', protect, authorize('admin', 'manager'), getItemValidation, toggleItemStatus);

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), getItemValidation, deleteItem);

export default router;
