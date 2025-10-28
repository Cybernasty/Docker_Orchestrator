// Quick script to create a viewer user
// Run with: node create-viewer-user.js

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Connect to MongoDB Atlas
const MONGO_URI = 'mongodb+srv://zitounimontassar:R7XuZLoVK4QCFw0P@orcherstration.pscxr.mongodb.net/containers?retryWrites=true&w=majority';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'operator', 'viewer'], default: 'viewer' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createViewerUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Hash password
    const hashedPassword = await bcrypt.hash('viewer123', 10);

    // Create viewer user
    const viewer = new User({
      email: 'viewer@orchestrator.com',
      password: hashedPassword,
      role: 'viewer'
    });

    await viewer.save();
    console.log('✅ Viewer user created successfully!');
    console.log('');
    console.log('📋 User Details:');
    console.log('   Email: viewer@orchestrator.com');
    console.log('   Password: viewer123');
    console.log('   Role: viewer');
    console.log('');
    console.log('🔐 Permissions:');
    console.log('   ✅ View containers');
    console.log('   ✅ View logs');
    console.log('   ✅ View stats');
    console.log('   ✅ Access terminal');
    console.log('   ❌ Start/Stop containers (admin/operator only)');
    console.log('   ❌ Delete containers (admin/operator only)');
    console.log('   ❌ Create containers (admin/operator only)');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Viewer user already exists');
      console.log('');
      console.log('To update password, use: node update-user-password.js viewer@orchestrator.com');
    } else {
      console.error('❌ Error:', error.message);
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

createViewerUser();

