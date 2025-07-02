const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const { isAdmin, isModerator } = require('../utils/authMiddleware');

// Get all classes (for dropdowns)
router.get('/', async (req, res) => {
  const classes = await Class.find();
  res.json({ classes });
});

// Admin/Moderator: Add class
router.post('/', isAdmin, async (req, res) => {
  const { name, sections } = req.body;
  const c = new Class({ name, sections });
  await c.save();
  res.status(201).json({ message: 'Class created', class: c });
});

// Admin/Moderator: Add section to class
router.post('/:id/section', isAdmin, async (req, res) => {
  const { section } = req.body;
  const c = await Class.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Class not found' });
  if (!c.sections.includes(section)) c.sections.push(section);
  await c.save();
  res.json({ message: 'Section added', class: c });
});

module.exports = router;
