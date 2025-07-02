const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  class: { type: String, required: true },
  // department: { type: String, required: true }, // Removed department field
  subject: { type: [String], required: true }, // tags
  files: [{ type: String }], // file paths
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  votes: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, value: Number }],
  reports: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reason: String }],
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
