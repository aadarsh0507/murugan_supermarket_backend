import mongoose from 'mongoose';

// Batch schema for tracking individual batches
const batchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: true,
    trim: true
  },
  hsnNumber: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },
  purchaseOrderNumber: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [50, 'SKU cannot exceed 50 characters']
  },
  hsnCode: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Subcategory is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  minStock: {
    type: Number,
    min: [0, 'Minimum stock cannot be negative'],
    default: 0
  },
  maxStock: {
    type: Number,
    min: [0, 'Maximum stock cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  expiryDate: {
    type: Date
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  storeName: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  batches: [batchSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to calculate total stock from batches
itemSchema.virtual('calculatedStock').get(function() {
  return this.batches
    ? this.batches
        .filter(batch => batch.isActive)
        .reduce((sum, batch) => sum + (batch.quantity || 0), 0)
    : 0;
});

// Virtual for category path
itemSchema.virtual('categoryPath', {
  ref: 'Category',
  localField: 'subcategory',
  foreignField: '_id',
  justOne: true
});

// Virtual for stock status
itemSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= this.minStock) return 'low-stock';
  if (this.maxStock && this.stock >= this.maxStock) return 'overstock';
  return 'in-stock';
});

// Virtual for profit margin
itemSchema.virtual('profitMargin').get(function () {
  if (!this.cost || this.cost === 0) return null;
  return ((this.price - this.cost) / this.cost * 100).toFixed(2);
});

// Pre-save middleware
itemSchema.pre('save', function (next) {
  // Ensure only one primary image
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Set only the first one as primary
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    }
  }
  next();
});

// Indexes for better performance
itemSchema.index({ name: 1, isActive: 1 });
itemSchema.index({ subcategory: 1, isActive: 1 });
itemSchema.index({ store: 1, isActive: 1 });
itemSchema.index({ store: 1, name: 1 });
itemSchema.index({ tags: 1 });
itemSchema.index({ stock: 1 });
itemSchema.index({ price: 1 });
itemSchema.index({ createdAt: -1 });

// Static method to get low stock items
itemSchema.statics.getLowStockItems = function () {
  return this.find({
    isActive: true,
    $expr: { $lte: ['$stock', '$minStock'] }
  }).populate('subcategory', 'name parent');
};

// Static method to get items by category hierarchy
itemSchema.statics.getItemsByCategory = function (categoryId) {
  return this.find({
    subcategory: categoryId,
    isActive: true
  }).populate('subcategory', 'name parent');
};

// Instance method to check if item can be deleted
itemSchema.methods.canDelete = function () {
  // Add any business logic here for item deletion
  return { canDelete: true };
};

export default mongoose.model('Item', itemSchema);
