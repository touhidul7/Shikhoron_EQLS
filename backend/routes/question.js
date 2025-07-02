
// ...existing code...


const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinaryConfig = require('../cloudinaryConfig');
const path = require('path');
const fs = require('fs');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { isAuthenticated } = require('../utils/authMiddleware');

const router = express.Router();

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

// Get answers for a question
router.get('/:id/answers', async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.id }).populate('user', 'name role');
    res.json({ answers });
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

// Cloudinary for file deletion
let cloudinary;
try {
cloudinary = require('cloudinary').v2;
cloudinary.config(cloudinaryConfig);
} catch (e) {
  // Already loaded in main app, use global
  cloudinary = global.cloudinary;
}
// Set up multer for Cloudinary uploads for questions
const questionStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'questions',
    resource_type: 'auto',
    format: async (req, file) => undefined // keep original
  }
});
const upload = multer({ storage: questionStorage });

// Helper to delete a file from Cloudinary if it's a Cloudinary URL
async function deleteCloudinaryFile(url, folder) {
  if (url && url.startsWith('http') && url.includes('cloudinary')) {
    try {
      const urlParts = url.split('/');
      const publicIdWithExt = urlParts[urlParts.length - 1];
      const publicId = folder + '/' + publicIdWithExt.split('.')[0];
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('Attempted to delete from Cloudinary:', publicId, 'Result:', result);
    } catch (e) {
      console.warn('Failed to delete from Cloudinary:', e.message);
    }
  }
}
// Delete a question and its files (and answers)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('answers');
    if (!question) return res.status(404).json({ message: 'Question not found' });
    // Delete question files from Cloudinary
    if (question.files && question.files.length) {
      for (const fileUrl of question.files) {
        await deleteCloudinaryFile(fileUrl, 'questions');
      }
    }
    // Delete all answers and their files
    if (question.answers && question.answers.length) {
      for (const answer of question.answers) {
        if (answer.files && answer.files.length) {
          for (const fileUrl of answer.files) {
            await deleteCloudinaryFile(fileUrl, 'answers');
          }
        }
        await Answer.findByIdAndDelete(answer._id);
      }
    }
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question and related files deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete an answer and its files
router.delete('/:questionId/answers/:answerId', isAuthenticated, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });
    if (answer.files && answer.files.length) {
      for (const fileUrl of answer.files) {
        await deleteCloudinaryFile(fileUrl, 'answers');
      }
    }
    await Answer.findByIdAndDelete(req.params.answerId);
    // Remove answer ref from question
    await Question.findByIdAndUpdate(req.params.questionId, { $pull: { answers: req.params.answerId } });
    res.json({ message: 'Answer and related files deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// Create a question with file/image upload (Cloudinary)
router.post('/', isAuthenticated, upload.array('files', 5), async (req, res) => {
  try {
    const { title, description, class: userClass, group, subject } = req.body;
    const files = req.files ? req.files.map(f => f.path) : [];
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

// Answer a question with file/image upload (Cloudinary)
router.post('/:id/answer', isAuthenticated, upload.array('files', 5), async (req, res) => {
  try {
    // Allow admin, moderator, or student to answer
    const { content } = req.body;
    const files = req.files ? req.files.map(f => f.path) : [];
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

module.exports = router;
