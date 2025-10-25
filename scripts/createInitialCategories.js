import mongoose from 'mongoose';
import Category from '../models/Category.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fresh-flow-store')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    createInitialCategories();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

async function createInitialCategories() {
  try {
    // Find or create an admin user for the createdBy field
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.findOne({ email: 'admin@example.com' });
    }
    
    if (!adminUser) {
      console.log('⚠️ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Check if categories already exist
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      console.log('📦 Categories already exist. Skipping creation.');
      process.exit(0);
    }

    // Create initial categories
    const initialCategories = [
      {
        name: "Dairy Products",
        description: "Fresh milk, cheese, yogurt and other dairy items",
        parentCategory: null,
        isActive: true,
        sortOrder: 1,
        color: "#3B82F6",
        icon: "Package",
        createdBy: adminUser._id
      },
      {
        name: "Fresh Milk",
        description: "Various types of fresh milk",
        parentCategory: null, // Will be updated after parent is created
        isActive: true,
        sortOrder: 1,
        color: "#10B981",
        icon: "Package",
        createdBy: adminUser._id
      },
      {
        name: "Bakery Items",
        description: "Fresh bread, pastries, and baked goods",
        parentCategory: null,
        isActive: true,
        sortOrder: 2,
        color: "#F59E0B",
        icon: "Package",
        createdBy: adminUser._id
      },
      {
        name: "Fruits & Vegetables",
        description: "Fresh fruits and vegetables",
        parentCategory: null,
        isActive: true,
        sortOrder: 3,
        color: "#EF4444",
        icon: "Package",
        createdBy: adminUser._id
      }
    ];

    // Create categories one by one to ensure proper slug generation
    const createdCategories = [];
    
    for (const categoryData of initialCategories) {
      const category = new Category(categoryData);
      await category.save();
      createdCategories.push(category);
      console.log(`✅ Created category: ${category.name} (slug: ${category.slug})`);
    }

    // Update Fresh Milk to be a subcategory of Dairy Products
    const dairyCategory = createdCategories.find(cat => cat.name === "Dairy Products");
    const milkCategory = createdCategories.find(cat => cat.name === "Fresh Milk");
    
    if (dairyCategory && milkCategory) {
      await Category.findByIdAndUpdate(milkCategory._id, {
        parentCategory: dairyCategory._id
      });
      console.log('✅ Updated Fresh Milk as subcategory of Dairy Products');
    }

    console.log('🎉 Initial categories created successfully!');
    console.log('\nCreated categories:');
    createdCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.isActive ? 'Active' : 'Inactive'})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating initial categories:', error);
    process.exit(1);
  }
}
