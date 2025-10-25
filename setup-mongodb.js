#!/usr/bin/env node

/**
 * MongoDB Setup Helper Script
 * This script helps you set up MongoDB for the Fresh Flow Store application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Fresh Flow Store - MongoDB Setup Helper\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Configuration
# Option 1: MongoDB Atlas (Cloud) - Replace with your Atlas connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fresh-flow-store?retryWrites=true&w=majority

# Option 2: Local MongoDB (uncomment if you have MongoDB installed locally)
MONGODB_URI=mongodb://localhost:27017/fresh-flow-store

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-${Date.now()}
JWT_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (for password reset)
EMAIL_FROM=noreply@freshflowstore.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    console.log('\n📋 Please create a .env file manually with the following content:');
    console.log(envContent);
  }
} else {
  console.log('✅ .env file already exists');
}

console.log('\n📋 MongoDB Setup Options:');
console.log('\n1. 🏠 Local MongoDB Installation:');
console.log('   - Download from: https://www.mongodb.com/try/download/community');
console.log('   - Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
console.log('   - The .env file is already configured for local MongoDB');

console.log('\n2. ☁️  MongoDB Atlas (Cloud - Recommended for testing):');
console.log('   - Sign up at: https://www.mongodb.com/atlas');
console.log('   - Create a free cluster');
console.log('   - Get your connection string');
console.log('   - Update MONGODB_URI in .env file with your Atlas connection string');

console.log('\n3. 🐳 Docker MongoDB (if you have Docker installed):');
console.log('   docker run -d -p 27017:27017 --name mongodb mongo:latest');

console.log('\n💡 After setting up MongoDB, run: npm start');
console.log('🔗 The server will be available at: http://localhost:5000');
