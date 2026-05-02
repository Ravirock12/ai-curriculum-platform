import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import Topic from '../models/Topic.js';
import Leaderboard from '../models/Leaderboard.js';

// ─── Utility ────────────────────────────────────────────────────────────────

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Get the most recent Sunday as YYYY-MM-DD
const getCurrentSundayKey = () => {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day; // go back to Sunday
  const sunday = new Date(d.setDate(diff));
  return sunday.toISOString().split('T')[0];
};

// ─── Question Generator ─────────────────────────────────────────────────────

const generateQuestionsForTopic = (topic) => {
  const t = topic.title;
  const skills = Array.isArray(topic.skills) && topic.skills.length > 0 ? topic.skills.join(', ') : t;

  const questions = [
    // Easy (7)
    { questionText: `What is ${t}?`, options: ['A technology', 'A fruit', 'A planet', 'A car'], correctAnswer: 'A technology', difficulty: 'easy' },
    { questionText: `What is the primary purpose of ${t}?`, options: ['Core Logic', 'Styling', 'Hardware', 'Networking'], correctAnswer: 'Core Logic', difficulty: 'easy' },
    { questionText: `Is ${t} useful for modern development?`, options: ['Yes', 'No', 'Only for older apps', 'It is obsolete'], correctAnswer: 'Yes', difficulty: 'easy' },
    { questionText: `Which of the following describes ${t}?`, options: ['Tool', 'Database', 'Browser', 'OS'], correctAnswer: 'Tool', difficulty: 'easy' },
    { questionText: `Can ${t} run on multiple platforms?`, options: ['Yes, it is cross-platform', 'No, only Windows', 'No, only Mac', 'No, only Linux'], correctAnswer: 'Yes, it is cross-platform', difficulty: 'easy' },
    { questionText: `What type of problems does ${t} solve?`, options: ['Software', 'Hardware', 'Mechanics', 'Biology'], correctAnswer: 'Software', difficulty: 'easy' },
    { questionText: `Who uses ${t}?`, options: ['Developers', 'Chefs', 'Pilots', 'Doctors'], correctAnswer: 'Developers', difficulty: 'easy' },
    // Medium (7)
    { questionText: `In the context of ${t}, what does scalability refer to?`, options: ['Handling more workload', 'Shrinking file size', 'Hiring developers', 'Printing documents'], correctAnswer: 'Handling more workload', difficulty: 'medium' },
    { questionText: `What is a common use case for ${t}?`, options: ['Building applications', 'Cooking', 'Driving', 'Farming'], correctAnswer: 'Building applications', difficulty: 'medium' },
    { questionText: `How does ${t} improve efficiency?`, options: ['By automating tasks', 'By slowing down code', 'By increasing memory', 'By requiring manual input'], correctAnswer: 'By automating tasks', difficulty: 'medium' },
    { questionText: `Which skill is associated with ${t}?`, options: [skills, 'Reading', 'Writing', 'Running'], correctAnswer: skills, difficulty: 'medium' },
    { questionText: `What is a key feature of ${t}?`, options: ['Platform independence', 'It costs $1000', 'Requires physical discs', 'Requires 3D glasses'], correctAnswer: 'Platform independence', difficulty: 'medium' },
    { questionText: `What happens when ${t} crashes?`, options: ['Throws an error', 'Computer explodes', 'Prints paper', 'Nothing'], correctAnswer: 'Throws an error', difficulty: 'medium' },
    { questionText: `How is ${t} typically installed?`, options: ['Package manager', 'Floppy disk', 'Mail delivery', 'Hammer'], correctAnswer: 'Package manager', difficulty: 'medium' },
    // Hard (6)
    { questionText: `What is the time complexity of the core algorithm in ${t}?`, options: ['O(n)', 'O(1)', 'O(n^2)', 'Depends on implementation'], correctAnswer: 'Depends on implementation', difficulty: 'hard' },
    { questionText: `How does ${t} handle memory management?`, options: ['Garbage collection or manual', 'It ignores memory', 'Uses external hard drives', 'Only RAM'], correctAnswer: 'Garbage collection or manual', difficulty: 'hard' },
    { questionText: `What design pattern is most used with ${t}?`, options: ['MVC or similar', 'No pattern', 'Random', 'Chaos'], correctAnswer: 'MVC or similar', difficulty: 'hard' },
    { questionText: `How do you optimize ${t} for high concurrency?`, options: ['Async handling or pooling', 'Add sleep()', 'Remove variables', 'Use short names'], correctAnswer: 'Async handling or pooling', difficulty: 'hard' },
    { questionText: `What is a known limitation of ${t}?`, options: ['Specific edge-case performance overhead', 'Cannot print to screen', 'Cannot add numbers', 'Cannot be typed'], correctAnswer: 'Specific edge-case performance overhead', difficulty: 'hard' },
    { questionText: `How do you secure a production deployment of ${t}?`, options: ['Environment variables and proper auth', 'Publish passwords', 'Leave ports open', 'Use HTTP only'], correctAnswer: 'Environment variables and proper auth', difficulty: 'hard' }
  ];

  return questions.map(q => ({
    questionText: q.questionText,
    type: 'mcq',
    options: shuffleArray(q.options),
    correctAnswer: q.correctAnswer,
    difficulty: q.difficulty
  }));
};

