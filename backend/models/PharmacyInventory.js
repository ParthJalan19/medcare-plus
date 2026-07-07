const mongoose = require('mongoose');

const PharmacyInventorySchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Please associate a medicine']
  },
  batchNumber: {
    type: String,
    required: [true, 'Please provide batch number'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please provide expiry date']
  },
  supplier: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PharmacyInventory', PharmacyInventorySchema);
