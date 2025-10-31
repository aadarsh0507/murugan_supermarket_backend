import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  receivePurchaseOrder,
  getPurchaseOrderBarcodes,
  regeneratePurchaseOrderBarcodes
} from '../controllers/purchaseOrderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const createPurchaseOrderValidation = [
  body('supplier')
    .isMongoId()
    .withMessage('Supplier must be a valid supplier ID'),
  body('store')
    .isMongoId()
    .withMessage('Store must be a valid store ID'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.itemName')
    .trim()
    .notEmpty()
    .withMessage('Item name is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('items.*.costPrice')
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  body('items.*.sku')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('SKU must be a string'),
  body('items.*.unit')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Unit must be a string'),
  body('orderDate')
    .optional()
    .isISO8601()
    .withMessage('Order date must be a valid date'),
  body('expectedDeliveryDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Expected delivery date must be a valid date')
];

// Routes
// @route   GET /api/purchase-orders
// @desc    Get all purchase orders
// @access  Private
router.get('/', protect, getAllPurchaseOrders);

// @route   POST /api/purchase-orders
// @desc    Create new purchase order
// @access  Private (Admin/Manager)
router.post('/', protect, authorize('admin', 'manager'), createPurchaseOrderValidation, createPurchaseOrder);

// @route   PATCH /api/purchase-orders/:id/receive
// @desc    Receive purchase order and update stock
// @access  Private (Admin/Manager)
router.patch('/:id/receive', protect, authorize('admin', 'manager'), receivePurchaseOrder);

// @route   GET /api/purchase-orders/:id/barcodes
// @desc    Get barcodes for a purchase order
// @access  Private
router.get('/:id/barcodes', protect, getPurchaseOrderBarcodes);

// @route   POST /api/purchase-orders/:id/regenerate-barcodes
// @desc    Regenerate barcodes for a purchase order
// @access  Private (Admin/Manager)
router.post('/:id/regenerate-barcodes', protect, authorize('admin', 'manager'), regeneratePurchaseOrderBarcodes);

// @route   GET /api/purchase-orders/:id
// @desc    Get single purchase order
// @access  Private
router.get('/:id', protect, getPurchaseOrderById);

// @route   PUT /api/purchase-orders/:id
// @desc    Update purchase order
// @access  Private (Admin/Manager)
router.put('/:id', protect, authorize('admin', 'manager'), createPurchaseOrderValidation, updatePurchaseOrder);

// @route   DELETE /api/purchase-orders/:id
// @desc    Delete purchase order
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), deletePurchaseOrder);

export default router;

