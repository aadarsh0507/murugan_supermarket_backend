import CustomerCredit from '../models/CustomerCredit.js';
import Bill from '../models/Bill.js';
import User from '../models/User.js';

// @desc    Get all customer credits
// @route   GET /api/customer-credits
// @access  Private
export const getAllCustomerCredits = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      customerName = '',
      storeId = '',
      startDate = '',
      endDate = ''
    } = req.query;

    // Get user's selected store
    const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
    if (!user.selectedStore && !storeId) {
      return res.status(400).json({
        success: false,
        message: 'Please select a store before viewing customer credits.'
      });
    }

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }

    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' };
    }

    // Store filtering
    if (storeId) {
      query.store = storeId;
    } else if (user.selectedStore) {
      query.store = user.selectedStore._id;
    }

    // Date filtering
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) {
        query.billDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.billDate.$lte = endDateObj;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const credits = await CustomerCredit.find(query)
      .populate('store', 'name code')
      .populate('bill', 'billNumber totalAmount')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .populate('amountChangeHistory.changedBy', 'firstName lastName')
      .sort({ billDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CustomerCredit.countDocuments(query);

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
    console.error('Error fetching customer credits:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customer credits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single customer credit
// @route   GET /api/customer-credits/:id
// @access  Private
export const getCustomerCreditById = async (req, res) => {
  try {
    const credit = await CustomerCredit.findById(req.params.id)
      .populate('store')
      .populate('bill')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .populate('paymentHistory.createdBy', 'firstName lastName')
      .populate('amountChangeHistory.changedBy', 'firstName lastName');

    if (!credit) {
      return res.status(404).json({
        success: false,
        message: 'Customer credit not found'
      });
    }

    res.json({
      success: true,
      data: credit
    });
  } catch (error) {
    console.error('Error fetching customer credit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customer credit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create customer credit from bill
// @route   POST /api/customer-credits
// @access  Private (Admin/Manager)
export const createCustomerCredit = async (req, res) => {
  try {
    const { billId, customerName, customerPhone, customerAddress, initialPayment = 0, notes = '' } = req.body;

    if (!billId) {
      return res.status(400).json({
        success: false,
        message: 'Bill ID is required'
      });
    }

    if (!customerName || customerName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    if (!customerPhone || customerPhone.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Customer phone number is required'
      });
    }

    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check if credit already exists for this bill
    const existingCredit = await CustomerCredit.findOne({ bill: billId });
    if (existingCredit) {
      return res.status(400).json({
        success: false,
        message: 'Credit already exists for this bill'
      });
    }

    // Get user's selected store
    let storeId = bill.store?._id || bill.store;
    let storeName = bill.store?.name || bill.storeName;
    
    if (!storeId) {
      const user = await User.findById(req.user.id).select('selectedStore').populate('selectedStore');
      if (!user.selectedStore) {
        return res.status(400).json({
          success: false,
          message: 'Please select a store before creating a customer credit.'
        });
      }
      storeId = user.selectedStore._id;
      storeName = user.selectedStore.name;
    }

    const totalAmount = bill.totalAmount || 0;
    
    // Validate initial payment
    if (initialPayment < 0 || initialPayment > totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Initial payment must be between 0 and ${totalAmount}`
      });
    }

    // Create credit record
    const creditData = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress || '',
      bill: bill._id,
      billNumber: bill.billNumber,
      billDate: bill.createdAt || new Date(),
      store: storeId,
      initialOriginalAmount: totalAmount,
      originalAmount: totalAmount,
      paidAmount: initialPayment,
      balanceAmount: totalAmount - initialPayment,
      status: initialPayment > 0 ? (initialPayment >= totalAmount ? 'paid' : 'partially_paid') : 'pending',
      notes: notes || '',
      createdBy: req.user.id
    };

    // Add initial payment to payment history if provided
    if (initialPayment > 0) {
      creditData.paymentHistory = [{
        amount: initialPayment,
        paymentDate: new Date(),
        notes: notes || 'Initial partial payment',
        createdBy: req.user.id
      }];
    }

    const credit = new CustomerCredit(creditData);
    await credit.save();

    // Mark bill as credit
    bill.isCredit = true;
    await bill.save();

    // Populate the created credit
    await credit.populate([
      { path: 'store', select: 'name code' },
      { path: 'bill', select: 'billNumber totalAmount' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Customer credit created successfully',
      data: credit
    });
  } catch (error) {
    console.error('Error creating customer credit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating customer credit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update customer credit amount
// @route   PUT /api/customer-credits/:id/amount
// @access  Private (Admin/Manager)
export const updateCustomerCreditAmount = async (req, res) => {
  try {
    const credit = await CustomerCredit.findById(req.params.id);
    if (!credit) {
      return res.status(404).json({
        success: false,
        message: 'Customer credit not found'
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
      { path: 'store', select: 'name code' },
      { path: 'bill', select: 'billNumber totalAmount' },
      { path: 'updatedBy', select: 'firstName lastName' },
      { path: 'amountChangeHistory.changedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Customer credit amount updated successfully',
      data: credit
    });
  } catch (error) {
    console.error('Error updating customer credit amount:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating customer credit amount',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update customer credit payment
// @route   PUT /api/customer-credits/:id/payment
// @access  Private (Admin/Manager)
export const updateCustomerCreditPayment = async (req, res) => {
  try {
    const credit = await CustomerCredit.findById(req.params.id);
    if (!credit) {
      return res.status(404).json({
        success: false,
        message: 'Customer credit not found'
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
      { path: 'store', select: 'name code' },
      { path: 'bill', select: 'billNumber totalAmount' },
      { path: 'updatedBy', select: 'firstName lastName' },
      { path: 'paymentHistory.createdBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Customer credit payment updated successfully',
      data: credit
    });
  } catch (error) {
    console.error('Error updating customer credit payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating customer credit payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete customer credit
// @route   DELETE /api/customer-credits/:id
// @access  Private (Admin)
export const deleteCustomerCredit = async (req, res) => {
  try {
    const credit = await CustomerCredit.findById(req.params.id);
    if (!credit) {
      return res.status(404).json({
        success: false,
        message: 'Customer credit not found'
      });
    }

    // Update bill to remove credit flag
    await Bill.findByIdAndUpdate(credit.bill, { isCredit: false });

    await CustomerCredit.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Customer credit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer credit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting customer credit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get customer credits summary by customer
// @route   GET /api/customer-credits/summary/:customerName
// @access  Private
export const getCustomerCreditsSummaryByCustomer = async (req, res) => {
  try {
    const { customerName } = req.params;
    
    const credits = await CustomerCredit.find({ 
      customerName: { $regex: customerName, $options: 'i' }
    });

    const summary = {
      totalCredits: credits.length,
      totalOriginalAmount: credits.reduce((sum, c) => sum + (c.originalAmount || 0), 0),
      totalPaidAmount: credits.reduce((sum, c) => sum + (c.paidAmount || 0), 0),
      totalBalanceAmount: credits.reduce((sum, c) => sum + (c.balanceAmount || 0), 0),
      pendingCount: credits.filter(c => c.status === 'pending').length,
      partiallyPaidCount: credits.filter(c => c.status === 'partially_paid').length,
      paidCount: credits.filter(c => c.status === 'paid').length
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching customer credits summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customer credits summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get customer by phone number
// @route   GET /api/customer-credits/customer-by-phone/:phone
// @access  Private
export const getCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    
    if (!phone || phone.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Find the most recent credit entry for this phone number to get customer details
    const credit = await CustomerCredit.findOne({ 
      customerPhone: phone.trim()
    })
    .sort({ createdAt: -1 })
    .select('customerName customerPhone customerAddress')
    .lean();

    if (!credit) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found with this phone number'
      });
    }

    // Get all credits for this customer to calculate summary
    const allCredits = await CustomerCredit.find({ 
      customerPhone: phone.trim()
    });

    const summary = {
      customerName: credit.customerName,
      customerPhone: credit.customerPhone,
      customerAddress: credit.customerAddress || '',
      totalCredits: allCredits.length,
      totalOriginalAmount: allCredits.reduce((sum, c) => sum + (c.originalAmount || 0), 0),
      totalPaidAmount: allCredits.reduce((sum, c) => sum + (c.paidAmount || 0), 0),
      totalBalanceAmount: allCredits.reduce((sum, c) => sum + (c.balanceAmount || 0), 0),
      pendingCount: allCredits.filter(c => c.status === 'pending').length,
      partiallyPaidCount: allCredits.filter(c => c.status === 'partially_paid').length,
      paidCount: allCredits.filter(c => c.status === 'paid').length
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching customer by phone:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customer details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

