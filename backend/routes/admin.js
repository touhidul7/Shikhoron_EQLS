const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Delete a user (student or moderator)
router.delete('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
});

// Remove moderator privileges (demote to student)
router.post('/remove-moderator', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'moderator') return res.status(400).json({ message: 'User is not a moderator' });
    user.role = 'student';
    await user.save();
    res.json({ message: 'Moderator privileges removed', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove moderator', error: err.message });
  }
});

// List all users (students and moderators)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['student', 'moderator'] } }).select('-password');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

// Suspend or unsuspend a user
router.post('/suspend-user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend } = req.body; // true or false
    const user = await User.findByIdAndUpdate(id, { suspended: suspend }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: suspend ? 'User suspended' : 'User unsuspended', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user suspension', error: err.message });
  }
});
// Add moderator (create new user with moderator role)
router.post('/add-moderator', async (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    let user = await User.findOne({ email });
    if (user) {
      if (user.role === 'moderator') {
        return res.status(400).json({ message: 'User is already a moderator' });
      }
      user.role = 'moderator';
      // Only update password if provided
      if (password) user.password = await bcrypt.hash(password, 10);
      await user.save();
      return res.json({ message: 'User promoted to moderator' });
    }
    // If user does not exist, require password to create
    if (!password) return res.status(400).json({ message: 'Password required to create new moderator' });
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      name: email.split('@')[0],
      email,
      password: hashedPassword,
      institutionType: 'N/A',
      class: 'N/A',
      role: 'moderator',
      profile: {}
    });
    await user.save();
    res.json({ message: 'Moderator added' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add/promote moderator', error: err.message });
  }
});

// List all moderators
router.get('/moderators', async (req, res) => {
  try {
    const moderators = await User.find({ role: 'moderator' }).select('-password');
    res.json(moderators);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch moderators', error: err.message });
  }
});

// Update moderator profile (name, email, etc.)
router.put('/moderator/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10);
    }
    const user = await User.findOneAndUpdate({ _id: id, role: 'moderator' }, update, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Moderator not found' });
    res.json({ message: 'Moderator updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update moderator', error: err.message });
  }
});
// Admin login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (
    email === process.env.EMAIL &&
    password === process.env.PASSWORD
  ) {
    req.session.isAdmin = true;
    res.json({ message: 'Admin login successful' });
  } else {
    res.status(401).json({ message: 'Invalid admin credentials' });
  }
});

// Admin logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});


// Admin session check (for frontend route guard)
router.get('/session', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ loggedIn: true });
  }
  res.status(401).json({ loggedIn: false });
});

// (Optional: keep /me for other uses)
router.get('/me', (req, res) => {
  if (req.session.isAdmin) {
    res.json({ isAdmin: true });
  } else {
    res.status(401).json({ message: 'Not logged in as admin' });
  }
});

module.exports = router;
