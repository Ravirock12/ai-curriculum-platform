import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    answer: { type: String },
    isCorrect: { type: Boolean },
    timeTakenSeconds: { type: Number }
  }],
  totalTimeTakenSeconds: { type: Number },
  performanceTag: { type: String, enum: ['poor', 'average', 'good', 'excellent'] },
  quizType: { type: String, enum: ['practice', 'competition'], default: 'practice' },
  competitionDate: { type: String } // "YYYY-MM-DD" of the Sunday
}, { timestamps: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
