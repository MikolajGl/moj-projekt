const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  opisproblem: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('complaint', complaintSchema);