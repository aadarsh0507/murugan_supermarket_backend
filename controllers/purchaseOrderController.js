import PurchaseOrder from '../models/PurchaseOrder.js';
import Category from '../models/Category.js';
import Item from '../models/Item.js';
import { validationResult } from 'express-validator';

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
export const getAllPurchaseOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      supplierId = '',
      storeId = '',
      startDate = '',
      endDate = ''
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.poNumber = { $regex: search, $options: 'i' };
    }
    
    if (status) {
      query.status = status;
    }

    if (supplierId) {
      query.supplier = supplierId;
    }

    if (storeId) {
      query.store = storeId;
    }

    // Date filtering
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.orderDate.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('supplier', 'companyName contactPerson')
      .populate('store', 'name code')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PurchaseOrder.countDocuments(query);

    res.json({
      success: true,
      data: {
        purchaseOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching purchase orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single purchase order
// @route   GET /api/purchase-orders/:id
// @access  Private
export const getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('store')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching purchase order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new purchase order
// @route   POST /api/purchase-orders
// @access  Private (Admin/Manager)
export const createPurchaseOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Validate and enrich items with SKU information
    const enrichedItems = [];
    if (req.body.items && req.body.items.length > 0) {
      for (const item of req.body.items) {
        // If SKU is provided, try to find and validate the item
        if (item.sku) {
          // First try to find in standalone Item model
          const dbItem = await Item.findOne({ sku: item.sku }).populate('subcategory', 'name parent');
          
          if (dbItem) {
            // Enrich with database item details
            enrichedItems.push({
              itemName: item.itemName || dbItem.name,
              sku: item.sku,
              categoryName: dbItem.subcategory?.parent?.name || item.categoryName,
              subcategoryName: dbItem.subcategory?.name || item.subcategoryName,
              batchNumber: item.batchNumber || '',
              hsnNumber: item.hsnNumber || '',
              quantity: item.quantity,
              unit: item.unit || dbItem.unit,
              costPrice: item.costPrice,
              total: item.total,
              notes: item.notes || ''
            });
          } else {
            // Item not found in Item model, check embedded items
            const categories = await Category.find({});
            let foundItem = null;
            let foundCategory = null;
            let foundSubcategory = null;
            
            for (const category of categories) {
              for (const subcategory of category.subcategories) {
                const embeddedItem = subcategory.items.find(embItem => embItem.sku === item.sku);
                if (embeddedItem) {
                  foundItem = embeddedItem;
                  foundCategory = category;
                  foundSubcategory = subcategory;
                  break;
                }
              }
              if (foundItem) break;
            }
            
            if (foundItem) {
              enrichedItems.push({
                itemName: item.itemName || foundItem.name,
                sku: item.sku,
                categoryName: foundCategory?.name || item.categoryName,
                subcategoryName: foundSubcategory?.name || item.subcategoryName,
                batchNumber: item.batchNumber || '',
                hsnNumber: item.hsnNumber || '',
                quantity: item.quantity,
                unit: item.unit || foundItem.unit,
                costPrice: item.costPrice,
                total: item.total,
                notes: item.notes || ''
              });
            } else {
              // If SKU doesn't exist, use provided data but log warning
              console.warn(`Item with SKU ${item.sku} not found in database`);
              enrichedItems.push({
                itemName: item.itemName,
                sku: item.sku || '',
                categoryName: item.categoryName || '',
                subcategoryName: item.subcategoryName || '',
                batchNumber: item.batchNumber || '',
                hsnNumber: item.hsnNumber || '',
                quantity: item.quantity,
                unit: item.unit || '',
                costPrice: item.costPrice,
                total: item.total,
                notes: item.notes || ''
              });
            }
          }
        } else {
          // No SKU provided, use provided data as-is
          enrichedItems.push({
            itemName: item.itemName,
            sku: '',
            categoryName: item.categoryName || '',
            subcategoryName: item.subcategoryName || '',
            batchNumber: item.batchNumber || '',
            hsnNumber: item.hsnNumber || '',
            quantity: item.quantity,
            unit: item.unit || '',
            costPrice: item.costPrice,
            total: item.total,
            notes: item.notes || ''
          });
        }
      }
    }

    // Generate PO number
    const poNumber = await PurchaseOrder.generatePONumber();

    const purchaseOrderData = {
      poNumber,
      ...req.body,
      items: enrichedItems,
      createdBy: req.user.id
    };

    const purchaseOrder = new PurchaseOrder(purchaseOrderData);
    await purchaseOrder.save();

    // Create batches for each item in the purchase order and update stock
    for (const poItem of purchaseOrder.items) {
      if (poItem.sku) {
        // Try to update standalone Item model first
        const dbItem = await Item.findOne({ sku: poItem.sku });
        
        if (dbItem) {
          // If batch number is provided, create/update batch
          if (poItem.batchNumber) {
            if (!dbItem.batches) {
              dbItem.batches = [];
            }
            
            const existingBatchIndex = dbItem.batches.findIndex(batch => batch.batchNumber === poItem.batchNumber);
            
            if (existingBatchIndex !== -1) {
              dbItem.batches[existingBatchIndex].quantity = (dbItem.batches[existingBatchIndex].quantity || 0) + poItem.quantity;
              if (poItem.costPrice) {
                dbItem.batches[existingBatchIndex].costPrice = poItem.costPrice;
              }
            } else {
              dbItem.batches.push({
                batchNumber: poItem.batchNumber,
                hsnNumber: poItem.hsnNumber || '',
                quantity: poItem.quantity,
                costPrice: poItem.costPrice,
                purchaseOrderNumber: purchaseOrder.poNumber,
                purchaseDate: new Date(),
                isActive: true,
                createdBy: req.user.id
              });
            }
          }
          
          dbItem.stock = (dbItem.stock || 0) + poItem.quantity;
          if (poItem.costPrice) {
            dbItem.cost = poItem.costPrice;
          }
          if (poItem.hsnNumber && !dbItem.hsnCode) {
            dbItem.hsnCode = poItem.hsnNumber;
          }
          await dbItem.save();
        }
        
        // Find and update embedded items in categories
        const categories = await Category.find({});
        
        for (const category of categories) {
          for (const subcategory of category.subcategories) {
            const itemIndex = subcategory.items.findIndex(item => item.sku === poItem.sku);
            if (itemIndex !== -1) {
              const item = subcategory.items[itemIndex];
              
              // If batch number is provided, create/update batch
              if (poItem.batchNumber) {
                // Initialize batches array if it doesn't exist
                if (!item.batches) {
                  item.batches = [];
                }
                
                // Check if batch already exists
                const existingBatchIndex = item.batches.findIndex(batch => batch.batchNumber === poItem.batchNumber);
                
                if (existingBatchIndex !== -1) {
                  // Update existing batch quantity instead of creating new one
                  item.batches[existingBatchIndex].quantity = (item.batches[existingBatchIndex].quantity || 0) + poItem.quantity;
                  if (poItem.costPrice) {
                    item.batches[existingBatchIndex].costPrice = poItem.costPrice;
                  }
                } else {
                  // Create new batch for this item
                  item.batches.push({
                    batchNumber: poItem.batchNumber,
                    hsnNumber: poItem.hsnNumber || '',
                    quantity: poItem.quantity,
                    costPrice: poItem.costPrice,
                    purchaseOrderNumber: purchaseOrder.poNumber,
                    purchaseDate: new Date(),
                    isActive: true,
                    createdBy: req.user.id
                  });
                }
              }
              
              // Update item cost with latest PO cost if provided
              if (poItem.costPrice) {
                item.cost = poItem.costPrice;
              }
              
              // Update HSN code if provided
              if (poItem.hsnNumber && !item.hsnCode) {
                item.hsnCode = poItem.hsnNumber;
              }
              
              // Update stock field (always update stock regardless of batch number)
              item.stock = (item.stock || 0) + poItem.quantity;
              
              await category.save();
              break;
            }
          }
        }
      }
    }

    // Populate the created purchase order
    await purchaseOrder.populate([
      { path: 'supplier', select: 'companyName contactPerson' },
      { path: 'store', select: 'name code' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully, batches added and stock updated',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Purchase order with this PO number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating purchase order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update purchase order
// @route   PUT /api/purchase-orders/:id
// @access  Private (Admin/Manager)
export const updatePurchaseOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Update fields
    const updateData = { ...req.body, updatedBy: req.user.id };
    Object.assign(purchaseOrder, updateData);
    await purchaseOrder.save();

    // Populate the updated purchase order
    await purchaseOrder.populate([
      { path: 'supplier', select: 'companyName contactPerson' },
      { path: 'store', select: 'name code' },
      { path: 'updatedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Purchase order updated successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating purchase order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete purchase order
// @route   DELETE /api/purchase-orders/:id
// @access  Private (Admin)
export const deletePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Only allow deletion of pending orders
    if (purchaseOrder.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete purchase order that is not in pending status'
      });
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting purchase order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update purchase order status and stock
// @route   PATCH /api/purchase-orders/:id/receive
// @access  Private (Admin/Manager)
export const receivePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.status === 'completed' || purchaseOrder.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot receive a completed or cancelled purchase order'
      });
    }

    const { receivedItems = [] } = req.body; // Array of {sku, receivedQuantity}

    // Update stock for each item in the purchase order
    for (const poItem of purchaseOrder.items) {
      // If receivedItems is provided, use those quantities, otherwise use PO quantities
      const receivedItem = receivedItems.find(ri => ri.sku === poItem.sku);
      const quantityToReceive = receivedItem?.receivedQuantity || poItem.quantity;
      
      if (poItem.sku) {
        // Try to update stock in standalone Item model first
        const dbItem = await Item.findOne({ sku: poItem.sku });
        
        if (dbItem) {
          dbItem.stock = (dbItem.stock || 0) + quantityToReceive;
          if (poItem.costPrice) {
            dbItem.cost = poItem.costPrice; // Update cost with PO cost
          }
          await dbItem.save();
        }
        
        // Also update embedded items in categories
        const categories = await Category.find({});
        
        for (const category of categories) {
          for (const subcategory of category.subcategories) {
            for (const item of subcategory.items) {
              if (item.sku === poItem.sku) {
                item.stock = (item.stock || 0) + quantityToReceive;
                if (poItem.costPrice) {
                  item.cost = poItem.costPrice; // Update cost with PO cost
                }
                await category.save();
                break;
              }
            }
          }
        }
      }
    }

    // Update purchase order status
    purchaseOrder.status = 'completed';
    purchaseOrder.receivedBy = req.user.id;
    purchaseOrder.receivedDate = new Date();
    await purchaseOrder.save();

    await purchaseOrder.populate([
      { path: 'supplier', select: 'companyName contactPerson' },
      { path: 'store', select: 'name code' },
      { path: 'receivedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Purchase order received and stock updated successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error receiving purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while receiving purchase order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

