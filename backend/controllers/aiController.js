import User from '../models/User.js';

/**
 * @desc    Simulate AI recommendations based on user's skill profile
 * @route   GET /api/ai/recommendation
 * @access  Private (Student)
 */
export const getAiRecommendation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { skillProfile, branch, progress } = user;
    const { strongSkills = [], weakSkills = [], overallScore = 0, xp = 0 } = skillProfile || {};

    // 1. Calculate Job Readiness %
    // Based on overall score and a minimum XP threshold.
    let jobReadiness = Math.min(100, Math.max(0, Math.round((overallScore * 0.7) + (xp / 100))));
    
    // 2. Determine Career Suggestion
    let careerSuggestion = 'Junior Developer';
    if (branch === 'CSE') {
      if (strongSkills.some(s => s.toLowerCase().includes('react') || s.toLowerCase().includes('frontend'))) {
        careerSuggestion = 'Frontend Engineer';
      } else if (strongSkills.some(s => s.toLowerCase().includes('node') || s.toLowerCase().includes('backend'))) {
        careerSuggestion = 'Backend Engineer';
      } else {
        careerSuggestion = 'Full-Stack Developer';
      }
    } else if (branch === 'ECE' || branch === 'EEE') {
      careerSuggestion = 'Embedded Systems Engineer';
    } else if (branch === 'BIPC' || branch === 'AGRI') {
      careerSuggestion = 'Bioinformatics Specialist';
    }

    // 3. Generate Dynamic Recommendation
    let recommendation = '';
    if (weakSkills.length > 0) {
      recommendation = `Focus on improving your skills in ${weakSkills.slice(0, 2).join(' and ')}. Our analysis shows this will boost your job readiness by at least 15%.`;
    } else if (overallScore > 80) {
      recommendation = `Excellent progress! You are highly proficient. Consider taking advanced mock interviews to prepare for ${careerSuggestion} roles.`;
    } else {
      recommendation = `Keep practicing! Completing more curriculum modules will help you master core concepts for a ${careerSuggestion} career.`;
    }

    // 4. Return Simulated AI Payload
    // Note: The global response wrapper in server.js will wrap this in { success: true, data: { ... } }
    res.json({
      recommendation,
      skillGap: {
        strong: strongSkills,
        weak: weakSkills
      },
      careerSuggestion,
      jobReadiness
    });

  } catch (error) {
    console.error('AI Recommendation Error:', error);
    res.status(500).json({ success: false, message: 'Server error processing AI recommendation' });
  }
};
