import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters'],
    index: true
  },
  contactPerson: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    designation: {
      type: String,
      trim: true,
      maxlength: [50, 'Designation cannot exceed 50 characters']
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  phone: {
    primary: {
      type: String,
      required: [true, 'Primary phone is required'],
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    secondary: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    }
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [10, 'Zip code cannot exceed 10 characters']
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
      maxlength: [50, 'Country cannot exceed 50 characters']
    }
  },
  stores: [{
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addedDate: {
      type: Date,
      default: Date.now
    }
  }],
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [15, 'GST number cannot exceed 15 characters']
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [10, 'PAN number cannot exceed 10 characters']
  },
  bankDetails: {
    accountNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Account number cannot exceed 20 characters']
    },
    bankName: {
      type: String,
      trim: true,
      maxlength: [100, 'Bank name cannot exceed 100 characters']
    },
    branch: {
      type: String,
      trim: true,
      maxlength: [100, 'Branch cannot exceed 100 characters']
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [11, 'IFSC code cannot exceed 11 characters']
    }
  },
  creditLimit: {
    type: Number,
    min: [0, 'Credit limit cannot be negative'],
    default: 0
  },
  paymentTerms: {
    type: String,
    trim: true,
    maxlength: [50, 'Payment terms cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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

// Virtual for contact person full name
supplierSchema.virtual('contactPerson.fullName').get(function() {
  return `${this.contactPerson.firstName} ${this.contactPerson.lastName || ''}`.trim();
});

// Virtual for active stores count
supplierSchema.virtual('activeStoresCount').get(function() {
  return this.stores.filter(s => s.isActive).length;
});

// Indexes for better performance
supplierSchema.index({ companyName: 1, isActive: 1 });
supplierSchema.index({ email: 1 });
supplierSchema.index({ 'phone.primary': 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ 'stores.store': 1 });

// Instance method to add a store
supplierSchema.methods.addStore = function(storeId) {
  const existingStore = this.stores.find(s => s.store.toString() === storeId.toString());
  if (!existingStore) {
    this.stores.push({
      store: storeId,
      isActive: true,
      addedDate: new Date()
    });
  }
  return this.save();
};

// Instance method to remove a store
supplierSchema.methods.removeStore = function(storeId) {
  this.stores = this.stores.filter(s => s.store.toString() !== storeId.toString());
  return this.save();
};

// Instance method to toggle store status
supplierSchema.methods.toggleStoreStatus = function(storeId) {
  const store = this.stores.find(s => s.store.toString() === storeId.toString());
  if (store) {
    store.isActive = !store.isActive;
  }
  return this.save();
};

export default mongoose.model('Supplier', supplierSchema);

