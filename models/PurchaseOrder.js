import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    trim: true
  },
  categoryName: String,
  subcategoryName: String,
  batchNumber: {
    type: String,
    trim: true
  },
  hsnNumber: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unit: {
    type: String,
    required: true
  },
  costPrice: {
    type: Number,
    required: true,
    min: [0, 'Cost price cannot be negative']
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  },
  notes: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  }
}, { _id: true });

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  expectedDeliveryDate: Date,
  status: {
    type: String,
    enum: ['pending', 'partially_received', 'completed', 'cancelled'],
    default: 'completed',
    index: true
  },
  items: [purchaseOrderItemSchema],
  subtotal: {
    type: Number,
    default: 0,
    min: 0,
    required: true
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receivedDate: Date,
  invoiceNumber: String,
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

// Virtual for items count
purchaseOrderSchema.virtual('itemsCount').get(function() {
  return this.items ? this.items.length : 0;
});

// Virtual for total quantity
purchaseOrderSchema.virtual('totalQuantity').get(function() {
  return this.items ? this.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
});

// Static method to generate next PO number
purchaseOrderSchema.statics.generatePONumber = async function() {
  const lastPO = await this.findOne({}, {}, { sort: { createdAt: -1 } });
  if (!lastPO) {
    return 'PO-0001';
  }
  
  const match = lastPO.poNumber.match(/PO-(\d+)/);
  if (match) {
    const num = parseInt(match[1]) + 1;
    return `PO-${num.toString().padStart(4, '0')}`;
  }
  return `PO-${Date.now()}`;
};

// Pre-save middleware to calculate totals
purchaseOrderSchema.pre('save', function(next) {
  // Ensure numeric values exist
  const subtotal = (this.items && this.items.length > 0) 
    ? this.items.reduce((sum, item) => sum + (item.total || 0), 0)
    : 0;
  const tax = this.tax || 0;
  const shipping = this.shipping || 0;
  const discount = this.discount || 0;
  
  // Set subtotal
  this.subtotal = subtotal;
  
  // Calculate total
  this.total = subtotal + tax + shipping - discount;
  
  // Ensure total is not negative
  if (this.total < 0) {
    this.total = 0;
  }
  
  next();
});

// Indexes for better performance
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ supplier: 1, status: 1 });
purchaseOrderSchema.index({ store: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);

