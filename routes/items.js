// Temporarily commented out to isolate login and register modules.
// Original implementation preserved below for future reactivation.

// // import express from 'express';
// // import { body, param, query } from 'express-validator';
// // import {
// //   getAllItems,
// //   getItemById,
// //   getItemsCount,
// //   createItem,
// //   updateItem,
// //   deleteItem,
// //   toggleItemStatus,
// //   getItemStats,
// //   getLowStockItems,
// //   getItemsBySubcategory,
// //   getStockWithBatches,
// //   serveItemImage,
// //   bulkUploadItems
// // } from '../controllers/itemController.js';
// // import { protect, authorize } from '../middleware/auth.js';
// // import { uploadCSV } from '../middleware/upload.js';
//
// // const router = express.Router();
//
// // const createItemValidation = [
// //   body('name')
// //     .trim()
// //     .notEmpty()
// //     .withMessage('Item name is required')
// //     .isLength({ min: 2, max: 200 })
// //     .withMessage('Item name must be between 2 and 200 characters'),
// //   body('itemCode')
// //     .optional()
// //     .trim()
// //     .isLength({ min: 2, max: 50 })
// //     .withMessage('Item code must be between 2 and 50 characters'),
// //   body('categoryId')
// //     .isInt({ min: 1 })
// //     .withMessage('Category ID must be a positive integer'),
// //   body('subCategoryId')
// //     .isInt({ min: 1 })
// //     .withMessage('Subcategory ID must be a positive integer'),
// //   body('uom')
// //     .trim()
// //     .notEmpty()
// //     .withMessage('Unit of measure is required')
// //     .isLength({ max: 20 })
// //     .withMessage('Unit cannot exceed 20 characters'),
// //   body('taxRate')
// //     .isFloat({ min: 0 })
// //     .withMessage('Tax rate must be a non-negative number'),
// //   body('mrp')
// //     .isFloat({ min: 0 })
// //     .withMessage('MRP must be a non-negative number'),
// //   body('purchasePrice')
// //     .isFloat({ min: 0 })
// //     .withMessage('Purchase price must be a non-negative number'),
// //   body('sellingPrice')
// //     .isFloat({ min: 0 })
// //     .withMessage('Selling price must be a non-negative number'),
// //   body('reorderLevel')
// //     .optional()
// //     .isInt({ min: 0 })
// //     .withMessage('Reorder level must be a non-negative integer'),
// //   body('isActive')
// //     .optional()
// //     .isBoolean()
// //     .withMessage('isActive must be a boolean value')
// // ];
//
// // const updateItemValidation = [
// //   param('id').isInt({ min: 1 }).withMessage('Invalid item ID'),
// //   body('name')
// //     .optional()
// //     .trim()
// //     .isLength({ min: 2, max: 200 })
// //     .withMessage('Item name must be between 2 and 200 characters'),
// //   body('itemCode')
// //     .optional()
// //     .trim()
// //     .isLength({ min: 2, max: 50 })
// //     .withMessage('Item code must be between 2 and 50 characters'),
// //   body('categoryId')
// //     .optional()
// //     .isInt({ min: 1 })
// //     .withMessage('Category ID must be a positive integer'),
// //   body('subCategoryId')
// //     .optional()
// //     .isInt({ min: 1 })
// //     .withMessage('Subcategory ID must be a positive integer'),
// //   body('taxRate')
// //     .optional()
// //     .isFloat({ min: 0 })
// //     .withMessage('Tax rate must be a non-negative number'),
// //   body('mrp')
// //     .optional()
// //     .isFloat({ min: 0 })
// //     .withMessage('MRP must be a non-negative number'),
// //   body('purchasePrice')
// //     .optional()
// //     .isFloat({ min: 0 })
// //     .withMessage('Purchase price must be a non-negative number'),
// //   body('sellingPrice')
// //     .optional()
// //     .isFloat({ min: 0 })
// //     .withMessage('Selling price must be a non-negative number'),
// //   body('reorderLevel')
// //     .optional()
// //     .isInt({ min: 0 })
// //     .withMessage('Reorder level must be a non-negative integer'),
// //   body('isActive')
// //     .optional()
// //     .isBoolean()
// //     .withMessage('isActive must be a boolean value')
// // ];
//
// // const getItemValidation = [param('id').isInt({ min: 1 }).withMessage('Invalid item ID')];
//
// // const queryValidation = [
// //   query('page')
// //     .optional()
// //     .isInt({ min: 1 })
// //     .withMessage('Page must be a positive integer'),
// //   query('limit')
// //     .optional()
// //     .isInt({ min: 1, max: 100 })
// //     .withMessage('Limit must be between 1 and 100'),
// //   query('search')
// //     .optional()
// //     .trim()
// //     .isLength({ max: 100 })
// //     .withMessage('Search term cannot exceed 100 characters'),
// //   query('categoryId')
// //     .optional()
// //     .isInt({ min: 1 })
// //     .withMessage('Category ID must be a positive integer'),
// //   query('subcategory')
// //     .optional()
// //     .isInt({ min: 1 })
// //     .withMessage('Subcategory ID must be a positive integer'),
// //   query('isActive')
// //     .optional()
// //     .isBoolean()
// //     .withMessage('isActive must be a boolean value'),
// //   query('sortBy')
// //     .optional()
// //     .isIn(['name', 'price', 'stock', 'createdAt', 'updatedAt'])
// //     .withMessage('Invalid sort field'),
// //   query('sortOrder')
// //     .optional()
// //     .isIn(['asc', 'desc'])
// //     .withMessage('Sort order must be asc or desc')
// // ];
//
// // router.post('/bulk-upload', protect, authorize('admin', 'manager'), uploadCSV.single('file'), bulkUploadItems);
// // router.get('/image/:filename', serveItemImage);
// // router.get('/', protect, queryValidation, getAllItems);
// // router.get('/stats/overview', protect, authorize('admin', 'manager'), getItemStats);
// // router.get('/low-stock', protect, getLowStockItems);
// // router.get('/stock-with-batches', protect, getStockWithBatches);
// // router.get('/subcategory/:id', protect, param('id').isInt({ min: 1 }).withMessage('Invalid subcategory ID'), getItemsBySubcategory);
// // router.get('/count', protect, getItemsCount);
// // router.get('/:id', protect, getItemValidation, getItemById);
// // router.post('/', protect, authorize('admin', 'manager', 'employee'), createItemValidation, createItem);
// // router.put('/:id', protect, authorize('admin', 'manager', 'employee'), updateItemValidation, updateItem);
// // router.patch('/:id/toggle-status', protect, authorize('admin', 'manager'), getItemValidation, toggleItemStatus);
// // router.delete('/:id', protect, authorize('admin'), getItemValidation, deleteItem);
//
// // export default router;
//
