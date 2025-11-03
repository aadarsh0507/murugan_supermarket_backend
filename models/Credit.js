import mongoose from 'mongoose';

const creditSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true
  },
  poNumber: {
    type: String,
    required: true,
    trim: true
  },
  orderDate: {
    type: Date,
    required: true
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
creditSchema.pre('save', function (next) {
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
creditSchema.index({ supplier: 1, status: 1 });
creditSchema.index({ store: 1, status: 1 });
creditSchema.index({ orderDate: -1 });
creditSchema.index({ createdAt: -1 });

export default mongoose.model('Credit', creditSchema);

