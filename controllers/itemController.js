import Item from '../models/Item.js';
import Category from '../models/Category.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Barcode from '../models/Barcode.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to save base64 image to file
const saveBase64Image = async (base64String, itemId, imageIndex = 0) => {
  try {
    // Extract base64 data and mime type
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // Determine file extension from mime type
    const ext = mimeType.split('/')[1] || 'jpg';
    
    // Create filename
    const filename = `item-${itemId}-${imageIndex}-${Date.now()}.${ext}`;
    const filepath = path.join(__dirname, '../uploads/items', filename);
    
    // Ensure directory exists
    const uploadDir = path.join(__dirname, '../uploads/items');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Save file
    fs.writeFileSync(filepath, base64Data, 'base64');
    
    // Return relative URL for database storage
    return `/uploads/items/${filename}`;
  } catch (error) {
    console.error('Error saving base64 image:', error);
    throw error;
  }
};

// @desc    Get all items
// @route   GET /api/items
// @access  Private
export const getAllItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      subcategory = null,
      isActive = true,
      sortBy = 'name',
      sortOrder = 'asc',
      minPrice = null,
      maxPrice = null,
      lowStock = false
    } = req.query;

    // Get user's selected store - required for filtering
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before viewing items. Go to "Select Store" in the sidebar.'
      });
    }

    // Build query
    const query = { store: user.selectedStore._id };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    if (subcategory) {
      query.subcategory = subcategory;
    }

    if (minPrice !== null) {
      query.price = { ...query.price, $gte: parseFloat(minPrice) };
    }

    if (maxPrice !== null) {
      query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$minStock'] };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const items = await Item.find(query)
      .populate('store', 'name code')
      .populate('subcategory', 'name level parent')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(query);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Private
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the ID is a valid MongoDB ObjectId
    // This helps catch cases where routes like /stock-with-batches might be incorrectly matched
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Get user's selected store - required for filtering
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before viewing items. Go to "Select Store" in the sidebar.'
      });
    }

    const item = await Item.findOne({ _id: id, store: user.selectedStore._id })
      .populate('store', 'name code')
      .populate('subcategory', 'name level parent')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new item
