const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  files: [{ type: String }],
  votes: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, value: Number }],
  reports: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reason: String }],
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Answer', answerSchema);
