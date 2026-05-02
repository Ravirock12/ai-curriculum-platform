import mongoose from 'mongoose';

const roleRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedRole: {
    type: String,
    enum: ['teacher'],  // Only 'teacher' can be requested; 'admin' must be assigned manually
    required: true
  },
  requestedBranch: {
    type: String,
    enum: ['CSE', 'ECE', 'EEE', 'BIPC', 'AGRI']
  },
  reason: {
    type: String,
    maxlength: 500,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNote: {
    type: String,    // Feedback from admin on rejection/approval
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Prevent a user from having more than one pending request at a time
roleRequestSchema.index({ userId: 1, status: 1 });

export default mongoose.model('RoleRequest', roleRequestSchema);
