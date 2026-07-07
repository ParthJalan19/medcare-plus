const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please link this profile to a user account']
  },
  specialization: {
    type: String,
    required: [true, 'Please provide a specialization'],
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Please assign this doctor to a department']
  },
  qualifications: {
    type: String,
    required: [true, 'Please provide qualifications']
  },
  availability: {
    type: Map,
    of: [String],
    default: {
      "Monday": ["09:00-13:00", "14:00-17:00"],
      "Tuesday": ["09:00-13:00", "14:00-17:00"],
      "Wednesday": ["09:00-13:00", "14:00-17:00"],
      "Thursday": ["09:00-13:00", "14:00-17:00"],
      "Friday": ["09:00-13:00", "14:00-17:00"]
    }
  },
  consultationFee: {
    type: Number,
    required: [true, 'Please provide a consultation fee'],
    min: [0, 'Fee cannot be negative']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', DoctorSchema);
