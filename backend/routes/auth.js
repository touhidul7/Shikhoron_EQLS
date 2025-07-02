const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Set up multer for profile image uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Use user id if available, otherwise Date.now()
    let ext = path.extname(file.originalname);
    let userId = req.session && req.session.userId ? req.session.userId : Date.now();
    cb(null, userId + ext);
  }
});
const upload = multer({ storage });

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
      // Rename file to userId.ext
      const ext = path.extname(req.file.originalname);
      const newFilename = user._id + ext;
      const newPath = path.join(uploadDir, newFilename);
      fs.renameSync(req.file.path, newPath);
      avatar = `/uploads/${newFilename}`;
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

// Place this route AFTER all requires and variable declarations

// Update profile avatar
router.post('/update-avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Remove old avatar if exists
    if (user.profile && user.profile.avatar) {
      const oldPath = path.join(uploadDir, path.basename(user.profile.avatar));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    // Rename new file to userId.ext
    const ext = path.extname(req.file.originalname);
    const newFilename = user._id + ext;
    const newPath = path.join(uploadDir, newFilename);
    fs.renameSync(req.file.path, newPath);
    const avatar = `/uploads/${newFilename}`;
    user.profile.avatar = avatar;
    await user.save();
    res.json({ message: 'Avatar updated', avatar });
  } catch (err) {
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
