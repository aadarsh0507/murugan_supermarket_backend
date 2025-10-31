import Bill from '../models/Bill.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

// Create a new bill
export const createBill = async (req, res) => {
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

    // Check if user is admin for discount functionality
    const isAdmin = req.user.role === 'admin';
    const requestedDiscountAmount = req.body.discountAmount || 0;
    
    if (requestedDiscountAmount > 0 && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can apply discounts'
      });
    }

    const {
      billNumber,
      counterNumber,
      customerName,
      billBy,
      items,
      subtotal,
      discountAmount,
      totalAmount,
      totalQuantity,
      totalSavings,
      amountPaid,
      amountReturned,
      gstBreakdown,
      paymentMethod
    } = req.body;

    // Get user's selected store - required for bills
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before creating a bill. Go to "Select Store" in the sidebar.'
      });
    }

    // Validate items and update stock
    const itemUpdates = [];
    for (const item of items) {
      // Find item by SKU in embedded subcategories - filter by store
      const categories = await Category.find({ store: user.selectedStore._id });
      let foundItem = null;
      let foundCategory = null;
      let foundSubcategory = null;
      
      for (const category of categories) {
        for (const subcategory of category.subcategories) {
          const embeddedItem = subcategory.items.find(embItem => embItem.sku === item.itemSku);
          if (embeddedItem) {
            foundItem = embeddedItem;
            foundCategory = category;
            foundSubcategory = subcategory;
            break;
          }
        }
        if (foundItem) break;
      }
      
      if (!foundItem) {
        return res.status(400).json({
          success: false,
          message: `Item with SKU ${item.itemSku} not found`
        });
      }

      if (foundItem.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for item ${item.itemName}. Available: ${foundItem.stock}, Required: ${item.quantity}`
        });
      }

      itemUpdates.push({
        category: foundCategory,
        subcategory: foundSubcategory,
        item: foundItem,
        quantitySold: item.quantity,
        newStock: foundItem.stock - item.quantity
      });
    }

    // Create the bill
    const bill = new Bill({
      billNumber,
      counterNumber,
      customerName,
      billBy: billBy || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'Unknown',
      items,
      subtotal,
      discountAmount: isAdmin ? discountAmount : 0, // Only save discount if user is admin
      totalAmount,
      totalQuantity,
      totalSavings,
      amountPaid,
      amountReturned,
      gstBreakdown,
      paymentMethod,
      store: user.selectedStore._id,
      storeName: user.selectedStore.name,
      createdBy: req.user.id
    });

    await bill.save();

    // Update item stocks
    for (const update of itemUpdates) {
      // Find the specific item in the subcategory and update its stock
      const itemIndex = update.subcategory.items.findIndex(item => item.sku === update.item.sku);
      if (itemIndex !== -1) {
        update.subcategory.items[itemIndex].stock = update.newStock;
        await update.category.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill
    });

  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all bills
export const getAllBills = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate, createdBy } = req.query;
    
    // Get user's selected store - required for filtering
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before viewing bills. Go to "Select Store" in the sidebar.'
      });
    }
    
    const query = { store: user.selectedStore._id };
    if (status) query.status = status;
    
    // Role-based filtering: employee and cashier can only see their own bills
    if (req.user.role === 'employee' || req.user.role === 'cashier') {
      query.createdBy = req.user._id;
    } else if (createdBy) {
      query.createdBy = createdBy;
    }
    
    // Handle date filtering - if only one date provided, search for that specific day
    if (startDate || endDate) {
      if (startDate && endDate) {
        // Range filter
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt = {
          $gte: start,
          $lte: end
        };
      } else if (startDate && !endDate) {
        // Single date - search for that entire day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt = {
          $gte: start,
          $lte: end
        };
      } else if (!startDate && endDate) {
        // Only end date - from beginning to end date
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt = {
          $lte: end
        };
      }
    }

    const bills = await Bill.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('store', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Update bills that have no billBy field or have "Unknown" with populated user data
    const updatedBills = bills.map(bill => {
      if (!bill.billBy || bill.billBy === 'Unknown') {
        const user = bill.createdBy;
        if (user && (user.firstName || user.lastName)) {
          bill.billBy = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
        }
      }
      // Convert to plain object to ensure all data is included in response
      const billObj = bill.toObject ? bill.toObject() : bill;
      return billObj;
    });

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      data: updatedBills,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get bill by ID
export const getBillById = async (req, res) => {
  try {
    // Get user's selected store - required for filtering
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before viewing bills. Go to "Select Store" in the sidebar.'
      });
    }
    
    const bill = await Bill.findOne({ _id: req.params.id, store: user.selectedStore._id })
      .populate('createdBy', 'firstName lastName email')
      .populate('store', 'name code');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      data: bill
    });

  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get daily sales summary
export const getDailySalesSummary = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Role-based filtering: employee and cashier can only see their own sales
    let matchQuery = {
      createdAt: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lte: new Date(date).setHours(23, 59, 59, 999)
      },
      status: 'completed'
    };
    
    if (req.user.role === 'employee' || req.user.role === 'cashier') {
      matchQuery.createdBy = req.user._id;
    }
    
    const summary = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$totalQuantity' },
          totalSavings: { $sum: '$totalSavings' }
        }
      }
    ]);

    res.json({
      success: true,
      data: summary[0] || {
        totalBills: 0,
        totalAmount: 0,
        totalQuantity: 0,
        totalSavings: 0
      }
    });

  } catch (error) {
    console.error('Error fetching daily sales summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get low stock items
export const getLowStockItems = async (req, res) => {
  try {
    const categories = await Category.find({});
    const lowStockItems = [];
    
    categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.items.forEach(item => {
          if (item.stock <= item.minStock) {
            lowStockItems.push({
              ...item.toObject(),
              categoryName: category.name,
              subcategoryName: subcategory.name
            });
          }
        });
      });
    });

    res.json({
      success: true,
      data: lowStockItems
    });

  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get items with no movement (not sold in last 30 days)
export const getNoMovementItems = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all items from embedded subcategories
    const categories = await Category.find({});
    const allItems = [];
    
    categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.items.forEach(item => {
          allItems.push({
            ...item.toObject(),
            categoryName: category.name,
            subcategoryName: subcategory.name
          });
        });
      });
    });

    // Get items sold in last 30 days
    let matchQuery = {
      createdAt: { $gte: thirtyDaysAgo },
      status: 'completed'
    };
    
    // Role-based filtering: employee and cashier can only see their own sales
    if (req.user.role === 'employee' || req.user.role === 'cashier') {
      matchQuery.createdBy = req.user._id;
    }
    
    const soldItems = await Bill.aggregate([
      {
        $match: matchQuery
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.itemSku',
          totalSold: { $sum: '$items.quantity' }
        }
      }
    ]);

    const soldItemSkus = soldItems.map(item => item._id);

    // Filter items with no movement
    const noMovementItems = allItems.filter(item => 
      !soldItemSkus.includes(item.sku)
    );

    res.json({
      success: true,
      data: noMovementItems
    });

  } catch (error) {
    console.error('Error fetching no movement items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
