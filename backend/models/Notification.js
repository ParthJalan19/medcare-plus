const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please associate a target user']
  },
  message: {
    type: String,
    required: [true, 'Please provide the notification message'],
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'alert', 'success'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
