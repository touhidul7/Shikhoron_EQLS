const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { isAuthenticated } = require('../utils/authMiddleware');

const router = express.Router();

// Set up multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Create a question with file/image upload
router.post('/', isAuthenticated, upload.array('files', 5), async (req, res) => {
  try {
    const { title, description, class: userClass, group, subject } = req.body;
    const files = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    // Prevent admin from posting questions (optional, or allow as needed)
    if (req.session.isAdmin) {
      return res.status(403).json({ message: 'Admin cannot post questions.' });
    }
    const question = new Question({
      title,
      description,
      class: userClass,
      group,
      subject: JSON.parse(subject),
      files,
      user: req.session.userId
    });
    await question.save();
    res.status(201).json({ message: 'Question posted', question });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get questions (with file/image URLs)
router.get('/', async (req, res) => {
  try {
    const { class: userClass, department, subject } = req.query;
    const filter = {};
    if (userClass) filter.class = userClass;
    if (department) filter.department = department;
    if (subject) filter.subject = subject;
    const questions = await Question.find(filter).populate('user', 'name role').sort({ createdAt: -1 });
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Upvote/Downvote a question
router.post('/:id/vote', isAuthenticated, async (req, res) => {
  try {
    // Prevent admin from voting (optional, or allow as needed)
    if (req.session.isAdmin) {
      return res.status(403).json({ message: 'Admin cannot vote.' });
    }
    const { value } = req.body; // 1 for upvote, -1 for downvote
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    const existingVote = question.votes.find(v => v.user.toString() === req.session.userId);
    if (existingVote) {
      existingVote.value = value;
    } else {
      question.votes.push({ user: req.session.userId, value });
    }
    await question.save();
    res.json({ message: 'Vote recorded' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Report a question
router.post('/:id/report', isAuthenticated, async (req, res) => {
  try {
    const { reason } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    question.reports.push({ user: req.session.userId, reason });
    await question.save();
    res.json({ message: 'Reported' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Answer a question with file/image upload
router.post('/:id/answer', isAuthenticated, upload.array('files', 5), async (req, res) => {
  try {
    // Allow admin, moderator, or student to answer
    const { content } = req.body;
    const files = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    let userId = req.session.userId;
    // If admin, create a pseudo user if not present
    if (req.session.isAdmin && !userId) {
      // Create/find a special admin user in the DB for answer ownership
      let adminUser = await User.findOne({ email: process.env.EMAIL });
      if (!adminUser) {
        adminUser = new User({
          name: 'Admin',
          email: process.env.EMAIL,
          password: await require('bcryptjs').hash(process.env.PASSWORD || 'admin', 10),
          institutionType: 'N/A',
          class: 'N/A',
          role: 'admin',
          profile: {}
        });
        await adminUser.save();
      }
      userId = adminUser._id;
    }
    const answer = new Answer({
      question: req.params.id,
      user: userId,
      content,
      files
    });
    await answer.save();
    await Question.findByIdAndUpdate(req.params.id, { $push: { answers: answer._id } });
    res.status(201).json({ message: 'Answer posted', answer });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get answers for a question
router.get('/:id/answers', async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.id }).populate('user', 'name role');
    res.json({ answers });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Upvote/Downvote an answer
router.post('/:id/answers/:answerId/vote', isAuthenticated, async (req, res) => {
  try {
    // Prevent admin from voting (optional, or allow as needed)
    if (req.session.isAdmin) {
      return res.status(403).json({ message: 'Admin cannot vote.' });
    }
    const { value } = req.body; // 1 for upvote, -1 for downvote
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });
    const existingVote = answer.votes.find(v => v.user.toString() === req.session.userId);
    if (existingVote) {
      existingVote.value = value;
    } else {
      answer.votes.push({ user: req.session.userId, value });
    }
    await answer.save();
    res.json({ message: 'Vote recorded', votes: answer.votes });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
