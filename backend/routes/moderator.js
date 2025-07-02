const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const cloudinaryConfig = require('../cloudinaryConfig');

cloudinary.config(cloudinaryConfig);

const resourceStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'resources',
    resource_type: 'auto',
    format: async (req, file) => undefined // keep original
  }
});
const bookStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'books',
    resource_type: 'image',
    format: async (req, file) => undefined // keep original
  }
});
const uploadResource = multer({ storage: resourceStorage });
const uploadBook = multer({ storage: bookStorage });
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
router.post('/resources', uploadResource.single('file'), async (req, res) => {
  try {
    const data = req.body;
    if (req.file) {
      data.file = req.file.path; // Cloudinary URL
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
  // Delete resource file from Cloudinary if it exists
  const resource = await Resource.findById(req.params.id);
  if (resource && resource.file) {
    if (resource.file.startsWith('http') && resource.file.includes('cloudinary')) {
      try {
        const urlParts = resource.file.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = 'resources/' + publicIdWithExt.split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        console.log('Resource file deleted from Cloudinary:', publicId);
      } catch (e) {
        console.warn('Failed to delete resource file from Cloudinary:', e.message);
      }
    }
  }
  // Also delete any files referenced in resource.link if it's a Cloudinary file
  if (resource && resource.link && resource.link.startsWith('http') && resource.link.includes('cloudinary')) {
    try {
      const urlParts = resource.link.split('/');
      const publicIdWithExt = urlParts[urlParts.length - 1];
      const publicId = 'resources/' + publicIdWithExt.split('.')[0];
      await cloudinary.uploader.destroy(publicId);
      console.log('Resource link file deleted from Cloudinary:', publicId);
    } catch (e) {
      console.warn('Failed to delete resource link file from Cloudinary:', e.message);
    }
  }
  await Resource.findByIdAndDelete(req.params.id);
  res.json({ message: 'Resource deleted' });
});

// ----- Book CRUD -----
router.get('/books', async (req, res) => {
  const books = await Book.find();
  res.json({ books });
});

// Book create with image upload
router.post('/books', uploadBook.single('image'), async (req, res) => {
  try {
    const data = req.body;
    if (req.file) {
      data.image = req.file.path; // Cloudinary URL
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
  // Delete book image from Cloudinary if it exists
  const book = await Book.findById(req.params.id);
  if (book && book.image && book.image.startsWith('http') && book.image.includes('cloudinary')) {
    try {
      const urlParts = book.image.split('/');
      const publicIdWithExt = urlParts[urlParts.length - 1];
      const publicId = 'books/' + publicIdWithExt.split('.')[0];
      await cloudinary.uploader.destroy(publicId);
      console.log('Book image deleted from Cloudinary:', publicId);
    } catch (e) {
      console.warn('Failed to delete book image from Cloudinary:', e.message);
    }
  }
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
