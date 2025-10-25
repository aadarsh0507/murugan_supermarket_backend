import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const createDefaultAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fresh-flow-store');
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@supermart.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      process.exit(0);
    }

    // Create default admin user
    const adminUser = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@supermart.com',
      password: 'admin123', // This will be hashed by the pre-save middleware
      role: 'admin',
      department: 'management',
      phone: '+1234567890',
      address: {
        street: '123 Admin Street',
        city: 'Admin City',
        state: 'Admin State',
        zipCode: '12345',
        country: 'USA'
      },
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: {
          email: true,
          push: true
        }
      }
    });

    await adminUser.save();
    console.log('✅ Default admin user created successfully');
    console.log('📧 Email: admin@supermart.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

// Run the script
createDefaultAdmin();
