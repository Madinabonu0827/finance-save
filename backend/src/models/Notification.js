const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['budget_80', 'budget_100', 'savings_goal_reached', 'recurring_payment'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    sentToTelegram: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
