import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  addStoreToSupplier,
  removeStoreFromSupplier,
  getAllStores,
  createStore,
  updateStore,
  deleteStore,
  bulkUploadSuppliers
} from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadCSV } from '../middleware/upload.js';

const router = express.Router();

// Validation middleware for supplier
const createSupplierValidation = [
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Company name must be between 2 and 200 characters'),
  body('contactPerson.firstName')
    .trim()
    .notEmpty()
    .withMessage('Contact person first name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('contactPerson.lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone.primary')
    .notEmpty()
    .withMessage('Primary phone is required')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('phone.secondary')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('stores')
    .optional()
    .isArray()
    .withMessage('Stores must be an array'),
  body('stores.*.store')
    .optional()
    .isMongoId()
    .withMessage('Store must be a valid store ID'),
  body('gstNumber')
    .optional()
    .trim()
    .isLength({ max: 15 })
    .withMessage('GST number cannot exceed 15 characters'),
  body('panNumber')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('PAN number cannot exceed 10 characters'),
  body('creditLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be a positive number'),
  body('paymentTerms')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Payment terms cannot exceed 50 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const updateSupplierValidation = [
  param('id').isMongoId().withMessage('Invalid supplier ID'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Company name must be between 2 and 200 characters'),
  body('contactPerson.firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone.primary')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('stores')
    .optional()
    .isArray()
    .withMessage('Stores must be an array'),
  body('creditLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be a positive number')
];

const createStoreValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Store name must be between 2 and 100 characters'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Store code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Store code must be between 2 and 20 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('managerName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Manager name cannot exceed 100 characters'),
  body('address.street')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street cannot exceed 200 characters'),
  body('address.city')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),
  body('address.state')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  body('address.zipCode')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 10 })
    .withMessage('Zip code cannot exceed 10 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Routes
// @route   POST /api/suppliers/bulk-upload
// @desc    Bulk upload suppliers from CSV
// @access  Private (Admin/Manager)
router.post('/bulk-upload', protect, authorize('admin', 'manager'), uploadCSV.single('file'), bulkUploadSuppliers);

// @route   GET /api/suppliers/stores
// @desc    Get all stores
// @access  Private
router.get('/stores', protect, getAllStores);

// @route   POST /api/suppliers/stores
// @desc    Create new store
// @access  Private (Admin/Manager)
router.post('/stores', protect, authorize('admin', 'manager'), createStoreValidation, createStore);

// @route   PUT /api/suppliers/stores/:id
// @desc    Update store
// @access  Private (Admin/Manager)
router.put('/stores/:id', protect, authorize('admin', 'manager'), createStoreValidation, updateStore);

// @route   DELETE /api/suppliers/stores/:id
// @desc    Delete store
// @access  Private (Admin)
router.delete('/stores/:id', protect, authorize('admin'), deleteStore);

// @route   GET /api/suppliers
// @desc    Get all suppliers
// @access  Private
router.get('/', protect, getAllSuppliers);

// @route   POST /api/suppliers/:id/stores
// @desc    Add store to supplier
// @access  Private (Admin/Manager)
router.post('/:id/stores', protect, authorize('admin', 'manager'), addStoreToSupplier);

// @route   DELETE /api/suppliers/:id/stores/:storeId
// @desc    Remove store from supplier
// @access  Private (Admin/Manager)
router.delete('/:id/stores/:storeId', protect, authorize('admin', 'manager'), removeStoreFromSupplier);

// @route   GET /api/suppliers/:id
// @desc    Get single supplier
// @access  Private
router.get('/:id', protect, getSupplierById);

// @route   POST /api/suppliers
// @desc    Create new supplier
// @access  Private (Admin/Manager)
router.post('/', protect, authorize('admin', 'manager'), createSupplierValidation, createSupplier);

// @route   PUT /api/suppliers/:id
// @desc    Update supplier
// @access  Private (Admin/Manager)
router.put('/:id', protect, authorize('admin', 'manager'), updateSupplierValidation, updateSupplier);

// @route   PATCH /api/suppliers/:id/toggle-status
// @desc    Toggle supplier active status
// @access  Private (Admin/Manager)
router.patch('/:id/toggle-status', protect, authorize('admin', 'manager'), toggleSupplierStatus);

// @route   DELETE /api/suppliers/:id
// @desc    Delete supplier
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), deleteSupplier);

export default router;