// ─── Leaderboard rank recompute ─────────────────────────────────────────────

const recomputeRanks = async (type, competitionDate = null) => {
  const query = { type };
  if (competitionDate) query.competitionDate = competitionDate;

  const entries = await Leaderboard.find(query).sort({ score: -1, timeTaken: 1 });
  for (let i = 0; i < entries.length; i++) {
    entries[i].rank = i + 1;
    await entries[i].save();
  }
};

// ─── ROUTES ─────────────────────────────────────────────────────────────────

// GET /api/quiz/topic/:topicId — practice quiz (adaptive, 15 questions)
export const getQuizzesByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    let quizzes = await Quiz.find({ topicId });

    if (!quizzes || quizzes.length === 0) {
      const topic = await Topic.findById(topicId);
      if (!topic) return res.status(404).json({ message: 'Topic not found' });
      const generated = await Quiz.create({
        title: `${topic.title} Assessment`,
        topicId: topic._id,
        questions: generateQuestionsForTopic(topic)
      });
      quizzes = [generated];
    }

    // Adaptive filtering
    const user = req.user ? await User.findById(req.user.id) : null;
    const skillLevel = user?.skillProfile?.skillLevel || 'beginner';

    const quiz = quizzes[0].toObject();
    const allQuestions = quiz.questions;

    const easyQs   = allQuestions.filter(q => q.difficulty === 'easy');
    const mediumQs = allQuestions.filter(q => q.difficulty === 'medium');
    const hardQs   = allQuestions.filter(q => q.difficulty === 'hard');

    let selectedQs = [];
    if (skillLevel === 'beginner')      selectedQs = [...shuffleArray(easyQs).slice(0,7), ...shuffleArray(mediumQs).slice(0,6), ...shuffleArray(hardQs).slice(0,2)];
    else if (skillLevel === 'intermediate') selectedQs = [...shuffleArray(easyQs).slice(0,4), ...shuffleArray(mediumQs).slice(0,7), ...shuffleArray(hardQs).slice(0,4)];
    else                                selectedQs = [...shuffleArray(easyQs).slice(0,2), ...shuffleArray(mediumQs).slice(0,6), ...shuffleArray(hardQs).slice(0,7)];

    quiz.questions = selectedQs.length > 0 ? shuffleArray(selectedQs) : allQuestions;

    // Cooldown info
    let cooldownRemainingHours = 0;
    if (user?.lastPracticeQuizDate) {
      const hoursSinceLast = (Date.now() - new Date(user.lastPracticeQuizDate).getTime()) / (1000 * 60 * 60);
      cooldownRemainingHours = Math.max(0, Math.ceil(72 - hoursSinceLast));
    }

    res.json([{ ...quiz, cooldownRemainingHours }]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/quiz/competition — 30-question competition quiz (same for all on a Sunday)
export const getCompetitionQuiz = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const branch = user?.branch || 'CSE';
    const sundayKey = getCurrentSundayKey();

    // Look for existing competition quiz for this week + branch
    let compQuiz = await Quiz.findOne({ competitionDate: sundayKey, branch });

    if (!compQuiz) {
      // Generate from all topics in branch
      const topics = await Topic.find({ branch });
      if (!topics || topics.length === 0) {
        return res.status(404).json({ message: `No topics found for branch ${branch}` });
      }

      // Pool all questions from all branch topics
      let allPool = [];
      for (const topic of topics) {
        allPool = allPool.concat(generateQuestionsForTopic(topic));
      }

      // Select 30: 10 easy, 12 medium, 8 hard
      const easyPool   = shuffleArray(allPool.filter(q => q.difficulty === 'easy'));
      const mediumPool = shuffleArray(allPool.filter(q => q.difficulty === 'medium'));
      const hardPool   = shuffleArray(allPool.filter(q => q.difficulty === 'hard'));
      const selected   = [...easyPool.slice(0,10), ...mediumPool.slice(0,12), ...hardPool.slice(0,8)];
      const finalQs    = shuffleArray(selected).slice(0, 30);

      compQuiz = await Quiz.create({
        title: `${branch} Weekly Competition — ${sundayKey}`,
        branch,
        competitionDate: sundayKey,
        questions: finalQs
      });
    }

    res.json(compQuiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/quiz/schedule
export const getQuizSchedule = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let cooldownRemainingHours = 0;
    if (user?.lastPracticeQuizDate) {
      const hoursSinceLast = (Date.now() - new Date(user.lastPracticeQuizDate).getTime()) / (1000 * 60 * 60);
      cooldownRemainingHours = Math.max(0, Math.ceil(72 - hoursSinceLast));
    }
    // Next Sunday
    const d = new Date();
    const daysUntilSunday = (7 - d.getDay()) % 7 || 7;
    const nextSunday = new Date(d);
    nextSunday.setDate(d.getDate() + daysUntilSunday);
    nextSunday.setHours(0, 0, 0, 0);

    res.json({
      cooldownRemainingHours,
      practiceAvailable: cooldownRemainingHours === 0,
      nextCompetition: nextSunday.toISOString(),
      isCompetitionDay: d.getDay() === 0,  // true if today is Sunday
      streak: user?.streak || 0,
      level: Math.floor((user?.skillProfile?.xp || 0) / 100)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/quiz/leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { type = 'competition', date, branch } = req.query;
    const query = { type };
    if (type === 'competition') {
      query.competitionDate = date || getCurrentSundayKey();
    }
    if (branch && branch !== 'ALL') {
      query.branch = branch;
    }

    const entries = await Leaderboard.find(query)
      .sort({ score: -1, timeTaken: 1 })
      .limit(50)
      .lean();

    // Inject rank
    const ranked = entries.map((e, i) => ({ ...e, rank: i + 1 }));

    // Find current user's entry
    const userId = req.user.id;
    const myEntry = ranked.find(e => e.userId.toString() === userId.toString());

    res.json({ leaderboard: ranked, myEntry: myEntry || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/quiz/submit
export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, totalTimeTakenSeconds, quizType = 'practice', competitionDate } = req.body;
    const userId = req.user.id;

    const quiz = await Quiz.findById(quizId).populate('topicId');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Score calculation
    let score = 0;
    const processedAnswers = (Array.isArray(answers) ? answers : []).map(ans => {
      const question = quiz.questions.id(ans.questionId);
      if (!question) return { questionId: ans.questionId, answer: ans.answer, isCorrect: false };
      const isCorrect = question.correctAnswer.toLowerCase().trim() === ans.answer.toLowerCase().trim();
      if (isCorrect) score++;
      return { questionId: ans.questionId, answer: ans.answer, isCorrect, timeTakenSeconds: ans.timeTakenSeconds };
    });

    const totalQs = quiz.questions.length;
    const performanceTag = (score / totalQs) >= 0.8 ? 'excellent' : (score / totalQs) >= 0.6 ? 'good' : (score / totalQs) >= 0.4 ? 'average' : 'poor';

    // Competition score formula: (correct × 10) + timeBonus
    const MAX_COMPETITION_SECONDS = 1200; // 20 min
    const leaderboardScore = quizType === 'competition'
      ? (score * 10) + Math.max(0, MAX_COMPETITION_SECONDS - (totalTimeTakenSeconds || 0))
      : score;

    const attempt = await QuizAttempt.create({
      userId, quizId,
      topicId: quiz.topicId?._id || null,
      score,
      totalQuestions: totalQs,
      answers: processedAnswers,
      totalTimeTakenSeconds,
      performanceTag,
      quizType,
      competitionDate: quizType === 'competition' ? (competitionDate || getCurrentSundayKey()) : undefined
    });

    // User profile update
    const user = await User.findById(userId);
    const topicTitle = quiz.topicId?.title || quiz.title;
    const scorePct = score / totalQs;

    if (quizType === 'practice') {
      user.lastPracticeQuizDate = new Date();
    }

    // Adaptive difficulty
    user.skillProfile.skillLevel = scorePct < 0.4 ? 'beginner' : scorePct < 0.7 ? 'intermediate' : 'advanced';

    if (performanceTag === 'excellent' || performanceTag === 'good') {
      if (!user.skillProfile.strongSkills.includes(topicTitle)) user.skillProfile.strongSkills.push(topicTitle);
      user.skillProfile.weakSkills = user.skillProfile.weakSkills.filter(s => s !== topicTitle);
      user.skillProfile.xp += quizType === 'competition' ? 100 : 50;
    } else if (performanceTag === 'poor') {
      if (!user.skillProfile.weakSkills.includes(topicTitle)) user.skillProfile.weakSkills.push(topicTitle);
      user.skillProfile.strongSkills = user.skillProfile.strongSkills.filter(s => s !== topicTitle);
      user.skillProfile.xp += quizType === 'competition' ? 20 : 10;
    } else {
      user.skillProfile.xp += quizType === 'competition' ? 50 : 25;
    }

    // Overall score
    const allAttempts = await QuizAttempt.find({ userId });
    const totalScorePct = allAttempts.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0);
    user.skillProfile.overallScore = Math.round((totalScorePct / allAttempts.length) * 100);

    // XP-level badges
    if (user.skillProfile.xp >= 1000 && !user.skillProfile.badges.includes('Expert')) user.skillProfile.badges.push('Expert');
    else if (user.skillProfile.xp >= 500 && !user.skillProfile.badges.includes('Intermediate')) user.skillProfile.badges.push('Intermediate');
    else if (user.skillProfile.xp >= 100 && !user.skillProfile.badges.includes('Beginner')) user.skillProfile.badges.push('Beginner');

    // Milestone badges
    const newBadges = [];
    const totalAttemptCount = (await QuizAttempt.find({ userId })).length; // includes current
    if (totalAttemptCount >= 1 && !user.skillProfile.badges.includes('First Quiz 🎯')) {
      user.skillProfile.badges.push('First Quiz 🎯');
      newBadges.push('First Quiz 🎯');
    }
    if (totalAttemptCount >= 5 && !user.skillProfile.badges.includes('Quiz Master 🏅')) {
      user.skillProfile.badges.push('Quiz Master 🏅');
      newBadges.push('Quiz Master 🏅');
    }
    if (scorePct >= 0.8 && !user.skillProfile.badges.includes('Top Performer ⭐')) {
      user.skillProfile.badges.push('Top Performer ⭐');
      newBadges.push('Top Performer ⭐');
    }

    // Streak tracking
    const now = new Date();
    const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null;
    const daysSinceLast = lastActivity
      ? Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24))
      : null;
    if (daysSinceLast === null || daysSinceLast >= 2) {
      user.streak = 1; // reset
    } else if (daysSinceLast === 1) {
      user.streak = (user.streak || 0) + 1; // extend
    }
    // same day — keep streak unchanged
    user.lastActivityDate = now;

    await user.save();

    // Write to leaderboard
    const lbEntry = await Leaderboard.create({
      userId,
      name: user.name,
      branch: user.branch || 'CSE',
      score: leaderboardScore,
      correctAnswers: score,
      totalQuestions: totalQs,
      timeTaken: totalTimeTakenSeconds || 0,
      type: quizType,
      competitionDate: quizType === 'competition' ? (competitionDate || getCurrentSundayKey()) : null,
      topicTitle: quiz.topicId?.title || quiz.title
    });

    await recomputeRanks(quizType, quizType === 'competition' ? (competitionDate || getCurrentSundayKey()) : null);

    // 🔴 Real-time: notify all connected clients that leaderboard changed
    if (global.io) {
      global.io.emit('leaderboardUpdated', {
        type: quizType,
        branch: user.branch || 'CSE',
        newEntry: {
          name: user.name,
          score: leaderboardScore,
          branch: user.branch
        }
      });
    }

    res.status(201).json({ attempt, skillProfile: user.skillProfile, leaderboardScore, rank: lbEntry.rank, newBadges, streak: user.streak || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/quiz/analytics/student
export const getStudentAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const attempts = await QuizAttempt.find({ userId }).populate('topicId').sort({ createdAt: 1 });
    const topicStats = {};
    attempts.forEach(att => {
      const topicId = att.topicId?._id?.toString() || att.quizId?.toString();
      if (!topicStats[topicId]) topicStats[topicId] = { title: att.topicId?.title || 'Quiz', scores: [], latestScore: 0 };
      topicStats[topicId].scores.push((att.score / att.totalQuestions) * 100);
      topicStats[topicId].latestScore = (att.score / att.totalQuestions) * 100;
    });
    res.json({ attempts, topicStats: Object.values(topicStats) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/quiz/analytics/class
// Returns topic analytics. Teachers ONLY see their own branch. Admins see all (optional ?branch= filter).
export const getClassAnalytics = async (req, res) => {
  try {
    // Security: derive branch from the authenticated user, not from query params.
    // Admins can optionally override with ?branch=
    let branch;
    if (req.user.role === 'admin') {
      branch = req.query.branch || null; // null = all branches
    } else {
      branch = req.user.branch; // teachers LOCKED to their own branch
    }

    const topicFilter = branch ? { branch } : {};
    const allTopics = await Topic.find(topicFilter);

    const analytics = await Promise.all(allTopics.map(async (topic) => {
      const attempts = await QuizAttempt.find({ topicId: topic._id });
      if (attempts.length === 0) return null;
      const totalStudents = new Set(attempts.map(a => a.userId.toString())).size;
      const weakAttempts = attempts.filter(a => a.performanceTag === 'poor' || a.performanceTag === 'average');
      const weakPercentage = (weakAttempts.length / attempts.length) * 100;
      return {
        topicId: topic._id,
        topicTitle: topic.title,
        branch: topic.branch,
        totalAttempts: attempts.length,
        uniqueStudents: totalStudents,
        weakPercentage: Math.round(weakPercentage),
        isCritical: weakPercentage > 60
      };
    }));

    res.json(analytics.filter(a => a !== null));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/quiz/branch/students
// Returns all student profiles + quiz stats for the teacher's branch.
// Branch is derived from teacher's profile — not from query string (prevents cross-branch snooping).
export const getBranchStudents = async (req, res) => {
  try {
    // Enforce: only teachers/admins reach here (middleware handles it).
    // Lock teacher to their own branch. Admin can use ?branch= override.
    let branch;
    if (req.user.role === 'admin') {
      branch = req.query.branch || req.user.branch;
    } else {
      branch = req.user.branch; // LOCKED — teacher cannot query another branch
    }

    if (!branch) {
      return res.status(400).json({ message: 'Branch could not be determined. Please ensure your profile has a branch assigned.' });
    }

    // Fetch students in this branch only
    const students = await User.find({ branch, role: 'student' })
      .select('name email branch skillProfile.overallScore skillProfile.xp skillProfile.badges skillProfile.weakSkills skillProfile.strongSkills skillProfile.skillLevel createdAt')
      .lean();

    // Enrich each student with their quiz attempt summary
    const enriched = await Promise.all(students.map(async (student) => {
      const attempts = await QuizAttempt.find({ userId: student._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const totalAttempts = attempts.length;
      const avgScore = totalAttempts > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / totalAttempts)
        : 0;

      const lastActivity = attempts.length > 0 ? attempts[0].createdAt : null;

      return {
        ...student,
        quizStats: { totalAttempts, avgScore, lastActivity }
      };
    }));

    res.json({
      branch,
      totalStudents: enriched.length,
      students: enriched
    });
  } catch (error) {
    console.error('getBranchStudents error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/quiz/branch/summary
// Returns aggregate stats for the teacher's branch: avg score, top/weak topics, student count.
export const getBranchSummary = async (req, res) => {
  try {
    let branch;
    if (req.user.role === 'admin') {
      branch = req.query.branch || req.user.branch;
    } else {
      branch = req.user.branch; // LOCKED
    }

    if (!branch) {
      return res.status(400).json({ message: 'Branch not set on teacher profile.' });
    }

    // All students in branch
    const students = await User.find({ branch, role: 'student' }).lean();
    const studentIds = students.map(s => s._id);

    // All quiz attempts by students in this branch
    const attempts = await QuizAttempt.find({ userId: { $in: studentIds } })
      .populate('topicId', 'title branch')
      .lean();

    const totalAttempts = attempts.length;
    const branchAvgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / totalAttempts)
      : 0;

    // Per-topic aggregation
    const topicMap = {};
    attempts.forEach(att => {
      const key = att.topicId?._id?.toString();
      if (!key) return;
      if (!topicMap[key]) {
        topicMap[key] = { title: att.topicId.title, scores: [], weakCount: 0, total: 0 };
      }
      topicMap[key].scores.push((att.score / att.totalQuestions) * 100);
      topicMap[key].total++;
      if (att.performanceTag === 'poor' || att.performanceTag === 'average') {
        topicMap[key].weakCount++;
      }
    });

    const topicStats = Object.values(topicMap).map(t => ({
      title: t.title,
      avgScore: Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length),
      weakPercentage: Math.round((t.weakCount / t.total) * 100),
      totalAttempts: t.total
    })).sort((a, b) => b.weakPercentage - a.weakPercentage);

    const weakTopics  = topicStats.filter(t => t.weakPercentage > 60).slice(0, 5);
    const strongTopics = [...topicStats].sort((a, b) => a.weakPercentage - b.weakPercentage).slice(0, 5);

    // Performance distribution
    const distribution = { excellent: 0, good: 0, average: 0, poor: 0 };
    attempts.forEach(a => { if (distribution[a.performanceTag] !== undefined) distribution[a.performanceTag]++; });

    res.json({
      branch,
      totalStudents: students.length,
      totalAttempts,
      branchAvgScore,
      topicStats,
      weakTopics,
      strongTopics,
      distribution
    });
  } catch (error) {
    console.error('getBranchSummary error:', error);
    res.status(500).json({ message: error.message });
  }
};



// POST /api/quiz/seed
export const seedQuizzes = async (req, res) => {
  try {
    const topics = await Topic.find();
    if (topics.length === 0) return res.status(400).json({ message: 'No topics found' });
    await Quiz.deleteMany({});
    await Quiz.insertMany(topics.map(topic => ({
      title: `${topic.title} Assessment`,
      topicId: topic._id,
      questions: generateQuestionsForTopic(topic)
    })));
    res.json({ message: 'Quizzes seeded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
