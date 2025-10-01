// backend/routes/userRoute.js
import { Router } from 'express';
import User from '../model/usersModel.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

/* ───────────── register ───────────── */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).send({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await new User({ name, email, password: hashedPassword, role }).save();

    res.status(201).send({ success: true, message: 'User registered successfully' });
  } catch {
    res.status(500).send({ success: false, message: 'Error registering user' });
  }
});

/* ───────────── vendor register ───────────── */
router.post('/vendor-register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    if (await User.findOne({ email })) {
      return res.status(400).send({ success: false, message: 'Vendor already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create vendor user with role 'vendor'
    await new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: 'vendor',
      phone,
      address
    }).save();

    res.status(201).send({ success: true, message: 'Vendor registered successfully. Please login to continue.' });
  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).send({ success: false, message: 'Error registering vendor' });
  }
});

/* ───────────── login ───────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).send({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role
      },
      process.env.jwt_secret,
      { expiresIn: '1d' }
    );

    res.send({
      success: true,
      message: 'User logged in',
      data: {
        token,
        user: {
          id:    user._id,
          name:  user.name,
          email: user.email,
          role:  user.role
        }
      }
    });
  } catch {
    res.status(500).send({ success: false, message: 'Error logging in user' });
  }
});

/* ───────────── current user ───────────── */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }
    res.send({ success: true, data: user });
  } catch {
    res.status(500).send({ success: false, message: 'Error fetching user' });
  }
});

/* ───────────── get all users (admin only) ───────────── */
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).select('role');
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).send({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    res.send({
      success: true,
      message: 'Users fetched successfully',
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ 
      success: false, 
      message: 'Error fetching users' 
    });
  }
});

/* ───────────── get user by id (admin only) ───────────── */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).select('role');
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).send({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).send({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.send({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send({ 
      success: false, 
      message: 'Error fetching user' 
    });
  }
});

/* ───────────── update user role (admin only) ───────────── */
router.put('/:id/role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;

    const currentUser = await User.findById(req.userId).select('role');
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).send({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    if (!['user', 'vendor', 'admin'].includes(role)) {
      return res.status(400).send({ 
        success: false, 
        message: 'Invalid role. Must be user, vendor, or admin.' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).send({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.send({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).send({ 
      success: false, 
      message: 'Error updating user role' 
    });
  }
});

/* ───────────── delete user (admin only) ───────────── */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).select('role');
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).send({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    if (req.params.id === req.userId) {
      return res.status(400).send({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.send({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send({ 
      success: false, 
      message: 'Error deleting user' 
    });
  }
});
 
export default router;