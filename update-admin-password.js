// Update admin user password
// Run with: node update-admin-password.js

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

async function updateAdminPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@orchestrator.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('   Run: node create-admin-user.js');
      process.exit(1);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Update password
    admin.password = hashedPassword;
    admin.role = 'admin'; // Ensure role is admin
    await admin.save();

    console.log('✅ Admin password updated successfully!');
    console.log('   Email: admin@orchestrator.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateAdminPassword();



