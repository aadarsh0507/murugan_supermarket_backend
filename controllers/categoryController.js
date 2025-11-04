import Category from '../models/Category.js';
import { validationResult } from 'express-validator';
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

// @desc    Get all categories with embedded subcategories and items
// @route   GET /api/categories
// @access  Private
export const getAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      isActive = true,
      sortBy = 'name',
      sortOrder = 'asc',
      includeSubcategories = false
    } = req.query;

    // Get user's selected store - required for filtering
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before viewing categories. Go to "Select Store" in the sidebar.'
      });
    }

    const storeId = user.selectedStore._id;
    const storeIdStr = storeId.toString();
    console.log(`[getAllCategories] User selected store: ${storeId} (${user.selectedStore.name})`);

    // Also check all categories for debugging
    const allCategoriesCount = await Category.countDocuments({});
    console.log(`[getAllCategories] Total categories in DB: ${allCategoriesCount}`);
    
    // Check what stores are in the categories
    const sampleCategories = await Category.find({}).limit(5).select('name store');
    console.log(`[getAllCategories] Sample categories:`, sampleCategories.map(c => ({
      name: c.name,
      store: c.store?.toString() || c.store,
      storeType: typeof c.store
    })));

    // Build query - handle both ObjectId and string formats for store
    // Try matching by ObjectId first, then by string
    let query = {
      $or: [
        { store: storeId },
        { store: storeIdStr }
      ]
    };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }
    
    // Check how many categories match this query
    const matchingCount = await Category.countDocuments(query);
    console.log(`[getAllCategories] Categories matching store filter: ${matchingCount}`);
    
    // If no categories match, try without store filter (temporary - for debugging)
    if (matchingCount === 0) {
      console.log(`[getAllCategories] WARNING: No categories found for store ${storeIdStr}. Showing all categories.`);
      query = {};
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }
      if (isActive !== undefined) {
        query.isActive = isActive === 'true' || isActive === true;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const categories = await Category.find(query)
      .populate('store', 'name code')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Since categories are already filtered by store, items within should match
    // But we'll still filter items to be safe (in case of data inconsistencies)
    // storeIdStr is already defined above
    const filteredCategories = categories.map(category => {
      const categoryObj = category.toObject();
      // Filter items in each subcategory by store
      if (categoryObj.subcategories) {
        categoryObj.subcategories = categoryObj.subcategories.map(subcategory => {
          if (subcategory.items && subcategory.items.length > 0) {
            const filteredItems = subcategory.items.filter(item => {
              // Handle both string and ObjectId formats
              if (!item.store) {
                // If item has no store field, include it (legacy data)
                return true;
              }
              const itemStoreId = typeof item.store === 'string' 
                ? item.store 
                : item.store.toString();
              return itemStoreId === storeIdStr;
            });
            
            // Log if filtering removed items (for debugging)
            if (filteredItems.length !== subcategory.items.length) {
              console.log(`Filtered ${subcategory.items.length - filteredItems.length} items from ${subcategory.name} (store mismatch)`);
            }
            
            subcategory.items = filteredItems;
          }
          return subcategory;
        });
      }
      return categoryObj;
    });

    const total = await Category.countDocuments(query);

    // Debug logging
    console.log(`Found ${filteredCategories.length} categories for store ${user.selectedStore.name}`);
    filteredCategories.forEach(cat => {
      const totalItems = cat.subcategories?.reduce((sum, sub) => sum + (sub.items?.length || 0), 0) || 0;
      console.log(`  - ${cat.name}: ${cat.subcategories?.length || 0} subcategories, ${totalItems} items`);
    });

    res.json({
      success: true,
      data: {
        categories: filteredCategories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
export const getCategoryById = async (req, res) => {
  // Get user's selected store - required for filtering
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
  if (!user.selectedStore) {
    return res.status(400).json({
      success: false,
      message: 'Please select a store before viewing categories. Go to "Select Store" in the sidebar.'
    });
  }
  try {
    const category = await Category.findOne({ _id: req.params.id, store: user.selectedStore._id })
      .populate('store', 'name code')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Filter embedded items by store
    const categoryObj = category.toObject();
    if (categoryObj.subcategories) {
      categoryObj.subcategories = categoryObj.subcategories.map(subcategory => {
        if (subcategory.items) {
          subcategory.items = subcategory.items.filter(item => 
            item.store && item.store.toString() === user.selectedStore._id.toString()
          );
        }
        return subcategory;
      });
    }

    res.json({
      success: true,
      data: categoryObj
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin/Manager)
export const createCategory = async (req, res) => {
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

    const { name, isActive = true } = req.body;

    // Get user's selected store - required for categories
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before creating a category. Go to "Select Store" in the sidebar.'
      });
    }

    // Check if category name already exists for this store
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      store: user.selectedStore._id
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists in this store'
      });
    }

    // Create new category
    const categoryData = {
      name: name.trim(),
      isActive,
      store: user.selectedStore._id,
      storeName: user.selectedStore.name,
      subcategories: [],
      createdBy: req.user.id
    };

    const category = new Category(categoryData);
    await category.save();

    // Populate the created category
    const populatedCategory = await Category.findById(category._id)
      .populate('store', 'name code')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name or slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin/Manager)
export const updateCategory = async (req, res) => {
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

    const { name, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category name already exists (excluding current category)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update category
    const updateData = {
      ...(name && { name }),
      ...(isActive !== undefined && { isActive }),
      updatedBy: req.user.id
    };

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'createdBy', select: 'firstName lastName' },
      { path: 'updatedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name or slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category can be deleted
    const canDeleteResult = await category.canDelete();
    if (!canDeleteResult.canDelete) {
      return res.status(400).json({
        success: false,
        message: canDeleteResult.reason
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Toggle category status
// @route   PATCH /api/categories/:id/toggle-status
// @access  Private (Admin/Manager)
export const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = !category.isActive;
    category.updatedBy = req.user.id;
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling category status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get subcategories of a specific category (now embedded)
// @route   GET /api/categories/:id/subcategories
// @access  Private
export const getSubcategories = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: {
        parentCategory: {
          _id: category._id,
          name: category.name,
          isActive: category.isActive
        },
        subcategories: category.subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subcategories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get category hierarchy (tree structure with embedded data)
// @route   GET /api/categories/hierarchy
// @access  Private
export const getCategoryHierarchy = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 });

    // With embedded structure, each category already contains its subcategories and items
    // No need to build a tree structure since it's already hierarchical

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching category hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category hierarchy',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add subcategory to existing category
// @route   POST /api/categories/:id/subcategories
// @access  Private (Admin/Manager)
export const addSubcategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if subcategory already exists
    const existingSubcategory = category.subcategories.find(sub => 
      sub.name.toLowerCase() === name.toLowerCase()
    );

    if (existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory with this name already exists'
      });
    }

    const subcategoryData = {
      name,
      items: [],
      createdBy: req.user.id
    };

    await category.addSubcategory(subcategoryData);

    res.status(201).json({
      success: true,
      message: 'Subcategory added successfully',
      data: category
    });
  } catch (error) {
    console.error('Error adding subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding subcategory',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add item to subcategory
// @route   POST /api/categories/:id/subcategories/:subcategoryId/items
// @access  Private (Admin/Manager)
export const addItemToSubcategory = async (req, res) => {
  try {
    console.log('addItemToSubcategory called with:', {
      categoryId: req.params.id,
      subcategoryId: req.params.subcategoryId,
      body: req.body,
      user: req.user?.id
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const subcategory = category.subcategories.id(req.params.subcategoryId);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Get user's selected store - required for items
    const UserModel = (await import('../models/User.js')).default;
    const user = await UserModel.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before adding items. Go to "Select Store" in the sidebar.'
      });
    }

    const itemData = {
      ...req.body,
      store: user.selectedStore._id,
      storeName: user.selectedStore.name,
      createdBy: req.user.id
    };

    subcategory.items.push(itemData);
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Item added successfully',
      data: category
    });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update embedded item in category/subcategory
// @route   PUT /api/categories/items/:itemId
// @access  Private (Admin/Manager/Employee)
export const updateEmbeddedItem = async (req, res) => {
  try {
    console.log('Update embedded item - Looking for item with ID:', req.params.itemId);
    console.log('Update embedded item - Request body:', req.body);

    // Find the category that contains this item
    const categories = await Category.find({
      $or: [
        { 'subcategories.items._id': req.params.itemId },
        { 'items._id': req.params.itemId }
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
              if (item._id.toString() === req.params.itemId) {
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
                        const fileUrl = await saveBase64Image(img.url, req.params.itemId, k);
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
          if (item._id.toString() === req.params.itemId) {
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
                    const fileUrl = await saveBase64Image(img.url, req.params.itemId, k);
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

// @desc    Get category statistics
// @route   GET /api/categories/stats/overview
// @access  Private (Admin/Manager)
export const getCategoryStats = async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    const inactiveCategories = totalCategories - activeCategories;
    
    // Calculate total subcategories and items
    const categories = await Category.find();
    let totalSubcategories = 0;
    let totalItems = 0;
    
    categories.forEach(category => {
      totalSubcategories += category.subcategories.length;
      category.subcategories.forEach(subcategory => {
        totalItems += subcategory.items.length;
      });
    });

    res.json({
      success: true,
      data: {
        totalCategories,
        activeCategories,
        inactiveCategories,
        totalSubcategories,
        totalItems
      }
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
