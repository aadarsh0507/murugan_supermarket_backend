import Credit from '../models/Credit.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Supplier from '../models/Supplier.js';
import Store from '../models/Store.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

// @desc    Get all credits
// @route   GET /api/credits
// @access  Private
export const getAllCredits = async (req, res) => {
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

    // Get user's selected store
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore && !storeId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before viewing credits. Go to "Select Store" in the sidebar.'
      });
    }

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (supplierId && supplierId !== 'all') {
      query.supplier = supplierId;
    }

    // Store filtering
    if (storeId) {
      query.store = storeId;
    } else if (user.selectedStore) {
      query.store = user.selectedStore._id;
    }

    // Date filtering
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999); // Include the entire end date
        query.orderDate.$lte = endDateObj;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const credits = await Credit.find(query)
      .populate('supplier', 'companyName contactPerson')
      .populate('store', 'name code')
      .populate('purchaseOrder', 'poNumber total')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .populate('amountChangeHistory.changedBy', 'firstName lastName')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Credit.countDocuments(query);

    res.json({
      success: true,
      data: {
        credits,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching credits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single credit
// @route   GET /api/credits/:id
// @access  Private
export const getCreditById = async (req, res) => {
  try {
    const credit = await Credit.findById(req.params.id)
      .populate('supplier')
      .populate('store')
      .populate('purchaseOrder')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .populate('paymentHistory.createdBy', 'firstName lastName')
      .populate('amountChangeHistory.changedBy', 'firstName lastName');

    if (!credit) {
      return res.status(404).json({
        success: false,
        message: 'Credit not found'
      });
    }

    res.json({
      success: true,
      data: credit
    });
  } catch (error) {
    console.error('Error fetching credit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching credit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create credit from purchase order
// @route   POST /api/credits
// @access  Private (Admin/Manager)
export const createCredit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { purchaseOrderId } = req.body;

    // Get purchase order
    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId)
      .populate('supplier')
      .populate('store');

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Check if credit already exists for this PO
    const existingCredit = await Credit.findOne({ purchaseOrder: purchaseOrderId });
    if (existingCredit) {
      return res.status(400).json({
        success: false,
        message: 'Credit already exists for this purchase order'
      });
    }

    // Get user's selected store
    let storeId = purchaseOrder.store?._id || purchaseOrder.store;
    let storeName = purchaseOrder.store?.name || purchaseOrder.storeName;
    
    if (!storeId) {
      const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
      if (!user.selectedStore) {
        return res.status(400).json({
          success: false,
          message: 'Please select a store before creating a credit.'
        });
      }
      storeId = user.selectedStore._id;
      storeName = user.selectedStore.name;
    }

    // Get initial payment if provided
    const initialPayment = parseFloat(req.body.initialPayment) || 0;
    const paymentNotes = req.body.notes || '';
    const totalAmount = purchaseOrder.total || 0;
    
    // Validate initial payment
    if (initialPayment < 0 || initialPayment > totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Initial payment must be between 0 and ${totalAmount}`
      });
    }

    // Create credit record
    const creditData = {
      supplier: purchaseOrder.supplier?._id || purchaseOrder.supplier,
      store: storeId,
      purchaseOrder: purchaseOrder._id,
      poNumber: purchaseOrder.poNumber,
      orderDate: purchaseOrder.orderDate,
      initialOriginalAmount: totalAmount,
      originalAmount: totalAmount,
      paidAmount: initialPayment,
      balanceAmount: totalAmount - initialPayment,
      status: initialPayment > 0 ? (initialPayment >= totalAmount ? 'paid' : 'partially_paid') : 'pending',
      createdBy: req.user.id
    };

    // Add initial payment to payment history if provided
    if (initialPayment > 0) {
      creditData.paymentHistory = [{
        amount: initialPayment,
        paymentDate: new Date(),
        notes: paymentNotes || 'Initial partial payment',
        createdBy: req.user.id
      }];
    }

    const credit = new Credit(creditData);
    await credit.save();

    // Mark purchase order as credit
    purchaseOrder.isCredit = true;
    await purchaseOrder.save();

    // Populate the created credit
    await credit.populate([
      { path: 'supplier', select: 'companyName contactPerson' },
      { path: 'store', select: 'name code' },
      { path: 'purchaseOrder', select: 'poNumber total' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Credit created successfully',
      data: credit
    });
  } catch (error) {
    console.error('Error creating credit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating credit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update credit original amount
// @route   PUT /api/credits/:id/amount
// @access  Private (Admin/Manager)
export const updateCreditAmount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const credit = await Credit.findById(req.params.id);
    if (!credit) {
      return res.status(404).json({
        success: false,
        message: 'Credit not found'
      });
    }

    const { newAmount, notes } = req.body;

    if (!newAmount || newAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'New amount must be a positive number'
      });
    }

    // If initialOriginalAmount is not set, set it to current originalAmount
    if (!credit.initialOriginalAmount) {
      credit.initialOriginalAmount = credit.originalAmount;
    }

    // Store the change in history
    if (!credit.amountChangeHistory) {
      credit.amountChangeHistory = [];
    }

    credit.amountChangeHistory.push({
      previousAmount: credit.originalAmount,
      updatedAmount: newAmount,
      changeDate: new Date(),
      notes: notes || 'Amount updated',
      changedBy: req.user.id
    });

    // Update the original amount
    const previousAmount = credit.originalAmount;
    credit.originalAmount = newAmount;

    // Recalculate balance based on new amount
    credit.balanceAmount = credit.originalAmount - credit.paidAmount;

    // Update status
    if (credit.balanceAmount <= 0) {
      credit.status = 'paid';
    } else if (credit.paidAmount > 0) {
      credit.status = 'partially_paid';
    } else {
      credit.status = 'pending';
    }

    credit.updatedBy = req.user.id;
    await credit.save();

    // Populate the updated credit
    await credit.populate([
      { path: 'supplier', select: 'companyName contactPerson' },
      { path: 'store', select: 'name code' },
      { path: 'updatedBy', select: 'firstName lastName' },
      { path: 'amountChangeHistory.changedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Credit amount updated successfully',
      data: credit
    });
  } catch (error) {
    console.error('Error updating credit amount:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating credit amount',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update credit payment
// @route   PUT /api/credits/:id/payment
// @access  Private (Admin/Manager)
export const updateCreditPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const credit = await Credit.findById(req.params.id);
    if (!credit) {
      return res.status(404).json({
        success: false,
        message: 'Credit not found'
      });
    }

    const { paymentAmount, notes } = req.body;

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    // Round payment amount to handle whole numbers
    const roundedPaymentAmount = Math.round(paymentAmount);
    const roundedBalanceAmount = Math.round(credit.balanceAmount);
    
    // Check if payment amount exceeds balance (allow small rounding differences)
    if (roundedPaymentAmount > roundedBalanceAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed balance amount of ₹${roundedBalanceAmount}`
      });
    }

    // Use rounded payment amount for calculation
    const newBalance = credit.balanceAmount - roundedPaymentAmount;
    
    // If payment equals or exceeds balance after rounding, ensure balance doesn't go below 0
    if (newBalance < 0) {
      // Adjust to ensure balance is 0 if payment is valid
      if (roundedPaymentAmount <= roundedBalanceAmount) {
        credit.paidAmount = credit.originalAmount; // Set to full amount
        credit.balanceAmount = 0;
      } else {
        return res.status(400).json({
          success: false,
          message: `Payment amount cannot exceed balance amount of ₹${roundedBalanceAmount}`
        });
      }
    } else {
      credit.paidAmount = credit.paidAmount + roundedPaymentAmount;
      credit.balanceAmount = newBalance;
    }

    // Add to payment history (use rounded payment amount)
    credit.paymentHistory.push({
      amount: roundedPaymentAmount,
      paymentDate: new Date(),
      notes: notes || '',
      createdBy: req.user.id
    });

    // Update status will be handled by pre-save middleware
    credit.updatedBy = req.user.id;
    await credit.save();

    // Populate the updated credit
    await credit.populate([
      { path: 'supplier', select: 'companyName contactPerson' },
      { path: 'store', select: 'name code' },
      { path: 'purchaseOrder', select: 'poNumber total' },
      { path: 'updatedBy', select: 'firstName lastName' },
      { path: 'paymentHistory.createdBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Credit payment updated successfully',
      data: credit
    });
  } catch (error) {
    console.error('Error updating credit payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating credit payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete credit
// @route   DELETE /api/credits/:id
// @access  Private (Admin)
export const deleteCredit = async (req, res) => {
  try {
    const credit = await Credit.findById(req.params.id);
    if (!credit) {
      return res.status(404).json({
        success: false,
        message: 'Credit not found'
      });
    }

    // Unmark purchase order as credit
    const purchaseOrder = await PurchaseOrder.findById(credit.purchaseOrder);
    if (purchaseOrder) {
      purchaseOrder.isCredit = false;
      await purchaseOrder.save();
    }

    await Credit.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Credit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting credit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting credit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get credits summary by supplier
// @route   GET /api/credits/summary/:supplierId
// @access  Private
export const getCreditsSummaryBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    // Get user's selected store
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    
    const query = { supplier: supplierId };
    if (user.selectedStore) {
      query.store = user.selectedStore._id;
    }

    const credits = await Credit.find(query)
      .populate('purchaseOrder', 'poNumber orderDate')
      .sort({ orderDate: -1 });

    const summary = {
      totalCredits: credits.length,
      totalOriginalAmount: credits.reduce((sum, c) => sum + (c.originalAmount || 0), 0),
      totalPaidAmount: credits.reduce((sum, c) => sum + (c.paidAmount || 0), 0),
      totalBalanceAmount: credits.reduce((sum, c) => sum + (c.balanceAmount || 0), 0),
      pendingCount: credits.filter(c => c.status === 'pending').length,
      partiallyPaidCount: credits.filter(c => c.status === 'partially_paid').length,
      paidCount: credits.filter(c => c.status === 'paid').length,
      credits
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching credits summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching credits summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

