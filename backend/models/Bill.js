const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Please associate a patient']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  lineItems: [
    {
      description: {
        type: String,
        required: [true, 'Please provide line item description']
      },
      amount: {
        type: Number,
        required: [true, 'Please provide line item amount'],
        min: [0, 'Amount cannot be negative']
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: [true, 'Please provide total amount'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bill', BillSchema);
