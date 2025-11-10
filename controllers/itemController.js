// Temporarily commented out to isolate login and register modules.
// Original implementation preserved below for future reactivation.

// // import path from 'path';
// // import fs from 'fs';
// // import { fileURLToPath } from 'url';
// // import { validationResult } from 'express-validator';
// // import {
// //   listItems,
// //   getItemById as getItemByIdRepo,
// //   createItem as createItemRepo,
// //   updateItem as updateItemRepo,
// //   deleteItem as deleteItemRepo,
// //   toggleItemStatus as toggleItemStatusRepo,
// //   countItems,
// //   getItemStats as getItemStatsRepo,
// //   getLowStockItems as getLowStockItemsRepo,
// //   getItemsBySubcategory as getItemsBySubcategoryRepo
// // } from '../repositories/itemRepository.js';
//
// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);
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
// // export const getAllItems = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
// //     const page = parseInt(req.query.page, 10) || 1;
// //     const limit = parseInt(req.query.limit, 10) || 50;
// //     const search = req.query.search?.trim();
// //     const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
// //     const subCategoryId = req.query.subcategory ? Number(req.query.subcategory) : undefined;
// //     const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' || req.query.isActive === true : undefined;
// //     const sortBy = req.query.sortBy || 'name';
// //     const sortOrder = req.query.sortOrder || 'asc';
//
// //     const { items, total } = await listItems({
// //       page,
// //       limit,
// //       search,
// //       categoryId,
// //       subCategoryId,
// //       isActive,
// //       sortBy,
// //       sortOrder
// //     });
//
// //     res.json({
// //       success: true,
// //       data: {
// //         items,
// //         pagination: {
// //           currentPage: page,
// //           totalPages: Math.max(1, Math.ceil(total / limit)),
// //           totalItems: total,
// //           itemsPerPage: limit
// //         }
// //       }
// //     });
// //   } catch (error) {
// //     console.error('Error fetching items:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while fetching items'
// //     });
// //   }
// // };
//
// // export const getItemById = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
// //     const item = await getItemByIdRepo(Number(req.params.id));
// //     if (!item) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Item not found'
// //       });
// //     }
// //     res.json({
// //       success: true,
// //       data: item
// //     });
// //   } catch (error) {
// //     console.error('Error fetching item:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while fetching item'
// //     });
// //   }
// // };
//
// // export const getItemsCount = async (req, res) => {
// //   try {
// //     const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
// //     const subCategoryId = req.query.subcategory ? Number(req.query.subcategory) : undefined;
// //     const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' || req.query.isActive === true : undefined;
// //     const count = await countItems({ categoryId, subCategoryId, isActive });
// //     res.json({
// //       success: true,
// //       data: { count }
// //     });
// //   } catch (error) {
// //     console.error('Error getting items count:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while getting items count'
// //     });
// //   }
// // };
//
// // export const createItem = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
//
// //     const item = await createItemRepo({
// //       itemCode: req.body.itemCode || req.body.sku || req.body.name?.toUpperCase().replace(/\s+/g, '_'),
// //       barcode: req.body.barcode,
// //       name: req.body.name,
// //       brand: req.body.brand,
// //       categoryId: Number(req.body.categoryId || req.body.category || req.body.subcategory),
// //       subCategoryId: Number(req.body.subCategoryId || req.body.subcategory || req.body.category),
// //       primarySupplierId: req.body.primarySupplierId ? Number(req.body.primarySupplierId) : null,
// //       uom: req.body.unit || req.body.uom,
// //       packSize: req.body.packSize,
// //       taxRate: Number(req.body.taxRate ?? req.body.tax ?? 0),
// //       mrp: Number(req.body.mrp ?? req.body.price ?? 0),
// //       purchasePrice: Number(req.body.purchasePrice ?? req.body.cost ?? 0),
// //       sellingPrice: Number(req.body.sellingPrice ?? req.body.price ?? 0),
// //       reorderLevel: Number(req.body.reorderLevel ?? req.body.minStock ?? 0),
// //       isActive: req.body.isActive !== undefined ? req.body.isActive : true,
// //       createdBy: req.user?._id
// //     });
//
// //     res.status(201).json({
// //       success: true,
// //       message: 'Item created successfully',
// //       data: item
// //     });
// //   } catch (error) {
// //     console.error('Error creating item:', error);
// //     if (error.code === 'ITEM_CODE_EXISTS' || error.code === 'ITEM_BARCODE_EXISTS') {
// //       return res.status(400).json({
// //         success: false,
// //         message: error.message
// //       });
// //     }
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while creating item'
// //     });
// //   }
// // };
//
// // export const updateItem = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
//
// //     try {
// //       const item = await updateItemRepo(Number(req.params.id), {
// //         itemCode: req.body.itemCode,
// //         barcode: req.body.barcode,
// //         name: req.body.name,
// //         brand: req.body.brand,
// //         categoryId: req.body.categoryId ? Number(req.body.categoryId) : undefined,
// //         subCategoryId: req.body.subCategoryId ? Number(req.body.subCategoryId) : undefined,
// //         primarySupplierId: req.body.primarySupplierId ? Number(req.body.primarySupplierId) : undefined,
// //         uom: req.body.unit || req.body.uom,
// //         packSize: req.body.packSize,
// //         taxRate: req.body.taxRate !== undefined ? Number(req.body.taxRate) : undefined,
// //         mrp: req.body.mrp !== undefined ? Number(req.body.mrp) : undefined,
// //         purchasePrice: req.body.purchasePrice !== undefined ? Number(req.body.purchasePrice) : undefined,
// //         sellingPrice: req.body.sellingPrice !== undefined ? Number(req.body.sellingPrice) : undefined,
// //         reorderLevel: req.body.reorderLevel !== undefined ? Number(req.body.reorderLevel) : undefined,
// //         isActive: req.body.isActive
// //       });
//
// //       if (!item) {
// //         return res.status(404).json({
// //           success: false,
// //           message: 'Item not found'
// //         });
// //       }
//
// //       res.json({
// //         success: true,
// //         message: 'Item updated successfully',
// //         data: item
// //       });
// //     } catch (error) {
// //       if (error.code === 'ITEM_CODE_EXISTS' || error.code === 'ITEM_BARCODE_EXISTS') {
// //         return res.status(400).json({
// //           success: false,
// //           message: error.message
// //         });
// //       }
// //       throw error;
// //     }
// //   } catch (error) {
// //     console.error('Error updating item:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while updating item'
// //     });
// //   }
// // };
//
// // export const deleteItem = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
// //     await deleteItemRepo(Number(req.params.id));
// //     res.json({
// //       success: true,
// //       message: 'Item deleted successfully'
// //     });
// //   } catch (error) {
// //     console.error('Error deleting item:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while deleting item'
// //     });
// //   }
// // };
//
// // export const toggleItemStatus = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
// //     const item = await toggleItemStatusRepo(Number(req.params.id));
// //     if (!item) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Item not found'
// //       });
// //     }
// //     res.json({
// //       success: true,
// //       message: `Item ${item.isActive ? 'activated' : 'deactivated'} successfully`,
// //       data: item
// //     });
// //   } catch (error) {
// //     console.error('Error toggling item status:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while toggling item status'
// //     });
// //   }
// // };
//
// // export const getItemStats = async (req, res) => {
// //   try {
// //     const stats = await getItemStatsRepo();
// //     res.json({
// //       success: true,
// //       data: stats
// //     });
// //   } catch (error) {
// //     console.error('Error fetching item stats:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while fetching item statistics'
// //     });
// //   }
// // };
//
// // export const getLowStockItems = async (req, res) => {
// //   try {
// //     const items = await getLowStockItemsRepo();
// //     res.json({
// //       success: true,
// //       data: items
// //     });
// //   } catch (error) {
// //     console.error('Error fetching low stock items:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while fetching low stock items'
// //     });
// //   }
// // };
//
// // export const getItemsBySubcategory = async (req, res) => {
// //   try {
// //     if (respondValidationErrors(req, res)) return;
// //     const items = await getItemsBySubcategoryRepo(Number(req.params.id));
// //     res.json({
// //       success: true,
// //       data: items
// //     });
// //   } catch (error) {
// //     console.error('Error fetching items by subcategory:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Server error while fetching items by subcategory'
// //     });
// //   }
// // };
//
// // export const getStockWithBatches = async (req, res) => {
// //   res.status(501).json({
// //     success: false,
// //     message: 'Batch-level stock tracking is not implemented in the MySQL version yet.'
// //   });
// // };
//
// // export const serveItemImage = async (req, res) => {
// //   try {
// //     const filename = req.params.filename;
//
// //     if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Invalid filename'
// //       });
// //     }
//
// //     const imagePath = path.join(__dirname, '../uploads/items', filename);
//
// //     if (!fs.existsSync(imagePath)) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Image not found'
// //       });
// //     }
//
// //     res.sendFile(imagePath);
// //   } catch (error) {
// //     console.error('Error serving image:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error serving image'
// //     });
// //   }
// // };
//
// // export const bulkUploadItems = async (req, res) => {
// //   res.status(501).json({
// //     success: false,
// //     message: 'Bulk upload is not yet implemented for the MySQL version.'
// //   });
// // };
//
