import mongoose from 'mongoose';

const trendSchema = new mongoose.Schema({
  skill: { type: String, required: true, unique: true },
  demandScore: { type: Number, required: true, min: 0, max: 100 }, // Current industry demand
  growthRate: { type: Number, default: 0 }, // Positive or negative %
  category: { type: String } // e.g., 'Web Development', 'AI/ML'
}, { timestamps: true });

export default mongoose.model('Trend', trendSchema);
