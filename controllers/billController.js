import { body, param, validationResult } from 'express-validator';
import {
  createBill as createBillRepo,
  deleteBill as deleteBillRepo
} from '../repositories/billRepository.js';

const respondValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
    return true;
  }
  return false;
};

const generateBillNumber = () => {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const time = String(now.getTime()).slice(-6);
  return `BILL-${YYYY}${MM}${DD}-${time}`;
};

export const createBillValidation = [
  body('storeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('storeId must be a positive integer'),
  body('billNo')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('billNo must be between 2 and 50 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('date must be a valid ISO8601 string'),
  body('customerName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('customerName cannot exceed 100 characters'),
  body('customerPhone')
    .optional({ checkFalsy: true })
    .matches(/^[\+]?[0-9]{6,20}$/)
    .withMessage('customerPhone must be a valid phone number'),
  body('customerEmail')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('customerEmail must be a valid email')
    .normalizeEmail(),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'upi', 'credit', 'other'])
    .withMessage('Invalid payment method'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'partial', 'paid', 'refunded'])
    .withMessage('Invalid payment status'),
  body('subtotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('subtotal must be a non-negative number'),
  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('tax must be a non-negative number'),
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('discount must be a non-negative number'),
  body('total')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('total must be a non-negative number')
];

export const billIdParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Bill id must be a positive integer')
];

const handleDatabaseError = (error, res) => {
  if (error?.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      status: 'error',
      message: 'Bills table is missing. Please run the latest database migrations.'
    });
  }

  if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      status: 'error',
      message: 'The provided store or user reference does not exist.'
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Server error while processing bill request'
  });
};

export const createBill = async (req, res) => {
  try {
    if (respondValidationErrors(req, res)) return;

    const {
      billNo,
      storeId,
      date,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod,
      paymentStatus,
      subtotal,
      tax,
      discount,
      total
    } = req.body;

    const resolvedStoreId = Number(storeId || req.user?.selectedStore?.id);
    if (!resolvedStoreId) {
      return res.status(400).json({
        status: 'error',
        message: 'A store must be selected before creating a bill.'
      });
    }

    const payload = {
      billNo: billNo?.trim() || generateBillNumber(),
      storeId: resolvedStoreId,
      userId: req.user?._id,
      date: date ? new Date(date) : new Date(),
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod,
      paymentStatus,
      subtotal,
      tax,
      discount,
      total
    };

    const bill = await createBillRepo(payload);

    res.status(201).json({
      status: 'success',
      message: 'Bill created successfully',
      data: { bill }
    });
  } catch (error) {
    console.error('Create bill error:', error);
    handleDatabaseError(error, res);
  }
};

export const deleteBill = async (req, res) => {
  try {
    if (respondValidationErrors(req, res)) return;

    const billId = Number(req.params.id);
    const deleted = await deleteBillRepo(billId);

    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Bill not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Delete bill error:', error);
    handleDatabaseError(error, res);
  }
};
// Temporarily commented out to isolate login and register modules.
// Original implementation preserved below for future reactivation.

// // const respondNotImplemented = (res, feature) => {
// //   res.status(501).json({
// //     success: false,
// //     message: `${feature} is not yet implemented for the MySQL backend.`
// //   });
// // };
//
// // export const createBill = (req, res) => respondNotImplemented(res, 'Bill creation');
// // export const getAllBills = (req, res) => respondNotImplemented(res, 'Listing bills');
// // export const getBillById = (req, res) => respondNotImplemented(res, 'Fetching bill details');
// // export const getDailySalesSummary = (req, res) => respondNotImplemented(res, 'Daily sales summary');
// // export const getLowStockItems = (req, res) => respondNotImplemented(res, 'Low stock report');
// // export const getNoMovementItems = (req, res) => respondNotImplemented(res, 'No movement report');
//
