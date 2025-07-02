const multer = require('multer');
const path = require('path');

// Multer setup for file/image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'image' ? 'book_' : 'resource_';
    cb(null, prefix + Date.now() + ext);
  }
});
const upload = multer({ storage });
const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const Book = require('../models/Book');
const Class = require('../models/Class');
const { requireModerator } = require('../utils/authMiddleware');

// All routes require moderator
router.use(requireModerator);

// ----- Resource CRUD -----
router.get('/resources', async (req, res) => {
  const resources = await Resource.find();
  res.json({ resources });
});

// Resource create with file upload
router.post('/resources', upload.single('file'), async (req, res) => {
  try {
    const data = req.body;
    if (req.file) {
      data.file = '/uploads/' + req.file.filename;
    }
    // Set moderator from session
    if (req.session && req.session.userId) {
      data.moderator = req.session.userId;
    } else {
      return res.status(401).json({ message: 'Moderator not authenticated' });
    }
    const resource = new Resource(data);
    await resource.save();
    res.json({ resource });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add resource', error: err.message });
  }
});

router.put('/resources/:id', async (req, res) => {
  const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ resource });
});

router.delete('/resources/:id', async (req, res) => {
  await Resource.findByIdAndDelete(req.params.id);
  res.json({ message: 'Resource deleted' });
});

// ----- Book CRUD -----
router.get('/books', async (req, res) => {
  const books = await Book.find();
  res.json({ books });
});

// Book create with image upload
router.post('/books', upload.single('image'), async (req, res) => {
  try {
    const data = req.body;
    if (req.file) {
      data.image = '/uploads/' + req.file.filename;
    }
    // Set moderator from session
    if (req.session && req.session.userId) {
      data.moderator = req.session.userId;
    } else {
      return res.status(401).json({ message: 'Moderator not authenticated' });
    }
    const book = new Book(data);
    await book.save();
    res.json({ book });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add book', error: err.message });
  }
});

router.put('/books/:id', async (req, res) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ book });
});

router.delete('/books/:id', async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.json({ message: 'Book deleted' });
});

// ----- Class CRUD -----
router.get('/classes', async (req, res) => {
  const classes = await Class.find();
  res.json({ classes });
});

router.post('/classes', async (req, res) => {
  const newClass = new Class(req.body);
  await newClass.save();
  res.json({ class: newClass });
});

router.put('/classes/:id', async (req, res) => {
  const updated = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ class: updated });
});

router.delete('/classes/:id', async (req, res) => {
  await Class.findByIdAndDelete(req.params.id);
  res.json({ message: 'Class deleted' });
});

module.exports = router;
