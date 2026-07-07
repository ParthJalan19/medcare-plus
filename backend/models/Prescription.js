const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Please associate an appointment']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Please associate a doctor']
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Please associate a patient']
  },
  medicines: [
    {
      name: {
        type: String,
        required: [true, 'Please specify medicine name']
      },
      dosage: {
        type: String,
        required: [true, 'Please specify dosage (e.g. 500mg, 1 tablet)']
      },
      duration: {
        type: String,
        required: [true, 'Please specify duration (e.g. 5 days, 1 week)']
      },
      instructions: {
        type: String,
        required: [true, 'Please specify instructions (e.g. Once daily after food)']
      }
    }
  ],
  issuedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);
