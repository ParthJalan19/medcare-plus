const mongoose = require('mongoose');

const LabTestSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Please associate a patient']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Please associate a ordering doctor']
  },
  testType: {
    type: String,
    required: [true, 'Please specify the test type (e.g. CBC, Lipid Profile)'],
    trim: true
  },
  status: {
    type: String,
    enum: ['ordered', 'in-progress', 'completed'],
    default: 'ordered'
  },
  resultFile: {
    type: String,
    default: ''
  },
  orderedDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LabTest', LabTestSchema);
