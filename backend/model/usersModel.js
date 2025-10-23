import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true },
    role:      { type: String, enum: ['user', 'vendor', 'admin'], default: 'user' },
    
    // Vendor-specific fields (optional for regular users)
    phone:     { type: String },
    address:   { type: String }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
