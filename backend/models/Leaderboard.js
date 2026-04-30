import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:           { type: String, required: true },
  branch:         { type: String, default: 'CSE' },
  score:          { type: Number, required: true },      // computed (raw for practice, boosted for competition)
  correctAnswers: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timeTaken:      { type: Number, required: true },      // seconds
  rank:           { type: Number, default: 0 },
  type:           { type: String, enum: ['practice', 'competition'], required: true },
  competitionDate:{ type: String },                      // "YYYY-MM-DD" of the Sunday (for competitions)
  topicTitle:     { type: String },                      // for practice quizzes
}, { timestamps: true });

export default mongoose.model('Leaderboard', leaderboardSchema);
