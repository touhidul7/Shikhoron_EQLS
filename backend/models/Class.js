const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  sections: [{ type: String }], // e.g. ['A', 'B', 'C']
});

module.exports = mongoose.model('Class', classSchema);
