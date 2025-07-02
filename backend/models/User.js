const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  institutionName: { type: String, required: true }, // স্কুল, মাদ্রাসা, etc.
  class: { type: String, required: true }, // ৬, ৭, ৮, etc.
  // department: { type: String, required: true }, // Removed department field
  role: { type: String, enum: ['student', 'teacher', 'admin', 'moderator'], default: 'student' },
  profile: {
    bio: String,
    avatar: String,
    badges: [String],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    // Add more profile fields as needed
  },
  isVerifiedTeacher: { type: Boolean, default: false },
  appliedForPaid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  suspended: { type: Boolean, default: false }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
