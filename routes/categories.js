// Temporarily commented out to isolate login and register modules.
// Original implementation preserved below for future reactivation.

// // import express from 'express';
// // import { body, param, query } from 'express-validator';
// // import {
// //   getAllCategories,
// //   getCategoryById,
// //   createCategory,
// //   updateCategory,
// //   deleteCategory,
// //   toggleCategoryStatus,
// //   getCategoryStats,
// //   getSubcategories,
// //   getCategoryHierarchy,
// //   addSubcategory,
// //   addItemToSubcategory,
// //   updateEmbeddedItem
// // } from '../controllers/categoryController.js';
// // import { protect, authorize } from '../middleware/auth.js';
//
// // const router = express.Router();
//
// // const createCategoryValidation = [
// //   body('name')
// //     .trim()
// //     .notEmpty()
// //     .withMessage('Category name is required')
// //     .isLength({ min: 2, max: 100 })
// //     .withMessage('Category name must be between 2 and 100 characters'),
// //   body('isActive')
// //     .optional()
// //     .isBoolean()
// //     .withMessage('isActive must be a boolean value'),
// //   body('categoryCode')
// //     .optional()
// //     .trim()
// //     .isLength({ min: 2, max: 50 })
// //     .withMessage('Category code must be between 2 and 50 characters')
// // ];
//
// // const addSubcategoryValidation = [
// //   body('name')
// //     .trim()
// //     .notEmpty()
// //     .withMessage('Subcategory name is required')
// //     .isLength({ min: 2, max: 100 })
// //     .withMessage('Subcategory name must be between 2 and 100 characters'),
// //   body('subCategoryCode')
// //     .optional()
// //     .trim()
// //     .isLength({ min: 2, max: 50 })
// //     .withMessage('Subcategory code must be between 2 and 50 characters')
// // ];
//
// // const addItemValidation = [
// //   body('name')
// //     .trim()
// //     .notEmpty()
// //     .withMessage('Item name is required')
// //     .isLength({ min: 2, max: 200 })
// //     .withMessage('Item name must be between 2 and 200 characters')
// // ];
//
// // const updateCategoryValidation = [
// //   param('id').isInt({ min: 1 }).withMessage('Invalid category ID'),
// //   body('name')
// //     .optional()
// //     .trim()
// //     .isLength({ min: 2, max: 100 })
// //     .withMessage('Category name must be between 2 and 100 characters'),
// //   body('isActive')
// //     .optional()
// //     .isBoolean()
// //     .withMessage('isActive must be a boolean value'),
// //   body('categoryCode')
// //     .optional()
// //     .trim()
// //     .isLength({ min: 2, max: 50 })
// //     .withMessage('Category code must be between 2 and 50 characters')
// // ];
//
// // const getCategoryValidation = [
// //   param('id').isInt({ min: 1 }).withMessage('Invalid category ID')
// // ];
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
// //   query('isActive')
// //     .optional()
// //     .isBoolean()
// //     .withMessage('isActive must be a boolean value'),
// //   query('sortBy')
// //     .optional()
// //     .isIn(['name', 'createdAt', 'updatedAt'])
// //     .withMessage('Invalid sort field'),
// //   query('sortOrder')
// //     .optional()
// //     .isIn(['asc', 'desc'])
// //     .withMessage('Sort order must be asc or desc')
// // ];
//
// // const subcategoryParamValidation = [
// //   param('id').isInt({ min: 1 }).withMessage('Invalid category ID'),
// //   param('subcategoryId').isInt({ min: 1 }).withMessage('Invalid subcategory ID')
// // ];
//
// // const updateEmbeddedItemValidation = [
// //   param('itemId').isInt({ min: 1 }).withMessage('Invalid item ID')
// // ];
//
// // router.get('/', protect, queryValidation, getAllCategories);
// // router.post('/', protect, authorize('admin', 'manager'), createCategoryValidation, createCategory);
// // router.get('/stats/overview', protect, authorize('admin', 'manager'), getCategoryStats);
// // router.get('/hierarchy', protect, getCategoryHierarchy);
// // router.get('/:id', protect, getCategoryValidation, getCategoryById);
// // router.put('/:id', protect, authorize('admin', 'manager'), updateCategoryValidation, updateCategory);
// // router.patch('/:id/toggle-status', protect, authorize('admin', 'manager'), getCategoryValidation, toggleCategoryStatus);
// // router.delete('/:id', protect, authorize('admin'), getCategoryValidation, deleteCategory);
// // router.get('/:id/subcategories', protect, getCategoryValidation, getSubcategories);
// // router.post('/:id/subcategories', protect, authorize('admin', 'manager'), addSubcategoryValidation, addSubcategory);
// // router.post('/:id/subcategories/:subcategoryId/items', protect, authorize('admin', 'manager'), subcategoryParamValidation, addItemValidation, addItemToSubcategory);
// // router.put('/items/:itemId', protect, authorize('admin', 'manager', 'employee'), updateEmbeddedItemValidation, updateEmbeddedItem);
//
// // export default router;
//
