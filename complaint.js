const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Order' },
  opisproblem: { type: String, required: true },
//  pending: { type: String, required: true }, // nie zapomniec i w api tez
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);