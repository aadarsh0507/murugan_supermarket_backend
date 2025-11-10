// Temporarily commented out to isolate login and register modules.
// Original implementation preserved below for future reactivation.

// // import { validationResult } from 'express-validator';
// // import {
// //   listCategories,
// //   getCategoryById as getCategoryByIdRepo,
// //   createCategory as createCategoryRepo,
// //   updateCategory as updateCategoryRepo,
// //   deleteCategory as deleteCategoryRepo,
// //   toggleCategoryStatus as toggleCategoryStatusRepo,
// //   listSubcategories,
// //   createSubcategory,
// //   getCategoryStats as getCategoryStatsRepo,
// //   getCategoryHierarchy as getCategoryHierarchyRepo
// // } from '../repositories/categoryRepository.js';
//
// // const respondValidationErrors = (req, res) => {
// //   const errors = validationResult(req);
// //   if (!errors.isEmpty()) {
// //     res.status(400).json({
// //       success: false,
// //       message: 'Validation failed',
// //       errors: errors.array()
// //     });
// //     return true;
// //   }
// //   return false;
// // };
//
// // export const getAllCategories = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
//
// //     const page = parseInt(req.query.page, 10) || 1;
// //     const limit = parseInt(req.query.limit, 10) || 10;
// //     const search = req.query.search?.trim();
// //     const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' || req.query.isActive === true : undefined;
// //     const sortBy = req.query.sortBy || 'name';
// //     const sortOrder = req.query.sortOrder || 'asc';
//
// //     const { categories, total } = await listCategories({
// //       page,
// //       limit,
// //       search,
// //       isActive,
// //       sortBy,
// //       sortOrder
// //     });
//
// //     res.json({
// //       success: true,
// //       data: {
// //         categories,
// //         pagination: {
// //           currentPage: page,
// //           totalPages: Math.max(1, Math.ceil(total / limit)),
// //           totalItems: total,
// //           itemsPerPage: limit
// //         }
// //       }
// //     });
// //   } catch (error) {
// //     console.error('Error fetching categories:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while fetching categories'
// //     });
// //   }
// // };
//
// // export const getCategoryById = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
//
// //     const categoryId = Number(req.params.id);
// //     const category = await getCategoryByIdRepo(categoryId);
//
// //     if (!category) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Category not found'
// //       });
// //     }
//
// //     res.json({
// //       success: true,
// //       data: category
// //     });
// //   } catch (error) {
// //     console.error('Error fetching category:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while fetching category'
// //     });
// //   }
// // };
//
// // export const createCategory = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
//
// //     const { name, categoryCode, isActive = true } = req.body;
//
// //     const category = await createCategoryRepo({
// //       name: name.trim(),
// //       categoryCode: categoryCode || name.trim().toUpperCase().replace(/\s+/g, '_'),
// //       isActive,
// //       createdBy: req.user?._id
// //     });
//
// //     res.status(201).json({
// //       success: true,
// //       message: 'Category created successfully',
// //       data: category
// //     });
// //   } catch (error) {
// //     console.error('Error creating category:', error);
// //     if (error.code === 'CATEGORY_EXISTS' || error.code === 'CATEGORY_CODE_EXISTS') {
// //       return res.status(400).json({
// //         success: false,
// //         message: error.message
// //       });
// //     }
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while creating category'
// //     });
// //   }
// // };
//
// // export const updateCategory = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
//
// //     const categoryId = Number(req.params.id);
// //     const { name, categoryCode, isActive } = req.body;
//
// //     try {
// //       const category = await updateCategoryRepo(categoryId, {
// //         name,
// //         categoryCode,
// //         isActive,
// //         updatedBy: req.user?._id
// //       });
//
// //       if (!category) {
// //         return res.status(404).json({
// //           success: false,
// //           message: 'Category not found'
// //         });
// //       }
//
// //       res.json({
// //         success: true,
// //         message: 'Category updated successfully',
// //         data: category
// //       });
// //     } catch (error) {
// //       if (error.code === 'CATEGORY_EXISTS' || error.code === 'CATEGORY_CODE_EXISTS') {
// //         return res.status(400).json({
// //           success: false,
// //           message: error.message
// //         });
// //       }
// //       throw error;
// //     }
// //   } catch (error) {
// //     console.error('Error updating category:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while updating category'
// //     });
// //   }
// // };
//
// // export const deleteCategory = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
//
// //     const categoryId = Number(req.params.id);
//
// //     try {
// //       await deleteCategoryRepo(categoryId);
// //       res.json({
// //         success: true,
// //         message: 'Category deleted successfully'
// //       });
// //     } catch (error) {
// //       if (error.code === 'CATEGORY_HAS_ITEMS') {
// //         return res.status(400).json({
// //           success: false,
// //           message: error.message
// //         });
// //       }
// //       throw error;
// //     }
// //   } catch (error) {
// //     console.error('Error deleting category:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while deleting category'
// //     });
// //   }
// // };
//
// // export const toggleCategoryStatus = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
// //     const categoryId = Number(req.params.id);
//
// //     const category = await toggleCategoryStatusRepo(categoryId);
// //     if (!category) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Category not found'
// //       });
// //     }
//
// //     res.json({
// //       success: true,
// //       message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
// //       data: category
// //     });
// //   } catch (error) {
// //     console.error('Error toggling category status:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while toggling category status'
// //     });
// //   }
// // };
//
// // export const getSubcategories = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
// //     const categoryId = Number(req.params.id);
//
// //     const category = await getCategoryByIdRepo(categoryId);
// //     if (!category) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Category not found'
// //       });
// //     }
//
// //     const subcategories = await listSubcategories(categoryId);
//
// //     res.json({
// //       success: true,
// //       data: {
// //         parentCategory: {
// //           id: category.id,
// //           name: category.name,
// //           categoryCode: category.categoryCode,
// //           isActive: category.isActive
// //         },
// //         subcategories
// //       }
// //     });
// //   } catch (error) {
// //     console.error('Error fetching subcategories:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while fetching subcategories'
// //     });
// //   }
// // };
//
// // export const getCategoryHierarchy = async (req, res) => {
// //   try {
// //     const hierarchy = await getCategoryHierarchyRepo();
// //     res.json({
// //       success: true,
// //       data: hierarchy
// //     });
// //   } catch (error) {
// //     console.error('Error fetching category hierarchy:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while fetching category hierarchy'
// //     });
// //   }
// // };
//
// // export const addSubcategory = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
// //     const categoryId = Number(req.params.id);
//
// //     const category = await getCategoryByIdRepo(categoryId);
// //     if (!category) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Category not found'
// //       });
// //     }
//
// //     const { name, subCategoryCode, isActive = true } = req.body;
//
// //     try {
// //       const subcategory = await createSubcategory(categoryId, {
// //         name: name.trim(),
// //         subCategoryCode: subCategoryCode || `${category.categoryCode || category.name.replace(/\s+/g, '_')}_${name.trim().toUpperCase()}`,
// //         isActive,
// //         createdBy: req.user?._id
// //       });
//
// //       res.status(201).json({
// //         success: true,
// //         message: 'Subcategory created successfully',
// //         data: subcategory
// //       });
// //     } catch (error) {
// //       if (error.code === 'SUBCATEGORY_EXISTS') {
// //         return res.status(400).json({
// //           success: false,
// //           message: error.message
// //         });
// //       }
// //       throw error;
// //     }
// //   } catch (error) {
// //     console.error('Error adding subcategory:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while adding subcategory'
// //     });
// //   }
// // };
//
// // export const getCategoryStats = async (req, res) => {
// //   try {
// //     const stats = await getCategoryStatsRepo();
// //     res.json({
// //       success: true,
// //       data: stats
// //     });
// //   } catch (error) {
// //     console.error('Error fetching category stats:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while fetching category statistics'
// //     });
// //   }
// // };
//
// // export const addItemToSubcategory = async (req, res) => {
// //   res.status(501).json({
// //     success: false,
// //     message: 'Use the items endpoint to create items for a subcategory in the MySQL version.'
// //   });
// // };
//
// // export const updateEmbeddedItem = async (req, res) => {
// //   res.status(501).json({
// //     success: false,
// //     message: 'Embedded item updates are not supported. Use /api/items endpoints instead.'
// //   });
// // };
//
