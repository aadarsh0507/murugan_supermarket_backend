import Item from '../models/Item.js';
import Category from '../models/Category.js';
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

    // Build query
    const query = {};
    
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

    const item = await Item.findById(id)
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
      expiryDate
    } = req.body;

    // Validate subcategory exists and is a leaf category (level 2)
    const subcategoryDoc = await Category.findById(subcategory);
    if (!subcategoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    if (subcategoryDoc.level !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Items can only be added to subcategories (level 2 categories)'
      });
    }

    // Check if SKU already exists
    const existingItem = await Item.findOne({ sku });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Item with this SKU already exists'
      });
    }

    // Check if barcode already exists (if provided)
    if (barcode) {
      const existingBarcode = await Item.findOne({ barcode });
      if (existingBarcode) {
        return res.status(400).json({
          success: false,
          message: 'Item with this barcode already exists'
        });
      }
    }

    const itemData = {
      name,
      sku,
      description,
      subcategory,
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
      expiryDate,
      createdBy: req.user.id
    };

    const item = new Item(itemData);
    await item.save();

    // Populate the created item
    await item.populate([
      { path: 'subcategory', select: 'name level parent' },
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

    console.log('Update embedded item - Looking for item with ID:', req.params.id);
    console.log('Update embedded item - Request body:', req.body);

    // Since items are embedded in categories, we need to find them there
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

                // Update the item
                Object.assign(item, req.body);
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

            // Update the item
            Object.assign(item, req.body);
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
    const { sku = '', search = '', categoryId = '' } = req.query;

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
      return item.batches.filter(batch => batch.isActive).map(batch => ({
        ...itemData,
        batchNumber: batch.batchNumber || 'N/A',
        batchQuantity: batch.quantity || 0,
        purchaseOrderNumber: batch.purchaseOrderNumber || 'N/A',
        purchaseDate: batch.purchaseDate || null,
        costPrice: batch.costPrice || 0,
        hsnNumber: batch.hsnNumber || item.hsnCode || 'N/A',
        expiryDate: batch.expiryDate || null
      }));
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
      return item.batches.filter(batch => batch.isActive).map(batch => ({
        ...itemData,
        batchNumber: batch.batchNumber || 'N/A',
        batchQuantity: batch.quantity || 0,
        purchaseOrderNumber: batch.purchaseOrderNumber || 'N/A',
        purchaseDate: batch.purchaseDate || null,
        costPrice: batch.costPrice || 0,
        hsnNumber: batch.hsnNumber || item.hsnCode || 'N/A',
        expiryDate: batch.expiryDate || null
      }));
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
