const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide the medicine name'],
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide the medicine category'],
    trim: true
  },
  unit: {
    type: String,
    required: [true, 'Please provide the unit (e.g. tablet, bottle)'],
    trim: true
  },
  reorderThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Reorder threshold cannot be negative']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Medicine', MedicineSchema);
