// Quick script to create an admin user
// Run with: node create-admin-user.js

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Connect to MongoDB
const MONGO_URI = 'mongodb://localhost:27017/containersDB';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'operator', 'viewer'], default: 'viewer' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin user
    const admin = new User({
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@example.com');
    console.log('   Password: password123');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  User already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

createAdminUser();