// @route   POST /api/items
// @access  Private (Admin/Manager)
export const createItem = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      sku,
      description,
      subcategory,
      price,
      cost,
      stock,
      minStock,
      maxStock,
      unit,
      weight,
      dimensions,
      barcode,
      images,
      tags,
      isActive,
      isDigital,
      requiresPrescription,
      isBOGO,
      expiryDate
    } = req.body;

    // Get user's selected store - required for items
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before creating an item. Go to "Select Store" in the sidebar.'
      });
    }

    // Validate subcategory exists - subcategories are embedded in Category documents
    // Search for the category that contains this subcategory within the selected store
    const categories = await Category.find({ store: user.selectedStore._id });
    let foundSubcategory = null;
    let parentCategory = null;
    
    for (const category of categories) {
      if (category.subcategories && category.subcategories.length > 0) {
        const subcat = category.subcategories.id(subcategory);
        if (subcat) {
          foundSubcategory = subcat;
          parentCategory = category;
          break;
        }
      }
    }

    if (!foundSubcategory) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory not found in the selected store'
      });
    }

    // Check if SKU already exists for this store
    const existingItem = await Item.findOne({ sku, store: user.selectedStore._id });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Item with this SKU already exists in this store'
      });
    }

    // Check if barcode already exists (if provided)
    if (barcode) {
      const existingBarcode = await Item.findOne({ barcode, store: user.selectedStore._id });
      if (existingBarcode) {
        return res.status(400).json({
          success: false,
          message: 'Item with this barcode already exists in this store'
        });
      }
    }

    // Use the parent category ID since Item.subcategory references Category document
    // Subcategories are embedded, so we reference the parent category
    const itemData = {
      name,
      sku,
      description,
      subcategory: parentCategory._id, // Reference to parent Category document
      price,
      cost,
      stock: stock || 0,
      minStock: minStock || 0,
      maxStock,
      unit,
      weight,
      dimensions,
      barcode,
      images: images || [],
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true,
      isDigital: isDigital || false,
      requiresPrescription: requiresPrescription || false,
      isBOGO: isBOGO || false,
      expiryDate,
      store: user.selectedStore._id,
      storeName: user.selectedStore.name,
      createdBy: req.user.id
    };

    const item = new Item(itemData);
    await item.save();

    // Populate the created item
    await item.populate([
      { path: 'store', select: 'name code' },
      { path: 'subcategory', select: 'name level parent store storeName', options: { virtuals: false } },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item
    });
  } catch (error) {
    console.error('Error creating item:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Item with this SKU or barcode already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private (Admin/Manager)
export const updateItem = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Update item validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    console.log('Update item - Looking for item with ID:', req.params.id);
    console.log('Update item - Request body:', req.body);

    // Get user's selected store
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before updating an item.'
      });
    }

    // First, try to find the item as a standalone document
    let standaloneItem = await Item.findOne({ _id: req.params.id, store: user.selectedStore._id });
    
    if (standaloneItem) {
      // Handle standalone Item document
      console.log('Update item - Found standalone item:', standaloneItem.name);
      
      // Process images if they are base64 strings
      if (req.body.images && Array.isArray(req.body.images)) {
        const processedImages = [];
        for (let k = 0; k < req.body.images.length; k++) {
          const img = req.body.images[k];
          if (img.url && img.url.startsWith('data:image')) {
            try {
              const fileUrl = await saveBase64Image(img.url, req.params.id, k);
              processedImages.push({
                url: fileUrl,
                alt: img.alt || standaloneItem.name || 'Item image',
                isPrimary: img.isPrimary || false
              });
              console.log(`Saved image ${k} to: ${fileUrl}`);
            } catch (error) {
              console.error(`Error saving image ${k}:`, error);
              processedImages.push(img);
            }
          } else {
            processedImages.push(img);
          }
        }
        req.body.images = processedImages;
      }

      // Update the item with all fields from req.body (including isBOGO)
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          standaloneItem[key] = req.body[key];
        }
      });
      standaloneItem.updatedBy = req.user.id;
      
      await standaloneItem.save();

      // Populate before sending response
      await standaloneItem.populate([
        { path: 'store', select: 'name code' },
        { path: 'subcategory', select: 'name level parent store storeName', options: { virtuals: false } },
        { path: 'createdBy', select: 'firstName lastName' },
        { path: 'updatedBy', select: 'firstName lastName' }
      ]);

      return res.json({
        success: true,
        message: 'Item updated successfully',
        data: standaloneItem
      });
    }

    // Fallback: Since items might be embedded in categories, we need to find them there
    // First, try to find the item in any category/subcategory
    const categories = await Category.find({
      $or: [
        { 'subcategories.items._id': req.params.id },
        { 'items._id': req.params.id }
      ]
    });

    console.log('Update embedded item - Found categories:', categories.length);

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in any category'
      });
    }

    let updatedItem = null;
    let updatedCategory = null;

    // Search through categories to find and update the item
    for (const category of categories) {
      // Check subcategories
      if (category.subcategories && category.subcategories.length > 0) {
        for (let i = 0; i < category.subcategories.length; i++) {
          const subcategory = category.subcategories[i];
          if (subcategory.items && subcategory.items.length > 0) {
            for (let j = 0; j < subcategory.items.length; j++) {
              const item = subcategory.items[j];
              if (item._id.toString() === req.params.id) {
                console.log('Update embedded item - Found item in subcategory:', {
                  category: category.name,
                  subcategory: subcategory.name,
                  item: item.name
                });

                // Process images if they are base64 strings
                if (req.body.images && Array.isArray(req.body.images)) {
                  const processedImages = [];
                  for (let k = 0; k < req.body.images.length; k++) {
                    const img = req.body.images[k];
                    if (img.url && img.url.startsWith('data:image')) {
                      try {
                        // Save base64 image as file
                        const fileUrl = await saveBase64Image(img.url, req.params.id, k);
                        processedImages.push({
                          url: fileUrl,
                          alt: img.alt || item.name || 'Item image',
                          isPrimary: img.isPrimary || false
                        });
                        console.log(`Saved image ${k} to: ${fileUrl}`);
                      } catch (error) {
                        console.error(`Error saving image ${k}:`, error);
                        // Keep original image if saving fails
                        processedImages.push(img);
                      }
                    } else {
                      processedImages.push(img);
                    }
                  }
                  req.body.images = processedImages;
                }

                // Update the item - explicitly handle isBOGO and all other fields
                Object.keys(req.body).forEach(key => {
                  if (req.body[key] !== undefined) {
                    item[key] = req.body[key];
                  }
                });
                // Mark the subcategory and category as modified to ensure save
                subcategory.markModified('items');
                category.markModified('subcategories');
                updatedItem = item;
                updatedCategory = category;
                break;
              }
            }
          }
        }
      }

      // Check direct items in category
      if (category.items && category.items.length > 0) {
        for (let i = 0; i < category.items.length; i++) {
          const item = category.items[i];
          if (item._id.toString() === req.params.id) {
            console.log('Update embedded item - Found item in category:', {
              category: category.name,
              item: item.name
            });

            // Process images if they are base64 strings
            if (req.body.images && Array.isArray(req.body.images)) {
              const processedImages = [];
              for (let k = 0; k < req.body.images.length; k++) {
                const img = req.body.images[k];
                if (img.url && img.url.startsWith('data:image')) {
                  try {
                    // Save base64 image as file
                    const fileUrl = await saveBase64Image(img.url, req.params.id, k);
                    processedImages.push({
                      url: fileUrl,
                      alt: img.alt || item.name || 'Item image',
                      isPrimary: img.isPrimary || false
                    });
                    console.log(`Saved image ${k} to: ${fileUrl}`);
                  } catch (error) {
                    console.error(`Error saving image ${k}:`, error);
                    // Keep original image if saving fails
                    processedImages.push(img);
                  }
                } else {
                  processedImages.push(img);
                }
              }
              req.body.images = processedImages;
            }

            // Update the item - explicitly handle isBOGO and all other fields
            Object.keys(req.body).forEach(key => {
              if (req.body[key] !== undefined) {
                item[key] = req.body[key];
              }
            });
            // Mark the category as modified to ensure save
            category.markModified('items');
            updatedItem = item;
            updatedCategory = category;
            break;
          }
        }
      }

      if (updatedItem) break;
    }

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Save the updated category
    await updatedCategory.save();

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem
    });

  } catch (error) {
    console.error('Error updating embedded item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private (Admin)
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if item can be deleted
    const canDeleteResult = await item.canDelete();
    if (!canDeleteResult.canDelete) {
      return res.status(400).json({
        success: false,
        message: canDeleteResult.reason
      });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Toggle item status
// @route   PATCH /api/items/:id/toggle-status
// @access  Private (Admin/Manager)
export const toggleItemStatus = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    item.isActive = !item.isActive;
    item.updatedBy = req.user.id;
    await item.save();

    res.json({
      success: true,
      message: `Item ${item.isActive ? 'activated' : 'deactivated'} successfully`,
      data: item
    });
  } catch (error) {
    console.error('Error toggling item status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling item status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get low stock items
// @route   GET /api/items/low-stock
// @access  Private
export const getLowStockItems = async (req, res) => {
  try {
    const items = await Item.getLowStockItems();

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching low stock items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get items by subcategory
// @route   GET /api/items/subcategory/:id
// @access  Private
export const getItemsBySubcategory = async (req, res) => {
  try {
    const items = await Item.getItemsByCategory(req.params.id);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching items by subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching items by subcategory',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get item statistics
// @route   GET /api/items/stats/overview
// @access  Private (Admin/Manager)
export const getItemStats = async (req, res) => {
  try {
    const totalItems = await Item.countDocuments();
    const activeItems = await Item.countDocuments({ isActive: true });
    const inactiveItems = totalItems - activeItems;
    const lowStockItems = await Item.countDocuments({
      $expr: { $lte: ['$stock', '$minStock'] }
    });
    const outOfStockItems = await Item.countDocuments({ stock: 0 });

    res.json({
      success: true,
      data: {
        totalItems,
        activeItems,
        inactiveItems,
        lowStockItems,
        outOfStockItems
      }
    });
  } catch (error) {
    console.error('Error fetching item stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching item statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get stock with batch numbers
// @route   GET /api/items/stock-with-batches
// @access  Private
export const getStockWithBatches = async (req, res) => {
  try {
    const { sku = '', search = '', categoryId = '', storeId = '' } = req.query;

    // Get purchase orders filtered by store if storeId provided
    const poQuery = {};
    if (storeId) {
      poQuery.store = storeId;
    }
    
    // Get all purchase orders to lookup expiry dates
    const purchaseOrders = await PurchaseOrder.find(poQuery)
      .select('poNumber items store');
    
    // Create a map of SKU + Batch Number + PO Number -> expiryDate and store
    const expiryDateMap = new Map();
    const storeMap = new Map(); // Map PO number to store ID
    purchaseOrders.forEach(po => {
      if (po.store) {
        storeMap.set(po.poNumber, po.store.toString());
      }
      if (po.items && Array.isArray(po.items)) {
        po.items.forEach(item => {
          if (item.sku && item.batchNumber && item.expiryDate) {
            const key = `${item.sku}_${item.batchNumber}_${po.poNumber}`;
            expiryDateMap.set(key, item.expiryDate);
          }
        });
      }
    });
    
    // If storeId is provided, get barcodes for that store to count actual stock
    let storeStockMap = new Map(); // Map: `${sku}_${batchNumber}` -> quantity
    if (storeId) {
      const barcodes = await Barcode.find({ 
        store: storeId,
        isUsed: false 
      }).select('itemSku batchNumber');
      
      barcodes.forEach(barcode => {
        const key = `${barcode.itemSku}_${barcode.batchNumber || 'NO_BATCH'}`;
        storeStockMap.set(key, (storeStockMap.get(key) || 0) + 1);
      });
    }

    // Get all items from standalone Item model
    const query = {};
    if (sku) {
      query.sku = { $regex: sku, $options: 'i' };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const standaloneItems = await Item.find(query)
      .populate('subcategory', 'name')
      .select('name sku subcategory batches stock cost hsnCode');

    // Get all items from embedded categories
    const categoryQuery = {};
    if (categoryId) {
      categoryQuery._id = categoryId;
    }

    const categories = await Category.find(categoryQuery);
    const embeddedItems = [];

    categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.items.forEach(item => {
          if (!sku || item.sku.toLowerCase().includes(sku.toLowerCase())) {
            if (!search || 
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.sku.toLowerCase().includes(search.toLowerCase())) {
              embeddedItems.push({
                ...item.toObject(),
                categoryName: category.name,
                subcategoryName: subcategory.name,
                source: 'embedded'
              });
            }
          }
        });
      });
    });

    // Format standalone items
    const standaloneFormatted = standaloneItems.flatMap(item => {
      const itemData = {
        itemName: item.name,
        sku: item.sku,
        categoryName: item.subcategory?.name || 'N/A',
        subcategoryName: 'N/A', // Standalone items don't have separate subcategories
        totalStock: item.stock || 0,
        batches: item.batches || [],
        source: 'standalone'
      };

      // If no batches, return item with empty batch array
      if (!item.batches || item.batches.length === 0) {
        return [{
          ...itemData,
          batchNumber: 'N/A',
          batchQuantity: item.stock || 0,
          purchaseOrderNumber: 'N/A',
          purchaseDate: null,
          costPrice: item.cost || 0,
          hsnNumber: item.hsnCode || 'N/A',
          expiryDate: null
        }];
      }

      // Return one row per batch
      return item.batches.filter(batch => batch.isActive).map(batch => {
        // Lookup expiry date from purchase order if not in batch
        let expiryDate = batch.expiryDate || null;
        if (!expiryDate && batch.purchaseOrderNumber && batch.batchNumber) {
          const key = `${item.sku}_${batch.batchNumber}_${batch.purchaseOrderNumber}`;
          expiryDate = expiryDateMap.get(key) || null;
        }
        
        // If storeId is provided, use actual stock from barcodes, otherwise use batch quantity
        let batchQuantity = batch.quantity || 0;
        if (storeId) {
          const stockKey = `${item.sku}_${batch.batchNumber || 'NO_BATCH'}`;
          const actualStock = storeStockMap.get(stockKey);
          // Only include batches that have stock in this store
          if (actualStock === undefined) {
            return null; // Skip batches not in this store
          }
          batchQuantity = actualStock;
        }
        
        return {
          ...itemData,
          batchNumber: batch.batchNumber || 'N/A',
          batchQuantity: batchQuantity,
          purchaseOrderNumber: batch.purchaseOrderNumber || 'N/A',
          purchaseDate: batch.purchaseDate || null,
          costPrice: batch.costPrice || 0,
          hsnNumber: batch.hsnNumber || item.hsnCode || 'N/A',
          expiryDate: expiryDate,
          storeId: storeId || null
        };
      }).filter(b => b !== null); // Remove null entries
    });

    // Format embedded items
    const embeddedFormatted = embeddedItems.flatMap(item => {
      const itemData = {
        itemName: item.name,
        sku: item.sku,
        categoryName: item.categoryName || 'N/A',
        subcategoryName: item.subcategoryName || 'N/A',
        totalStock: item.stock || 0,
        batches: item.batches || [],
        source: 'embedded'
      };

      // If no batches, return item with empty batch array
      if (!item.batches || item.batches.length === 0) {
        return [{
          ...itemData,
          batchNumber: 'N/A',
          batchQuantity: item.stock || 0,
          purchaseOrderNumber: 'N/A',
          purchaseDate: null,
          costPrice: item.cost || 0,
          hsnNumber: item.hsnCode || 'N/A',
          expiryDate: null
        }];
      }

      // Return one row per batch
      return item.batches.filter(batch => batch.isActive).map(batch => {
        // Lookup expiry date from purchase order if not in batch
        let expiryDate = batch.expiryDate || null;
        if (!expiryDate && batch.purchaseOrderNumber && batch.batchNumber) {
          const key = `${item.sku}_${batch.batchNumber}_${batch.purchaseOrderNumber}`;
          expiryDate = expiryDateMap.get(key) || null;
        }
        
        // If storeId is provided, use actual stock from barcodes, otherwise use batch quantity
        let batchQuantity = batch.quantity || 0;
        if (storeId) {
          const stockKey = `${item.sku}_${batch.batchNumber || 'NO_BATCH'}`;
          const actualStock = storeStockMap.get(stockKey);
          // Only include batches that have stock in this store
          if (actualStock === undefined) {
            return null; // Skip batches not in this store
          }
          batchQuantity = actualStock;
        }
        
        return {
          ...itemData,
          batchNumber: batch.batchNumber || 'N/A',
          batchQuantity: batchQuantity,
          purchaseOrderNumber: batch.purchaseOrderNumber || 'N/A',
          purchaseDate: batch.purchaseDate || null,
          costPrice: batch.costPrice || 0,
          hsnNumber: batch.hsnNumber || item.hsnCode || 'N/A',
          expiryDate: expiryDate,
          storeId: storeId || null
        };
      }).filter(b => b !== null); // Remove null entries
    });

    // Combine and sort
    const allStockData = [...standaloneFormatted, ...embeddedFormatted].sort((a, b) => {
      // Sort by item name, then by batch number
      if (a.itemName !== b.itemName) {
        return a.itemName.localeCompare(b.itemName);
      }
      return (a.batchNumber || '').localeCompare(b.batchNumber || '');
    });

    res.json({
      success: true,
      data: allStockData
    });
  } catch (error) {
    console.error('Error fetching stock with batches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stock with batches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to get MIME type from file extension
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff'
  };
  return mimeTypes[ext] || 'image/jpeg'; // Default to jpeg if unknown
};

// @desc    Serve item images
// @route   GET /api/items/image/:filename
// @access  Public
export const serveItemImage = async (req, res) => {
  try {
    const filename = req.params.filename;
    
    console.log('serveItemImage - Requested filename:', filename);
    
    // Validate filename to prevent directory traversal attacks
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      console.log('serveItemImage - Invalid filename detected');
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }
    
    const imagePath = path.join(__dirname, '../uploads/items', filename);
    console.log('serveItemImage - Looking for file at:', imagePath);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log('serveItemImage - File not found at:', imagePath);
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    console.log('serveItemImage - File found, serving:', filename);
    
    // Get appropriate MIME type based on file extension
    const mimeType = getMimeType(filename);
    console.log('serveItemImage - MIME type:', mimeType);
    
    // Set appropriate headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Send the file
    res.sendFile(imagePath);
    
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
