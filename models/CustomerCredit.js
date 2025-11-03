import mongoose from 'mongoose';

const customerCreditSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  customerAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true,
    index: true
  },
  billNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  billDate: {
    type: Date,
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  initialOriginalAmount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  originalAmount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  amountChangeHistory: [{
    previousAmount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative']
    },
    updatedAmount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative']
    },
    changeDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  balanceAmount: {
    type: Number,
    required: true,
    min: [0, 'Balance cannot be negative']
  },
  paymentHistory: [{
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative']
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'paid'],
    default: 'pending',
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to calculate balance and update status
customerCreditSchema.pre('save', function (next) {
  // If initialOriginalAmount is not set, set it to originalAmount (for existing records)
  if (!this.initialOriginalAmount && this.originalAmount) {
    this.initialOriginalAmount = this.originalAmount;
  }
  
  // Calculate balance based on current originalAmount
  this.balanceAmount = this.originalAmount - this.paidAmount;
  
  // Update status based on balance
  if (this.balanceAmount <= 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partially_paid';
  } else {
    this.status = 'pending';
  }
  
  next();
});

// Indexes for better performance
customerCreditSchema.index({ customerName: 1 });
customerCreditSchema.index({ billDate: -1 });
customerCreditSchema.index({ status: 1, billDate: -1 });

export default mongoose.model('CustomerCredit', customerCreditSchema);

