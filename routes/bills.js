import express from 'express';
import { body } from 'express-validator';
import {
  createBill,
  getAllBills,
  getBillById,
  getDailySalesSummary,
  getLowStockItems,
  getNoMovementItems
} from '../controllers/billController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation rules for creating a bill
const createBillValidation = [
  body('billNumber')
    .notEmpty()
    .withMessage('Bill number is required')
    .trim(),
  body('counterNumber')
    .isInt({ min: 1 })
    .withMessage('Counter number must be a positive integer'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.itemSku')
    .notEmpty()
    .withMessage('Item SKU is required'),
  body('items.*.itemName')
    .notEmpty()
    .withMessage('Item name is required'),
  body('items.*.mrp')
    .isFloat({ min: 0 })
    .withMessage('MRP must be a positive number'),
  body('items.*.saleRate')
    .isFloat({ min: 0 })
    .withMessage('Sale rate must be a positive number'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('items.*.netAmount')
    .isFloat({ min: 0 })
    .withMessage('Net amount must be a positive number'),
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('subtotal')
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('totalQuantity')
    .isInt({ min: 0 })
    .withMessage('Total quantity must be a non-negative integer'),
  body('amountPaid')
    .isFloat({ min: 0 })
    .withMessage('Amount paid must be a positive number'),
  body('gstBreakdown')
    .isArray()
    .withMessage('GST breakdown must be an array'),
  body('gstBreakdown.*.basic')
    .isFloat({ min: 0 })
    .withMessage('Basic amount must be a positive number'),
  body('gstBreakdown.*.cgstPercent')
    .isFloat({ min: 0 })
    .withMessage('CGST percentage must be a positive number'),
  body('gstBreakdown.*.cgstAmount')
    .isFloat({ min: 0 })
    .withMessage('CGST amount must be a positive number'),
  body('gstBreakdown.*.sgstPercent')
    .isFloat({ min: 0 })
    .withMessage('SGST percentage must be a positive number'),
  body('gstBreakdown.*.sgstAmount')
    .isFloat({ min: 0 })
    .withMessage('SGST amount must be a positive number')
];

// Routes
router.post('/', authenticate, createBillValidation, createBill);
router.get('/', authenticate, getAllBills);
router.get('/summary/:date', authenticate, getDailySalesSummary);
router.get('/low-stock', authenticate, getLowStockItems);
router.get('/no-movement', authenticate, getNoMovementItems);
router.get('/:id', authenticate, getBillById);

export default router;
