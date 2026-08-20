const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Suhbat' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIConversation', aiConversationSchema);
