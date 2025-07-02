const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// Use existing cloudinary instance if already loaded
let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
} catch (e) {
  cloudinary = global.cloudinary;
}
const cloudinaryConfig = require('../cloudinaryConfig');
cloudinary.config(cloudinaryConfig);
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'avatars',
    resource_type: 'image',
    format: async (req, file) => undefined // keep original
  }
});
const upload = multer({ storage: avatarStorage });
// No longer need path, fs, or uploadDir

// Update profile info (PUT /auth/profile)
router.put('/profile', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
    const { name, institutionName, class: userClass, group, bio } = req.body;
    if (!name || !institutionName) {
      return res.status(400).json({ message: 'Institution Name and Name are required.' });
    }
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.name = name;
    user.institutionName = institutionName;
    // Only require class for non-admins
    if (user.role !== 'admin') {
      if (!userClass) return res.status(400).json({ message: 'Class is required.' });
      user.class = userClass;
    } else {
      user.class = userClass || '-';
    }
    user.group = group;
    if (!user.profile) user.profile = {};
    user.profile.bio = bio;
    await user.save();
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// Register
router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, password, institutionName, class: userClass, role } = req.body;
    if (!name || !email || !password || !institutionName || !userClass) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered.' });
    // Save user first to get the id
    const user = new User({ name, email, password, institutionName, class: userClass, role });
    await user.save();
    let avatar = '';
    if (req.file) {
      avatar = req.file.path; // Cloudinary URL
      user.profile.avatar = avatar;
      await user.save();
    }
    req.session.userId = user._id;
    res.status(201).json({ message: 'Registration successful', user: { name, email, role, class: userClass, avatar } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// ...existing code...

// Update profile avatar
router.post('/update-avatar', upload.single('avatar'), async (req, res) => {
  console.log('Received avatar upload request');
  try {
    if (!req.session.userId) {
      console.log('Not logged in');
      return res.status(401).json({ message: 'Not logged in' });
    }
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const user = await User.findById(req.session.userId);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    // Delete old avatar from Cloudinary if it exists
    if (user.profile && user.profile.avatar) {
      try {
        const urlParts = user.profile.avatar.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = 'avatars/' + publicIdWithExt.split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        console.log('Old avatar deleted from Cloudinary:', publicId);
      } catch (e) {
        console.warn('Failed to delete old avatar from Cloudinary:', e.message);
      }
    }
    // Update with new avatar
    if (!user.profile) user.profile = {};
    user.profile.avatar = req.file.path;
    user.markModified('profile');
    await user.save();
    console.log('Avatar updated successfully:', user.profile.avatar);
    res.json({ message: 'Avatar updated', avatar: user.profile.avatar });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
// Unified login: check .env admin, then User collection
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check .env admin
    if (
      email === process.env.EMAIL &&
      password === process.env.PASSWORD
    ) {
      // Find admin user in DB
      const adminUser = await User.findOne({ email });
      if (adminUser) {
        req.session.userId = adminUser._id;
        req.session.isAdmin = true;
        return res.json({ message: 'Login successful', user: {
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          class: adminUser.class,
          institutionName: adminUser.institutionName,
          profile: adminUser.profile
        }});
      } else {
        // fallback: legacy, shouldn't happen
        req.session.isAdmin = true;
        return res.json({ message: 'Login successful', user: { name: 'Admin', email, role: 'admin', class: '-', institutionName: 'Other', profile: {} } });
      }
    }
    // Check User collection
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.suspended) return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    req.session.userId = user._id;
    // If user is moderator, set session flag
    if (user.role === 'moderator') req.session.isModerator = true;
    res.json({ message: 'Login successful', user: { name: user.name, email: user.email, role: user.role, class: user.class, institutionName: user.institutionName, profile: user.profile } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// Session check
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
  const user = await User.findById(req.session.userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

module.exports = router;
