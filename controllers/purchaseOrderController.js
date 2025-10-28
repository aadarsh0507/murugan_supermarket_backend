import PurchaseOrder from '../models/PurchaseOrder.js';
import Category from '../models/Category.js';
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
      storeId = ''
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

    // Generate PO number
    const poNumber = await PurchaseOrder.generatePONumber();

    const purchaseOrderData = {
      poNumber,
      ...req.body,
      createdBy: req.user.id
    };

    const purchaseOrder = new PurchaseOrder(purchaseOrderData);
    await purchaseOrder.save();

    // Populate the created purchase order
    await purchaseOrder.populate([
      { path: 'supplier', select: 'companyName contactPerson' },
      { path: 'store', select: 'name code' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
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

    const { receivedItems = [] } = req.body; // Array of {itemId, receivedQuantity}

    // Update stock if items are being received
    if (receivedItems.length > 0 && purchaseOrder.status !== 'completed') {
      for (const poItem of purchaseOrder.items) {
        // Find matching received item
        const receivedItem = receivedItems.find(ri => ri.sku === poItem.sku);
        
        if (receivedItem) {
          // Find and update stock in categories
          const categories = await Category.find({});
          
          for (const category of categories) {
            for (const subcategory of category.subcategories) {
              for (const item of subcategory.items) {
                if (item.sku === poItem.sku) {
                  item.stock = (item.stock || 0) + receivedItem.receivedQuantity;
                  item.cost = poItem.costPrice; // Update cost with PO cost
                  await category.save();
                  break;
                }
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

