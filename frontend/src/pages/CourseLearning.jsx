import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PlayCircle, CheckCircle, BookOpen, Clock, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const MOCK_LESSONS = [
  { id: 1, title: 'Introduction & Overview', duration: '5:30', completed: true },
  { id: 2, title: 'Core Concepts Deep Dive', duration: '12:45', completed: false },
  { id: 3, title: 'Practical Examples', duration: '18:20', completed: false },
  { id: 4, title: 'Common Pitfalls', duration: '8:15', completed: false },
  { id: 5, title: 'Final Assessment Prep', duration: '10:00', completed: false },
];

export default function CourseLearning() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeLesson, setActiveLesson] = useState(2); // Mocking that they are on lesson 2

  useEffect(() => {
    const fetchTopicDetails = async () => {
      try {
        // Try to find the topic from the overall subjects list
        const { data } = await api.get('/curriculum/subjects');
        let foundTopic = null;
        if (Array.isArray(data)) {
          for (const subject of data) {
            const topics = subject.approvedTopics || subject.draftTopics || [];
            const match = topics.find(t => t._id === topicId);
            if (match) {
              foundTopic = match;
              break;
            }
          }
        }
        
        if (foundTopic) {
          setTopic(foundTopic);
        } else {
          // Fallback if not found
          setTopic({ title: 'Advanced React Patterns', description: 'Mastering modern React development with advanced design patterns.', estimatedTimeHours: 2 });
        }
      } catch (err) {
        setTopic({ title: 'Advanced Course', description: 'Learning module for your curriculum.', estimatedTimeHours: 2 });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopicDetails();
  }, [topicId]);

  const handleMarkCompleted = () => {
    setIsCompleted(true);
    toast.success(`🎉 You completed ${topic?.title}! +50 XP`);
    // After 2 seconds, redirect back to dashboard
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto pb-12"
    >
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Curriculum
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Video Section */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="card-premium overflow-hidden shadow-xl border-slate-200 dark:border-slate-700/50"
          >
            {/* Video Player Placeholder (YouTube Embed) */}
            <div className="aspect-video bg-slate-900 relative">
              <iframe 
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0" // Replace with actual educational video ID if preferred
                title="Course Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  Module 1
                </span>
                <span className="flex items-center gap-1 text-slate-500 text-sm font-medium">
                  <Clock className="w-4 h-4" /> {topic?.estimatedTimeHours || 1}h estimated
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{topic?.title}</h1>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                {topic?.description || 'Learn the fundamental concepts and practical applications of this topic. This module includes video lectures, reading materials, and interactive quizzes.'}
              </p>
              
              <div className="flex justify-end">
                <button 
                  onClick={handleMarkCompleted}
                  disabled={isCompleted}
                  className={`btn-interactive flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                    isCompleted 
                      ? 'bg-emerald-500 shadow-emerald-500/25 cursor-default' 
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25'
                  }`}
                >
                  {isCompleted ? (
                    <><CheckCircle className="w-5 h-5" /> Completed</>
                  ) : (
                    <><Award className="w-5 h-5" /> Mark as Completed</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar - Lessons List */}
        <div className="space-y-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="card-premium p-6 shadow-lg border-slate-200 dark:border-slate-700/50"
          >
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Course Content</h2>
            </div>
            
            <div className="space-y-3">
              {MOCK_LESSONS.map((lesson, idx) => (
                <div 
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    activeLesson === lesson.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                    lesson.completed 
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : activeLesson === lesson.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  }`}>
                    {lesson.completed ? <CheckCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4 ml-0.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      activeLesson === lesson.id ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {lesson.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{lesson.duration}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="text-slate-700 dark:text-slate-300">Your Progress</span>
                <span className="text-indigo-600 dark:text-indigo-400">20%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
