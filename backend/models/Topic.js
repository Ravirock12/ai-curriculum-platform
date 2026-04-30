import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  branch: { type: String, enum: ["CSE", "ECE", "EEE", "BIPC", "AGRI"], default: "CSE" },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  estimatedTimeHours: { type: Number, default: 1 },
  category: { type: String, enum: ['core', 'advanced', 'elective'], default: 'core' },
  skills: [{ type: String }], // e.g., ["React", "JavaScript"]
  relevanceScore: { type: Number, min: 0, max: 100, default: 50 }, // 0-100 score based on industry demand
  status: { type: String, enum: ['outdated', 'relevant', 'emerging'], default: 'relevant' }
}, { timestamps: true });

export default mongoose.model('Topic', topicSchema);
