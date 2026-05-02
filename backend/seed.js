// ============================================================
// seed.js — Production-safe database seeder
// Only uses defined topic variables. Proper bcrypt hashing.
// Throws on error so the caller (server.js) can handle it.
// ============================================================

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Subject from './models/Subject.js';
import Topic from './models/Topic.js';
import Trend from './models/Trend.js';
import Quiz from './models/Quiz.js';
import QuizAttempt from './models/QuizAttempt.js';

const seedDatabase = async (forceReseed = false) => {
  try {
    const userCount = await User.countDocuments();

    if (userCount > 0 && !forceReseed) {
      console.log('✅ Database already has data. Skipping seed.');
      console.log('   (POST /api/admin/reset-db to force re-seed)');
      return;
    }

    if (userCount > 0 && forceReseed) {
      console.log('🔄 Force re-seed requested. Dropping existing data...');
      await mongoose.connection.db.dropDatabase();
    }

    console.log('🌱 Seeding initial data...');

    // ── Shared password hash (used for all seeded accounts) ──
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // ── Core users ───────────────────────────────────────────
    await User.create([
      { name: 'Admin Demo',   email: 'admin@demo.com',   password: hashedPassword, role: 'admin'   },
      { name: 'Teacher Demo', email: 'teacher@demo.com', password: hashedPassword, role: 'teacher' },
      { name: 'Student Demo', email: 'student@demo.com', password: hashedPassword, role: 'student' },
    ]);

    // ── CSE Branch Topics ────────────────────────────────────
    const topicHtml = await Topic.create({
      title: 'HTML 4 Basics',
      description: 'Learn foundational structure using legacy HTML4.',
      branch: 'CSE', difficulty: 'beginner', estimatedTimeHours: 10,
      category: 'core', skills: ['HTML'], relevanceScore: 30, status: 'outdated'
    });

    const topicReact = await Topic.create({
      title: 'React.js UI',
      description: 'Modern component-based UI development.',
      branch: 'CSE', difficulty: 'intermediate', estimatedTimeHours: 40,
      category: 'core', skills: ['React'], relevanceScore: 90, status: 'emerging'
    });

    const topicNode = await Topic.create({
      title: 'Node.js Backend',
      description: 'Server-side JavaScript with Express.',
      branch: 'CSE', difficulty: 'advanced', estimatedTimeHours: 35,
      category: 'core', skills: ['Node', 'Express'], relevanceScore: 85, status: 'emerging'
    });

    await Subject.create({
      title: 'Fullstack Web Development',
      description: 'End-to-end web development curriculum.',
      branch: 'CSE',
      approvedTopics: [topicHtml._id, topicReact._id, topicNode._id],
      draftTopics:    [topicHtml._id, topicReact._id, topicNode._id],
      status: 'approved'
    });

    // ── ECE Branch ───────────────────────────────────────────
    const topicSignals = await Topic.create({
      title: 'Digital Signal Processing',
      description: 'Analyze and process digital signals.',
      branch: 'ECE', difficulty: 'advanced', estimatedTimeHours: 30,
      category: 'core', skills: ['DSP', 'MATLAB'], relevanceScore: 80, status: 'relevant'
    });

    await Subject.create({
      title: 'Core Electronics',
      description: 'Fundamentals of electronic circuits and signals.',
      branch: 'ECE',
      approvedTopics: [topicSignals._id],
      draftTopics:    [topicSignals._id],
      status: 'approved'
    });

    // ── EEE Branch ───────────────────────────────────────────
    const topicPower = await Topic.create({
      title: 'Power Systems',
      description: 'Power grid analysis and distribution.',
      branch: 'EEE', difficulty: 'advanced', estimatedTimeHours: 35,
      category: 'core', skills: ['Power Electronics'], relevanceScore: 75, status: 'relevant'
    });

    await Subject.create({
      title: 'Power Engineering',
      description: 'Core electrical power concepts.',
      branch: 'EEE',
      approvedTopics: [topicPower._id],
      draftTopics:    [topicPower._id],
      status: 'approved'
    });

    // ── BIPC Branch ──────────────────────────────────────────
    const topicAnatomy = await Topic.create({
      title: 'Human Anatomy',
      description: 'Study of the human body and organ systems.',
      branch: 'BIPC', difficulty: 'intermediate', estimatedTimeHours: 40,
      category: 'core', skills: ['Biology'], relevanceScore: 85, status: 'relevant'
    });

    await Subject.create({
      title: 'Medical Sciences',
      description: 'Pre-medical foundation curriculum.',
      branch: 'BIPC',
      approvedTopics: [topicAnatomy._id],
      draftTopics:    [topicAnatomy._id],
      status: 'approved'
    });

    // ── AGRI Branch ──────────────────────────────────────────
    const topicCrops = await Topic.create({
      title: 'Crop Science',
      description: 'Study of agriculture, soil, and crop yields.',
      branch: 'AGRI', difficulty: 'intermediate', estimatedTimeHours: 30,
      category: 'core', skills: ['Agriculture'], relevanceScore: 70, status: 'relevant'
    });

    await Subject.create({
      title: 'Agricultural Engineering',
      description: 'Modern farming techniques and technology.',
      branch: 'AGRI',
      approvedTopics: [topicCrops._id],
      draftTopics:    [topicCrops._id],
      status: 'approved'
    });

    // ── Industry Trends ──────────────────────────────────────
    await Trend.create([
      { skill: 'AI',             demandScore: 98, growthRate: 30, category: 'Technology'     },
      { skill: 'Data Science',   demandScore: 90, growthRate: 15, category: 'Technology'     },
      { skill: 'Cloud',          demandScore: 88, growthRate: 12, category: 'Infrastructure' },
      { skill: 'React',          demandScore: 95, growthRate:  8, category: 'Web Development'},
      { skill: 'Cybersecurity',  demandScore: 85, growthRate: 20, category: 'Security'       },
      { skill: 'HTML5',          demandScore: 80, growthRate:  5, category: 'Web Development'},
      { skill: 'Async/Await',    demandScore: 85, growthRate: 10, category: 'Web Development'},
    ]);

    // ── Quizzes (auto-generated for all defined topics) ──────
    console.log('📝 Seeding Quizzes...');

    // Only use topics that are defined above — no undefined references
    const allTopics = [topicHtml, topicReact, topicNode, topicSignals, topicPower, topicAnatomy, topicCrops];

    const sampleQuizzes = allTopics.map(topic => {
      const t = topic.title;
      return {
        title: `${t} Assessment`,
        topicId: topic._id,
        questions: [
          // Easy (7)
          { questionText: `What is ${t}?`,                              type: 'mcq', options: ['A technology', 'A fruit', 'A planet', 'A car'],                              correctAnswer: 'A technology',               difficulty: 'easy'   },
          { questionText: `What is the primary purpose of ${t}?`,      type: 'mcq', options: ['Core Logic', 'Styling', 'Hardware', 'Networking'],                           correctAnswer: 'Core Logic',                 difficulty: 'easy'   },
          { questionText: `Is ${t} useful for modern development?`,     type: 'mcq', options: ['Yes', 'No', 'Only for older apps', 'It is obsolete'],                       correctAnswer: 'Yes',                        difficulty: 'easy'   },
          { questionText: `Which of the following describes ${t}?`,    type: 'mcq', options: ['Tool', 'Database', 'Browser', 'OS'],                                         correctAnswer: 'Tool',                       difficulty: 'easy'   },
          { questionText: `Can ${t} run on multiple platforms?`,       type: 'mcq', options: ['Yes', 'No', 'Mac only', 'Linux only'],                                       correctAnswer: 'Yes',                        difficulty: 'easy'   },
          { questionText: `What type of problems does ${t} solve?`,    type: 'mcq', options: ['Software', 'Hardware', 'Mechanics', 'Biology'],                              correctAnswer: 'Software',                   difficulty: 'easy'   },
          { questionText: `Who uses ${t}?`,                            type: 'mcq', options: ['Developers', 'Chefs', 'Pilots', 'Doctors'],                                  correctAnswer: 'Developers',                 difficulty: 'easy'   },
          // Medium (6)
          { questionText: `In ${t}, what does scalability refer to?`,  type: 'mcq', options: ['Handling more workload', 'Shrinking file size', 'Hiring devs', 'Printing'], correctAnswer: 'Handling more workload',      difficulty: 'medium' },
          { questionText: `What is a common use case for ${t}?`,       type: 'mcq', options: ['Building applications', 'Cooking', 'Driving', 'Farming'],                   correctAnswer: 'Building applications',      difficulty: 'medium' },
          { questionText: `How does ${t} improve efficiency?`,         type: 'mcq', options: ['By automating tasks', 'By slowing code', 'By using more RAM', 'By input'],  correctAnswer: 'By automating tasks',        difficulty: 'medium' },
          { questionText: `What is a key feature of ${t}?`,            type: 'mcq', options: ['Platform independence', 'Costs $1000', 'Requires discs', 'Needs 3D glass'], correctAnswer: 'Platform independence',      difficulty: 'medium' },
          { questionText: `What happens when ${t} crashes?`,           type: 'mcq', options: ['Throws an error', 'Explodes', 'Prints paper', 'Nothing'],                   correctAnswer: 'Throws an error',            difficulty: 'medium' },
          { questionText: `How is ${t} typically installed?`,          type: 'mcq', options: ['Package manager', 'Floppy disk', 'Mail delivery', 'Hammer'],                correctAnswer: 'Package manager',            difficulty: 'medium' },
          // Hard (5)
          { questionText: `Time complexity of ${t}'s core algorithm?`, type: 'mcq', options: ['O(n)', 'O(1)', 'O(n^2)', 'Depends on implementation'],                      correctAnswer: 'Depends on implementation',  difficulty: 'hard'   },
          { questionText: `How does ${t} handle memory management?`,   type: 'mcq', options: ['Garbage collection or manual', 'Ignores memory', 'External drives', 'RAM only'], correctAnswer: 'Garbage collection or manual', difficulty: 'hard' },
          { questionText: `What design pattern is used with ${t}?`,    type: 'mcq', options: ['MVC or similar', 'No pattern', 'Random', 'Chaos'],                          correctAnswer: 'MVC or similar',             difficulty: 'hard'   },
          { questionText: `How to optimize ${t} for concurrency?`,     type: 'mcq', options: ['Async handling or pooling', 'Add sleep()', 'Remove vars', 'Use short names'], correctAnswer: 'Async handling or pooling', difficulty: 'hard'  },
          { questionText: `How to secure a production ${t} deploy?`,   type: 'mcq', options: ['Env vars and proper auth', 'Publish passwords', 'Open ports', 'HTTP only'], correctAnswer: 'Env vars and proper auth',   difficulty: 'hard'   },
        ]
      };
    });

    const createdQuizzes = await Quiz.insertMany(sampleQuizzes);

    // ── Mock Quiz Attempts ───────────────────────────────────
    console.log('📊 Seeding Mock Quiz Attempts...');

    const htmlQuiz  = createdQuizzes.find(q => q.topicId.equals(topicHtml._id));
    const reactQuiz = createdQuizzes.find(q => q.topicId.equals(topicReact._id));

    const mockAttempts = [];

    for (let i = 0; i < 5; i++) {
      const hashedPw = await bcrypt.hash('123456', salt);
      const student = await User.create({
        name: `Test Student ${i}`,
        email: `student${i}@college.edu`,
        password: hashedPw, // properly hashed — login will work
        role: 'student'
      });

      // Struggling with legacy HTML
      if (htmlQuiz) {
        mockAttempts.push({
          userId: student._id, quizId: htmlQuiz._id, topicId: htmlQuiz.topicId,
          score: 0, totalQuestions: 2, answers: [],
          totalTimeTakenSeconds: 120, performanceTag: 'poor'
        });
      }

      // Doing well in React
      if (reactQuiz) {
        mockAttempts.push({
          userId: student._id, quizId: reactQuiz._id, topicId: reactQuiz.topicId,
          score: 2, totalQuestions: 2, answers: [],
          totalTimeTakenSeconds: 45, performanceTag: 'excellent'
        });
      }
    }

    if (mockAttempts.length > 0) {
      await QuizAttempt.insertMany(mockAttempts);
    }

    console.log('✅ Database seeded successfully.');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error; // Re-throw so server.js catch block can handle/log it
  }
};

export default seedDatabase;
