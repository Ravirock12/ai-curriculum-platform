import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }, // optional for competition quizzes
  branch: { type: String },                // for competition quizzes
  competitionDate: { type: String },       // "YYYY-MM-DD" sunday key
  questions: [{
    questionText: { type: String, required: true },
    type: { type: String, enum: ['mcq'], default: 'mcq' },
    options: {
      type: [{ type: String }],
      validate: [v => v.length === 4, 'Options must be exactly 4']
    },
    correctAnswer: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    explanation: { type: String }
  }]
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
