import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  branch: { type: String, enum: ["CSE", "ECE", "EEE", "BIPC", "AGRI"], default: "CSE" },
  approvedTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
  draftTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },
  adminFeedback: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);
