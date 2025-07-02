const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., Class 6, 7, 8
  nanoCategories: [{ type: String }], // e.g., Science, Humanities
});

module.exports = mongoose.model('Category', categorySchema);
