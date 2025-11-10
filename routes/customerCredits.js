// Temporarily commented out to isolate login and register modules.
// Original implementation preserved below for future reactivation.

// // import express from 'express';
// // import { body, param } from 'express-validator';
// // import {
// //   getAllCustomerCredits,
// //   getCustomerCreditById,
// //   createCustomerCredit,
// //   updateCustomerCreditAmount,
// //   updateCustomerCreditPayment,
// //   deleteCustomerCredit,
// //   getCustomerCreditsSummaryByCustomer,
// //   getCustomerByPhone
// // } from '../controllers/customerCreditController.js';
// // import { protect, authorize } from '../middleware/auth.js';
//
// // const router = express.Router();
//
// // // Validation middleware
// // const createCustomerCreditValidation = [
// //   body('billId')
// //     .isInt({ min: 1 })
// //     .withMessage('Bill ID must be a positive integer'),
// //   body('customerName')
// //     .notEmpty()
// //     .withMessage('Customer name is required')
// //     .trim()
// //     .isLength({ max: 100 })
// //     .withMessage('Customer name cannot exceed 100 characters'),
// //   body('customerPhone')
// //     .notEmpty()
// //     .withMessage('Customer phone number is required')
// //     .trim()
// //     .isLength({ max: 20 })
// //     .withMessage('Phone number cannot exceed 20 characters'),
// //   body('customerAddress')
// //     .optional()
// //     .trim()
// //     .isLength({ max: 500 })
// //     .withMessage('Address cannot exceed 500 characters'),
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
// // // @route   GET /api/customer-credits
// // // @desc    Get all customer credits
// // // @access  Private
// // router.get('/', protect, getAllCustomerCredits);
//
// // // @route   GET /api/customer-credits/summary/:customerName
// // // @desc    Get customer credits summary by customer name
// // // @access  Private
// // router.get('/summary/:customerName', protect, getCustomerCreditsSummaryByCustomer);
//
// // // @route   GET /api/customer-credits/customer-by-phone/:phone
// // // @desc    Get customer details by phone number
// // // @access  Private
// // router.get('/customer-by-phone/:phone', protect, getCustomerByPhone);
//
// // // @route   GET /api/customer-credits/:id
// // // @desc    Get single customer credit
// // // @access  Private
// // router.get('/:id', protect, getCustomerCreditById);
//
// // // @route   POST /api/customer-credits
// // // @desc    Create customer credit from bill
// // // @access  Private (Admin/Manager)
// // router.post('/', protect, authorize('admin', 'manager'), createCustomerCreditValidation, createCustomerCredit);
//
// // // @route   PUT /api/customer-credits/:id/amount
// // // @desc    Update customer credit original amount
// // // @access  Private (Admin/Manager)
// // router.put('/:id/amount', protect, authorize('admin', 'manager'), updateAmountValidation, updateCustomerCreditAmount);
//
// // // @route   PUT /api/customer-credits/:id/payment
// // // @desc    Update customer credit payment
// // // @access  Private (Admin/Manager)
// // router.put('/:id/payment', protect, authorize('admin', 'manager'), updatePaymentValidation, updateCustomerCreditPayment);
//
// // // @route   DELETE /api/customer-credits/:id
// // // @desc    Delete customer credit
// // // @access  Private (Admin)
// // router.delete('/:id', protect, authorize('admin'), deleteCustomerCredit);
//
// // export default router;
//
//
