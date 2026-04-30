import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  branch: { type: String, enum: ["CSE", "ECE", "EEE", "BIPC", "AGRI"], default: "CSE" },
  progress: [{
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    completedAt: { type: Date }
  }],
  skillProfile: {
    skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    strongSkills: [{ type: String }],
    weakSkills: [{ type: String }],
    overallScore: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    badges: [{ type: String }]
  },
  otp: { type: String },
  otpExpires: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  lastPracticeQuizDate: { type: Date },  // For 3-day cooldown enforcement
  streak: { type: Number, default: 0 },
  lastActivityDate: { type: Date }       // For streak tracking
}, { timestamps: true });

export default mongoose.model('User', userSchema);
