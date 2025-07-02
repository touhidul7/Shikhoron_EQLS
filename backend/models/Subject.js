const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., Bangla, English, Math
  tags: [{ type: String }],
});

module.exports = mongoose.model('Subject', subjectSchema);
