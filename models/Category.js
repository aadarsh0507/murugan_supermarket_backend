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

// Item schema for embedding
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
    trim: true,
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
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  cost: {
    type: Number,
    min: [0, 'Cost must be positive']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  minStock: {
    type: Number,
    default: 0,
    min: [0, 'Minimum stock cannot be negative']
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
    min: [0, 'Weight must be positive']
  },
  barcode: {
    type: String,
    trim: true,
    maxlength: [50, 'Barcode cannot exceed 50 characters']
  },
  tags: [{
    type: String,
    trim: true
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
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
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
  timestamps: true
});

// Virtual to calculate total stock from batches
itemSchema.virtual('calculatedStock').get(function() {
  return this.batches
    ? this.batches
        .filter(batch => batch.isActive)
        .reduce((sum, batch) => sum + (batch.quantity || 0), 0)
    : 0;
});

// Subcategory schema for embedding
const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true,
    maxlength: [100, 'Subcategory name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  items: [itemSchema],
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
  timestamps: true
});

// Main category schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters'],
    index: true
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subcategories: [subcategorySchema],
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

// Virtual for total item count across all subcategories
categorySchema.virtual('totalItemCount').get(function() {
  return this.subcategories.reduce((total, subcategory) => {
    return total + (subcategory.items ? subcategory.items.length : 0);
  }, 0);
});

// Virtual for active item count
categorySchema.virtual('activeItemCount').get(function() {
  return this.subcategories.reduce((total, subcategory) => {
    if (!subcategory.items) return total;
    return total + subcategory.items.filter(item => item.isActive).length;
  }, 0);
});

// Virtual for subcategory count
categorySchema.virtual('subcategoryCount').get(function() {
  return this.subcategories ? this.subcategories.length : 0;
});

// Pre-save middleware to generate slugs
categorySchema.pre('save', function(next) {
  try {
    // Generate slug for main category
    if (this.isModified('name')) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Generate slugs for subcategories
    if (this.subcategories && this.subcategories.length > 0) {
      this.subcategories.forEach(subcategory => {
        if (subcategory.isModified && subcategory.isModified('name')) {
          subcategory.slug = subcategory.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to add subcategory
categorySchema.methods.addSubcategory = function(subcategoryData) {
  this.subcategories.push(subcategoryData);
  return this.save();
};

// Instance method to add item to subcategory
categorySchema.methods.addItemToSubcategory = function(subcategoryName, itemData) {
  const subcategory = this.subcategories.find(sub => sub.name === subcategoryName);
  if (subcategory) {
    subcategory.items.push(itemData);
    return this.save();
  }
  throw new Error('Subcategory not found');
};

// Instance method to get subcategory by name
categorySchema.methods.getSubcategory = function(subcategoryName) {
  return this.subcategories.find(sub => sub.name === subcategoryName);
};

// Instance method to get item by SKU
categorySchema.methods.getItemBySku = function(sku) {
  for (const subcategory of this.subcategories) {
    const item = subcategory.items.find(item => item.sku === sku);
    if (item) return item;
  }
  return null;
};

// Instance method to check if category can be deleted
categorySchema.methods.canDelete = function() {
  const totalItems = this.totalItemCount;
  if (totalItems > 0) {
    return { canDelete: false, reason: `Cannot delete category with ${totalItems} items` };
  }
  
  const subcategoryCount = this.subcategoryCount;
  if (subcategoryCount > 0) {
    return { canDelete: false, reason: `Cannot delete category with ${subcategoryCount} subcategories` };
  }
  
  return { canDelete: true };
};

// Indexes for better performance
categorySchema.index({ name: 1, isActive: 1 });
categorySchema.index({ slug: 1 }, { unique: true, sparse: true });
categorySchema.index({ 'subcategories.name': 1 });
categorySchema.index({ 'subcategories.items.sku': 1 });

export default mongoose.model('Category', categorySchema);
