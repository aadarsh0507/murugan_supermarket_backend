import mongoose from 'mongoose';

const barcodeSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true,
    index: true
  },
  purchaseOrderNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  itemSku: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  storeName: {
    type: String,
    required: true,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  usedDate: {
    type: Date
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

// Indexes for better performance
barcodeSchema.index({ purchaseOrder: 1, isUsed: 1 });
barcodeSchema.index({ itemSku: 1, isUsed: 1 });
barcodeSchema.index({ barcode: 1 });

// Helper function to calculate EAN-13 checksum
function calculateEAN13Checksum(digits) {
  if (digits.length !== 12) {
    throw new Error('EAN-13 requires exactly 12 data digits');
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    // EAN-13: odd positions (1-indexed) multiply by 1, even positions by 3
    // Array is 0-indexed, so position 0 (1st) uses 1, position 1 (2nd) uses 3, etc.
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checksum = (10 - (sum % 10)) % 10;
  return checksum;
}

// Static method to generate unique EAN-13 barcode
barcodeSchema.statics.generateBarcode = async function() {
  let isUnique = false;
  let barcode = null;
  
  while (!isUnique) {
    // Generate 12-digit base (data digits only)
    // Use timestamp (last 7 digits) + random (5 digits) = 12 digits
    const timestamp = Date.now().toString().slice(-7); // Last 7 digits of timestamp
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const base12Digits = timestamp + random;
    
    // Calculate checksum digit
    const checksum = calculateEAN13Checksum(base12Digits);
    
    // Final barcode: 12 data digits + 1 checksum digit = 13 digits total
    barcode = base12Digits + checksum.toString();
    
    // Ensure uniqueness
    const exists = await this.findOne({ barcode });
    if (!exists) {
      isUnique = true;
    }
  }
  
  return barcode;
};

export default mongoose.model('Barcode', barcodeSchema);

