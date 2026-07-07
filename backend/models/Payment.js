const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: [true, 'Please associate a bill']
  },
  amount: {
    type: Number,
    required: [true, 'Please specify payment amount'],
    min: [0.01, 'Amount must be greater than zero']
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'insurance', 'other'],
    default: 'cash'
  },
  transactionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
