import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: [true, 'Bill number is required'],
    unique: true,
    trim: true
  },
  counterNumber: {
    type: Number,
    required: [true, 'Counter number is required'],
    min: [1, 'Counter number must be at least 1']
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  billBy: {
    type: String,
    trim: true
  },
  items: [{
    itemSku: {
      type: String,
      required: true,
      trim: true
    },
    itemName: {
      type: String,
      required: true
    },
    mrp: {
      type: Number,
      required: true,
      min: [0, 'MRP cannot be negative']
    },
    saleRate: {
      type: Number,
      required: true,
      min: [0, 'Sale rate cannot be negative']
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    netAmount: {
      type: Number,
      required: true,
      min: [0, 'Net amount cannot be negative']
    }
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  totalQuantity: {
    type: Number,
    required: [true, 'Total quantity is required'],
    min: [0, 'Total quantity cannot be negative']
  },
  totalSavings: {
    type: Number,
    default: 0,
    min: [0, 'Total savings cannot be negative']
  },
  amountPaid: {
    type: Number,
    required: [true, 'Amount paid is required'],
    min: [0, 'Amount paid cannot be negative']
  },
  amountReturned: {
    type: Number,
    default: 0,
    min: [0, 'Amount returned cannot be negative']
  },
  gstBreakdown: [{
    basic: {
      type: Number,
      required: true,
      min: [0, 'Basic amount cannot be negative']
    },
    cgstPercent: {
      type: Number,
      required: true,
      min: [0, 'CGST percentage cannot be negative']
    },
    cgstAmount: {
      type: Number,
      required: true,
      min: [0, 'CGST amount cannot be negative']
    },
    sgstPercent: {
      type: Number,
      required: true,
      min: [0, 'SGST percentage cannot be negative']
    },
    sgstAmount: {
      type: Number,
      required: true,
      min: [0, 'SGST amount cannot be negative']
    }
  }],
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'other'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for bill date
billSchema.virtual('billDate').get(function() {
  return this.createdAt.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  }).replace(/ /g, '-');
});

// Virtual for bill time
billSchema.virtual('billTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
});

// Indexes for better performance
billSchema.index({ billNumber: 1 });
billSchema.index({ createdAt: -1 });
billSchema.index({ createdBy: 1 });
billSchema.index({ status: 1 });

// Static method to get bills by date range
billSchema.statics.getBillsByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('createdBy', 'name email').sort({ createdAt: -1 });
};

// Static method to get daily sales summary
billSchema.statics.getDailySalesSummary = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'completed'
      }
    },
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
};

export default mongoose.model('Bill', billSchema);
