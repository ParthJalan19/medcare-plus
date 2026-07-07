const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Please associate a patient']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Please associate a doctor']
  },
  diagnosis: {
    type: String,
    required: [true, 'Please specify diagnosis'],
    trim: true
  },
  treatment: {
    type: String,
    required: [true, 'Please specify treatment plan'],
    trim: true
  },
  attachments: {
    type: [String],
    default: []
  },
  visitDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
