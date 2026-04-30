import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Trend from '../models/Trend.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';

// Helper to flag subject as updated if it was previously approved
const handleSubjectModification = async (subject) => {
  if (subject && subject.status === 'approved') {
    subject.status = 'draft';
    subject.isUpdatedAfterApproval = true;
    await subject.save();
  }
};

export const getSubjects = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'teacher') {
      query.createdBy = req.user.id;
    }

    if (req.user.role === 'student') {
      const user = await User.findById(req.user.id);
      if (user && user.branch) {
        query.branch = user.branch;
      }
      
      // ONLY return approvedTopics, NEVER expose draftTopics
      const subjects = await Subject.find(query)
        .populate('approvedTopics')
        .select('-draftTopics -adminFeedback');
      return res.json(subjects);
    }

    const subjects = await Subject.find(query)
      .populate('approvedTopics')
      .populate('draftTopics');
      
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new subject
export const addSubject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const subject = await Subject.create({ 
      title, 
      description,
      status: 'draft',
      approvedTopics: [],
      draftTopics: [],
      createdBy: req.user.id
    });
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a subject
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    
    if (subject.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'admin') {
      await Subject.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Subject deleted' });
    }

    // Teacher Delete Safety
    if (subject.status === 'pending') {
      return res.status(400).json({ message: 'Cannot delete while pending approval' });
    }

    if (subject.approvedTopics && subject.approvedTopics.length > 0) {
      // Live subject: only clear draftTopics
      subject.draftTopics = [];
      subject.status = 'draft';
      await subject.save();
      return res.json({ message: 'Draft topics cleared. Live version unchanged.' });
    } else {
      // Not live: full delete
      await Subject.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Subject completely deleted' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a subject title/description
export const updateSubject = async (req, res) => {
  try {
    const { title, description } = req.body;
    let subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    
    if (subject.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (subject.status === 'pending') {
      return res.status(400).json({ message: 'Cannot update while pending approval' });
    }

    subject.title = title || subject.title;
    if (description !== undefined) subject.description = description;
    await subject.save();
    
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit subject for approval
export const submitSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    
    // Only creator can submit
    if (subject.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    subject.status = 'pending';
    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Review subject (Admin)
export const reviewSubject = async (req, res) => {
  try {
    const { status, adminFeedback } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    if (status === 'approved') {
      // Deep copy to avoid mutation bugs
      // 1. Delete old approved topics to prevent DB bloat
      if (subject.approvedTopics && subject.approvedTopics.length > 0) {
        await Topic.deleteMany({ _id: { $in: subject.approvedTopics } });
      }

      // 2. Clone draft topics
      const newApprovedTopics = [];
      for (const topicId of subject.draftTopics) {
        const topic = await Topic.findById(topicId);
        if (topic) {
          const newTopic = await Topic.create({
            title: topic.title,
            description: topic.description,
            difficulty: topic.difficulty,
            estimatedTimeHours: topic.estimatedTimeHours,
            category: topic.category,
            skills: [...topic.skills],
            relevanceScore: topic.relevanceScore,
            status: topic.status
          });
          newApprovedTopics.push(newTopic._id);
        }
      }

      subject.approvedTopics = newApprovedTopics;
      subject.status = 'approved';
      subject.adminFeedback = ''; // Clear feedback on approval
    } else if (status === 'rejected') {
      subject.status = 'rejected';
      if (adminFeedback !== undefined) subject.adminFeedback = adminFeedback;
    }
    
    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all topics
export const getTopics = async (req, res) => {
  try {
    const topics = await Topic.find();
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a topic
export const addTopic = async (req, res) => {
  try {
    const { title, description, difficulty, estimatedTimeHours, category, skills, relevanceScore, status } = req.body;
    const topic = await Topic.create({
      title, description, difficulty, estimatedTimeHours, category, skills, relevanceScore, status
    });
    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a topic to a specific subject
export const addSubjectTopic = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    
    if (subject.status === 'pending') {
      return res.status(400).json({ message: 'Cannot add topic while pending approval' });
    }

    const { title, description, difficulty, estimatedTimeHours, category, relevanceScore } = req.body;
    const topic = await Topic.create({
      title, description, difficulty, estimatedTimeHours, category, relevanceScore
    });
    
    subject.draftTopics.push(topic._id);
    if (subject.status === 'approved') {
      subject.status = 'draft';
    }
    await subject.save();
    
    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a topic
export const updateTopic = async (req, res) => {
  try {
    const { title, description, difficulty, estimatedTimeHours, relevanceScore } = req.body;
    let topicId = req.params.id;
    let topic = await Topic.findById(topicId);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    // Check if this topic is used in any approvedTopics array
    const subjectWithApproved = await Subject.findOne({ approvedTopics: topicId });
    
    if (subjectWithApproved) {
      // It's live! We must clone the topic to prevent mutating the live version
      topic = await Topic.create({
        title: title || topic.title,
        description: description !== undefined ? description : topic.description,
        difficulty: difficulty || topic.difficulty,
        estimatedTimeHours: estimatedTimeHours || topic.estimatedTimeHours,
        category: topic.category,
        skills: [...topic.skills],
        relevanceScore: relevanceScore !== undefined ? relevanceScore : topic.relevanceScore,
        status: topic.status
      });
      
      // Update draftTopics to point to the new topic in all subjects that had the old topic in their draft
      await Subject.updateMany(
        { draftTopics: topicId },
        { $set: { "draftTopics.$": topic._id, status: 'draft' } }
      );
    } else {
      // Safe to edit in place
      topic.title = title || topic.title;
      if (description !== undefined) topic.description = description;
      if (difficulty) topic.difficulty = difficulty;
      if (estimatedTimeHours) topic.estimatedTimeHours = estimatedTimeHours;
      if (relevanceScore !== undefined) topic.relevanceScore = relevanceScore;
      await topic.save();

      // Flag modification for subject
      await Subject.updateMany(
        { draftTopics: topicId },
        { status: 'draft' }
      );
    }

    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a topic
export const deleteTopic = async (req, res) => {
  try {
    const topicId = req.params.id;
    const topic = await Topic.findById(topicId);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    
    // Check if this topic is used in any approvedTopics array
    const subjectWithApproved = await Subject.findOne({ approvedTopics: topicId });

    if (subjectWithApproved) {
      // It's live! We CANNOT delete the topic entirely. 
      // We just remove it from all draftTopics.
      const subjects = await Subject.find({ draftTopics: topicId });
      for (let subject of subjects) {
        subject.draftTopics.pull(topicId);
        subject.status = 'draft';
        await subject.save();
      }
    } else {
      // Not live anywhere, safe to fully delete
      await Topic.findByIdAndDelete(topicId);
      
      const subjects = await Subject.find({ draftTopics: topicId });
      for (let subject of subjects) {
        subject.draftTopics.pull(topicId);
        subject.status = 'draft';
        await subject.save();
      }
    }
    
    res.json({ message: 'Topic deleted from drafts' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update topic relevance manually
export const updateTopicRelevance = async (req, res) => {
  try {
    const { id } = req.params;
    const { relevanceScore, status } = req.body;
    const topic = await Topic.findByIdAndUpdate(id, { relevanceScore, status }, { new: true });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Industry Trends
export const getTrends = async (req, res) => {
  try {
    const trends = await Trend.find();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dashboard analytics
export const getAnalytics = async (req, res) => {
  try {
    const totalTopics = await Topic.countDocuments();
    const outdatedTopics = await Topic.countDocuments({ status: 'outdated' });
    const relevantTopics = await Topic.countDocuments({ status: 'relevant' });
    const emergingTopics = await Topic.countDocuments({ status: 'emerging' });
    
    // Average relevance score
    const allTopics = await Topic.find();
    const avgRelevance = allTopics.reduce((acc, curr) => acc + curr.relevanceScore, 0) / (totalTopics || 1);

    res.json({
      totalTopics,
      outdatedTopics,
      relevantTopics,
      emergingTopics,
      avgRelevanceScore: avgRelevance.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// AI-Based Curriculum Recommendations (Heuristic for Hackathon MVP)
export const getRecommendations = async (req, res) => {
  try {
    const topics = await Topic.find();
    const trends = await Trend.find();
    const attempts = await QuizAttempt.find();
    const recommendations = [];

    // 0. Analyze Student Performance (Add Alerts)
    const topicStats = {};
    attempts.forEach(att => {
      const tid = att.topicId.toString();
      if (!topicStats[tid]) topicStats[tid] = { count: 0, weakCount: 0 };
      topicStats[tid].count++;
      if (att.performanceTag === 'poor' || att.performanceTag === 'average') topicStats[tid].weakCount++;
    });

    Object.keys(topicStats).forEach(tid => {
      const stats = topicStats[tid];
      const weakPct = (stats.weakCount / stats.count) * 100;
      if (weakPct > 50) {
        const topic = topics.find(t => t._id.toString() === tid);
        if (topic) {
          recommendations.push({
            id: `alert-${tid}`,
            action: 'improve',
            target: topic.title,
            reason: `⚠️ Critical: ${Math.round(weakPct)}% of students are struggling with this topic. Consider adding more foundational resources or simplifying content.`,
            priority: 'High'
          });
        }
      }
    });

    // Extract all current skills from topics
    const currentSkills = new Set();
    topics.forEach(t => t.skills.forEach(s => currentSkills.add(s.toLowerCase())));

    // Pre-defined skill dependencies (mock graph for Hackathon Demo)
    const skillGraph = {
      'react': ['html', 'css', 'js'],
      'node': ['html', 'css', 'js', 'react'],
      'machine learning': ['python', 'statistics'],
      'next.js': ['html', 'css', 'js', 'react'],
      'generative ai': ['machine learning', 'python']
    };

    // 1. Analyze Trends to find Missing Skills (Add) & Prerequisites
    trends.forEach(trend => {
      const skillName = trend.skill.toLowerCase();
      
      if (trend.demandScore >= 75 && !currentSkills.has(skillName)) {
        let roadmap = [];
        let missingPrereqs = [];

        // Check if there are known prerequisites
        if (skillGraph[skillName]) {
          skillGraph[skillName].forEach(prereq => {
            if (!currentSkills.has(prereq)) {
              missingPrereqs.push(prereq);
            }
            roadmap.push(prereq.toUpperCase()); // Format nicely
          });
        }
        roadmap.push(skillName.charAt(0).toUpperCase() + skillName.slice(1)); // Capitalize target

        if (missingPrereqs.length > 0) {
          recommendations.push({
            id: `gap-${trend._id}`,
            action: 'prerequisite_gap',
            target: trend.skill,
            reason: `High demand for ${trend.skill}, but missing foundational skills: ${missingPrereqs.join(', ')}.`,
            priority: 'High',
            roadmap: roadmap
          });
        } else {
          recommendations.push({
            id: `add-${trend._id}`,
            action: 'add',
            target: trend.skill,
            reason: `High industry demand (${trend.demandScore}/100) and ${trend.growthRate}% growth rate, ready to learn.`,
            priority: trend.demandScore > 90 ? 'High' : 'Medium',
            roadmap: roadmap.length > 1 ? roadmap : null
          });
        }
      }
    });

    // 2. Analyze Topics to find Outdated/Low Relevance (Deprecate or Update)
    topics.forEach(topic => {
      const primarySkill = topic.skills[0]?.toLowerCase();
      const relatedTrend = trends.find(t => t.skill.toLowerCase() === primarySkill);

      if (topic.relevanceScore < 40 || topic.status === 'outdated' || (relatedTrend && relatedTrend.demandScore < 30 && relatedTrend.growthRate < 0)) {
        // Suggest replacement if available
        let replacement = '';
        if (primarySkill === 'callbacks') replacement = 'Async/Await';
        if (primarySkill === 'html') replacement = 'HTML5/Semantic Web';
        
        const reasonStr = replacement 
          ? `Skill is outdated (${topic.relevanceScore}/100). Suggest replacing with modern alternative: ${replacement}.`
          : `Relevance score is critically low (${topic.relevanceScore}/100) and industry demand is declining.`;

        recommendations.push({
          id: `deprecate-${topic._id}`,
          action: 'deprecate',
          target: topic.title,
          reason: reasonStr,
          priority: topic.relevanceScore < 20 ? 'High' : 'Medium'
        });
      } else if (relatedTrend && relatedTrend.demandScore > 80 && topic.status !== 'emerging' && topic.status !== 'relevant') {
        recommendations.push({
          id: `update-${topic._id}`,
          action: 'update',
          target: topic.title,
          reason: `Industry demand for ${primarySkill} is high. Content should be refreshed.`,
          priority: 'Medium'
        });
      }
    });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
