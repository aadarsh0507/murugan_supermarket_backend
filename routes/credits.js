// Temporarily commented out to isolate login and register modules.
// Original implementation preserved below for future reactivation.

// // import express from 'express';
// // import { body, param } from 'express-validator';
// // import {
// //   getAllCredits,
// //   getCreditById,
// //   createCredit,
// //   updateCreditAmount,
// //   updateCreditPayment,
// //   deleteCredit,
// //   getCreditsSummaryBySupplier
// // } from '../controllers/creditController.js';
// // import { protect, authorize } from '../middleware/auth.js';
//
// // const router = express.Router();
//
// // // Validation middleware
// // const createCreditValidation = [
// //   body('purchaseOrderId')
// //     .isInt({ min: 1 })
// //     .withMessage('Purchase order ID must be a positive integer'),
// //   body('initialPayment')
// //     .optional()
// //     .isFloat({ min: 0 })
// //     .withMessage('Initial payment must be a non-negative number'),
// //   body('notes')
// //     .optional()
// //     .trim()
// //     .isLength({ max: 1000 })
// //     .withMessage('Notes cannot exceed 1000 characters')
// // ];
//
// // const updateAmountValidation = [
// //   body('newAmount')
// //     .isFloat({ min: 0 })
// //     .withMessage('New amount must be a non-negative number'),
// //   body('notes')
// //     .optional()
// //     .trim()
// //     .isLength({ max: 1000 })
// //     .withMessage('Notes cannot exceed 1000 characters')
// // ];
//
// // const updatePaymentValidation = [
// //   body('paymentAmount')
// //     .isFloat({ min: 0.01 })
// //     .withMessage('Payment amount must be a positive number greater than 0'),
// //   body('notes')
// //     .optional()
// //     .trim()
// //     .isLength({ max: 1000 })
// //     .withMessage('Notes cannot exceed 1000 characters')
// // ];
//
// // // Routes
// // // @route   GET /api/credits
// // // @desc    Get all credits
// // // @access  Private
// // router.get('/', protect, getAllCredits);
//
// // // @route   GET /api/credits/summary/:supplierId
// // // @desc    Get credits summary by supplier
// // // @access  Private
// // router.get('/summary/:supplierId', protect, getCreditsSummaryBySupplier);
//
// // // @route   GET /api/credits/:id
// // // @desc    Get single credit
// // // @access  Private
// // router.get('/:id', protect, getCreditById);
//
// // // @route   POST /api/credits
// // // @desc    Create credit from purchase order
// // // @access  Private (Admin/Manager)
// // router.post('/', protect, authorize('admin', 'manager'), createCreditValidation, createCredit);
//
// // // @route   PUT /api/credits/:id/amount
// // // @desc    Update credit original amount
// // // @access  Private (Admin/Manager)
// // router.put('/:id/amount', protect, authorize('admin', 'manager'), updateAmountValidation, updateCreditAmount);
//
// // // @route   PUT /api/credits/:id/payment
// // // @desc    Update credit payment
// // // @access  Private (Admin/Manager)
// // router.put('/:id/payment', protect, authorize('admin', 'manager'), updatePaymentValidation, updateCreditPayment);
//
// // // @route   DELETE /api/credits/:id
// // // @desc    Delete credit
// // // @access  Private (Admin)
// // router.delete('/:id', protect, authorize('admin'), deleteCredit);
//
// // export default router;
//
//
