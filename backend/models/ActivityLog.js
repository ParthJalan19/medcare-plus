const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  action: {
    type: String,
    required: [true, 'Please specify the action'],
    trim: true
  },
  targetType: {
    type: String,
    trim: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
