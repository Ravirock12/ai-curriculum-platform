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
      console.log('✅ Database already has data. Skipping seed (use reset-db to force re-seed).');
      return;
    }
    if (userCount > 0 && forceReseed) {
      console.log('🔄 Force re-seed requested. Dropping existing data...');
      await mongoose.connection.db.dropDatabase();
    }

    console.log('Seeding initial data...');

    // Users
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    await User.create({ name: 'Admin User', email: 'admin@college.edu', password, role: 'admin' });
    await User.create({ name: 'Teacher User', email: 'teacher@college.edu', password, role: 'teacher' });
    await User.create({ name: 'Student User', email: 'student@college.edu', password, role: 'student' });

    // CSE Branch Topics
    const topicHtml = await Topic.create({
      title: 'HTML 4 Basics', description: 'Learn foundational structure using legacy HTML4.',
      branch: 'CSE', difficulty: 'beginner', estimatedTimeHours: 10, category: 'core', skills: ['HTML'], relevanceScore: 30, status: 'outdated'
    });
    const topicReact = await Topic.create({
      title: 'React.js UI', description: 'Modern component-based UI.',
      branch: 'CSE', difficulty: 'intermediate', estimatedTimeHours: 40, category: 'core', skills: ['React'], relevanceScore: 90, status: 'emerging'
    });
    const topicNode = await Topic.create({
      title: 'Node.js Backend', description: 'Server-side JavaScript.',
      branch: 'CSE', difficulty: 'advanced', estimatedTimeHours: 35, category: 'core', skills: ['Node'], relevanceScore: 85, status: 'emerging'
    });

    await Subject.create({
      title: 'Fullstack Web Development', description: 'End to end web dev.',
      branch: 'CSE', approvedTopics: [topicHtml._id, topicReact._id, topicNode._id], draftTopics: [topicHtml._id, topicReact._id, topicNode._id], status: 'approved'
    });

    // ECE Branch Topics
    const topicSignals = await Topic.create({
      title: 'Digital Signal Processing', description: 'Analyze signals.',
      branch: 'ECE', difficulty: 'advanced', estimatedTimeHours: 30, category: 'core', skills: ['DSP', 'MATLAB'], relevanceScore: 80, status: 'relevant'
    });
    await Subject.create({
      title: 'Core Electronics', description: 'Fundamentals of ECE.',
      branch: 'ECE', approvedTopics: [topicSignals._id], draftTopics: [topicSignals._id], status: 'approved'
    });

    // EEE Branch Topics
    const topicPower = await Topic.create({
      title: 'Power Systems', description: 'Power grid analysis.',
      branch: 'EEE', difficulty: 'advanced', estimatedTimeHours: 35, category: 'core', skills: ['Power Electronics'], relevanceScore: 75, status: 'relevant'
    });
    await Subject.create({
      title: 'Power Engineering', description: 'Core EEE concepts.',
      branch: 'EEE', approvedTopics: [topicPower._id], draftTopics: [topicPower._id], status: 'approved'
    });

    // BIPC Branch Topics
    const topicAnatomy = await Topic.create({
      title: 'Human Anatomy', description: 'Study of the human body.',
      branch: 'BIPC', difficulty: 'intermediate', estimatedTimeHours: 40, category: 'core', skills: ['Biology'], relevanceScore: 85, status: 'relevant'
    });
    await Subject.create({
      title: 'Medical Sciences', description: 'Pre-med curriculum.',
      branch: 'BIPC', approvedTopics: [topicAnatomy._id], draftTopics: [topicAnatomy._id], status: 'approved'
    });

    // AGRI Branch Topics
    const topicCrops = await Topic.create({
      title: 'Crop Science', description: 'Study of agriculture and crop yields.',
      branch: 'AGRI', difficulty: 'intermediate', estimatedTimeHours: 30, category: 'core', skills: ['Agriculture'], relevanceScore: 70, status: 'relevant'
    });
    await Subject.create({
      title: 'Agricultural Engineering', description: 'Modern farming.',
      branch: 'AGRI', approvedTopics: [topicCrops._id], draftTopics: [topicCrops._id], status: 'approved'
    });

    // Industry Trends (AI, Data Science, Cloud, React, Cybersecurity)
    await Trend.create({ skill: 'AI', demandScore: 98, growthRate: 30, category: 'Technology' });
    await Trend.create({ skill: 'Data Science', demandScore: 90, growthRate: 15, category: 'Technology' });
    await Trend.create({ skill: 'Cloud', demandScore: 88, growthRate: 12, category: 'Infrastructure' });
    await Trend.create({ skill: 'React', demandScore: 95, growthRate: 8, category: 'Web Development' });
    await Trend.create({ skill: 'Cybersecurity', demandScore: 85, growthRate: 20, category: 'Security' });
    
    // Replacement specific trend to trigger the engine
    await Trend.create({ skill: 'HTML5', demandScore: 80, growthRate: 5, category: 'Web Development' });
    await Trend.create({ skill: 'Async/Await', demandScore: 85, growthRate: 10, category: 'Web Development' });

    console.log('Seeding Quizzes...');
    const allTopics = [topicHtml, topicCss, topicJs, topicReact, topicNode, topicLegacyNode];
    const sampleQuizzes = allTopics.map(topic => {
      const t = topic.title;
      return {
        title: `${topic.title} Assessment`,
        topicId: topic._id,
        questions: [
          // Easy
          { questionText: `What is ${t}?`, type: 'mcq', options: ['A technology', 'A fruit', 'A planet', 'A car'], correctAnswer: 'A technology', difficulty: 'easy' },
          { questionText: `What is the primary purpose of ${t}?`, type: 'mcq', options: ['Core Logic', 'Styling', 'Hardware', 'Networking'], correctAnswer: 'Core Logic', difficulty: 'easy' },
          { questionText: `Is ${t} useful for modern development?`, type: 'mcq', options: ['Yes', 'No', 'Only for older apps', 'It is obsolete'], correctAnswer: 'Yes', difficulty: 'easy' },
          { questionText: `Which of the following describes ${t}?`, type: 'mcq', options: ['Tool', 'Database', 'Browser', 'OS'], correctAnswer: 'Tool', difficulty: 'easy' },
          { questionText: `Can ${t} run on multiple platforms?`, type: 'mcq', options: ['Yes', 'No', 'Mac only', 'Linux only'], correctAnswer: 'Yes', difficulty: 'easy' },
          { questionText: `What type of problems does ${t} solve?`, type: 'mcq', options: ['Software', 'Hardware', 'Mechanics', 'Biology'], correctAnswer: 'Software', difficulty: 'easy' },
          { questionText: `Who uses ${t}?`, type: 'mcq', options: ['Developers', 'Chefs', 'Pilots', 'Doctors'], correctAnswer: 'Developers', difficulty: 'easy' },
          
          // Medium
          { questionText: `In the context of ${t}, what does scalability refer to?`, type: 'mcq', options: ['Handling more workload', 'Shrinking file size', 'Hiring developers', 'Printing documents'], correctAnswer: 'Handling more workload', difficulty: 'medium' },
          { questionText: `What is a common use case for ${t}?`, type: 'mcq', options: ['Building applications', 'Cooking', 'Driving', 'Farming'], correctAnswer: 'Building applications', difficulty: 'medium' },
          { questionText: `How does ${t} improve efficiency?`, type: 'mcq', options: ['By automating tasks', 'By slowing code', 'By increasing memory', 'By requiring input'], correctAnswer: 'By automating tasks', difficulty: 'medium' },
          { questionText: `What is a key feature of ${t}?`, type: 'mcq', options: ['Platform independence', 'It costs $1000', 'Requires discs', 'Requires 3D glasses'], correctAnswer: 'Platform independence', difficulty: 'medium' },
          { questionText: `What happens when ${t} crashes?`, type: 'mcq', options: ['Throws an error', 'Explodes', 'Prints paper', 'Nothing'], correctAnswer: 'Throws an error', difficulty: 'medium' },
          { questionText: `How is ${t} typically installed?`, type: 'mcq', options: ['Package manager', 'Floppy disk', 'Mail delivery', 'Hammer'], correctAnswer: 'Package manager', difficulty: 'medium' },
          
          // Hard
          { questionText: `What is the time complexity of the core algorithm in ${t}?`, type: 'mcq', options: ['O(n)', 'O(1)', 'O(n^2)', 'Depends on implementation'], correctAnswer: 'Depends on implementation', difficulty: 'hard' },
          { questionText: `How does ${t} handle memory management?`, type: 'mcq', options: ['Garbage collection or manual', 'Ignores memory', 'Uses external drives', 'Only RAM'], correctAnswer: 'Garbage collection or manual', difficulty: 'hard' },
          { questionText: `What design pattern is most used with ${t}?`, type: 'mcq', options: ['MVC or similar', 'No pattern', 'Random', 'Chaos'], correctAnswer: 'MVC or similar', difficulty: 'hard' },
          { questionText: `How do you optimize ${t} for high concurrency?`, type: 'mcq', options: ['Async handling or pooling', 'Add sleep()', 'Remove variables', 'Use short names'], correctAnswer: 'Async handling or pooling', difficulty: 'hard' },
          { questionText: `How do you secure a production deployment of ${t}?`, type: 'mcq', options: ['Environment variables and proper auth', 'Publish passwords', 'Leave ports open', 'Use HTTP only'], correctAnswer: 'Environment variables and proper auth', difficulty: 'hard' }
        ]
      };
    });
    const createdQuizzes = await Quiz.insertMany(sampleQuizzes);

    console.log('Seeding Mock Quiz Attempts...');
    // Create failing attempt for Legacy Node to trigger alert
    const legacyQuiz = createdQuizzes.find(q => q.topicId.equals(topicLegacyNode._id));
    const jsQuiz = createdQuizzes.find(q => q.topicId.equals(topicJs._id));
    
    const mockAttempts = [];
    
    // Simulate 5 students struggling with Legacy Node
    for (let i = 0; i < 5; i++) {
      const student = await User.create({ name: `Test Student ${i}`, email: `student${i}@college.edu`, password: '123', role: 'student' });
      mockAttempts.push({
        userId: student._id,
        quizId: legacyQuiz._id,
        topicId: legacyQuiz.topicId,
        score: 0,
        totalQuestions: 2,
        answers: [],
        totalTimeTakenSeconds: 120,
        performanceTag: 'poor'
      });
      
      // Some students doing well in JS
      mockAttempts.push({
        userId: student._id,
        quizId: jsQuiz._id,
        topicId: jsQuiz.topicId,
        score: 2,
        totalQuestions: 2,
        answers: [],
        totalTimeTakenSeconds: 45,
        performanceTag: 'excellent'
      });
    }
    
    await QuizAttempt.insertMany(mockAttempts);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

export default seedDatabase;
