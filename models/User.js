import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'employee', 'cashier'],
    default: 'employee'
  },
  department: {
    type: String,
    enum: ['management', 'sales', 'inventory', 'billing', 'reports'],
    default: 'sales'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordOTP: {
    type: String,
    default: null
  },
  resetPasswordOTPExpires: {
    type: Date,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  stores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }],
  selectedStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ stores: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Instance method to generate OTP for password reset
userSchema.methods.generateResetPasswordOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the OTP before storing
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  
  // Set OTP and expiration (10 minutes from now)
  this.resetPasswordOTP = hashedOTP;
  this.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return otp; // Return the plain OTP to send via email
};

// Instance method to verify OTP for password reset
userSchema.methods.verifyResetPasswordOTP = function(otp) {
  // Check if OTP exists and hasn't expired
  if (!this.resetPasswordOTP || !this.resetPasswordOTPExpires) {
    return false;
  }
  
  if (new Date() > this.resetPasswordOTPExpires) {
    // OTP has expired, clear it
    this.resetPasswordOTP = null;
    this.resetPasswordOTPExpires = null;
    return false;
  }
  
  // Hash the provided OTP and compare with stored hash
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  return hashedOTP === this.resetPasswordOTP;
};

// Instance method to clear OTP after successful reset
userSchema.methods.clearResetPasswordOTP = function() {
  this.resetPasswordOTP = null;
  this.resetPasswordOTPExpires = null;
  return this.save({ validateBeforeSave: false });
};

const User = mongoose.model('User', userSchema);

export default User;
