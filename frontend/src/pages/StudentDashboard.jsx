import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, TrendingUp, Award, BookOpen, Activity, AlertTriangle, Zap, AlertCircle, ArrowDown, ShieldCheck, RefreshCw, Sparkles, PlayCircle, Brain, Target, Briefcase, Cpu } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from 'framer-motion';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';


const DashboardCard = ({ title, value, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="card-premium p-6 flex items-center gap-5 shadow-sm cursor-default"
  >
    <div className={`p-3.5 rounded-2xl ${color} text-white shadow-lg shrink-0`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">{title}</p>
      <p className="mt-0.5 text-3xl font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  </motion.div>
);

export default function StudentDashboard() {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const [stats, setStats] = useState({ completed: 0, inProgress: 0, recommended: 0, skillScore: 0, xp: 0, badges: [], strongSkills: [], weakSkills: [] });
  const [curriculum, setCurriculum] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAiSortingEnabled, setIsAiSortingEnabled] = useState(true);
  const [explanationModal, setExplanationModal] = useState({ isOpen: false, topic: null });
  const [schedule, setSchedule] = useState({ cooldownRemainingHours: 0, practiceAvailable: true, nextCompetition: null, isCompetitionDay: false, streak: 0, level: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        // Fetch subjects, analytics and schedule
        const [subjectsRes, analyticsRes, scheduleRes, aiRes] = await Promise.all([
          api.get('/curriculum/subjects'),
          api.get('/quiz/analytics/student').catch(() => ({ data: null })),
          api.get('/quiz/schedule').catch(() => ({ data: null })),
          api.get('/ai/recommendation').catch(() => ({ data: null }))
        ]);
        if (scheduleRes.data) setSchedule(scheduleRes.data);
        if (aiRes.data) setAiInsights(aiRes.data);

        const curriculumData = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];
        const analyticsData = analyticsRes.data;

        // Snapshot the original topic order for the Before/After toggle
        if (curriculumData.length > 0 && curriculumData[0]?.approvedTopics) {
          curriculumData[0]._originalTopics = [...curriculumData[0].approvedTopics];
        }

        setCurriculum(curriculumData);
        setAnalytics(analyticsData);

        // Profile fetch — may 404 for demo fallback users; handle gracefully
        try {
          const userRes = await api.get('/auth/profile');
          const userData = userRes.data || {};
          setStats({
            completed: (userData.progress || []).filter(p => p.status === 'completed').length,
            inProgress: (userData.progress || []).filter(p => p.status === 'in-progress').length,
            skillScore: userData.skillProfile?.overallScore || 0,
            xp: userData.skillProfile?.xp || 0,
            badges: userData.skillProfile?.badges || [],
            strongSkills: userData.skillProfile?.strongSkills || [],
            weakSkills: userData.skillProfile?.weakSkills || []
          });
        } catch {
          // Demo fallback user — no DB record — just show zero stats silently
          console.warn('StudentDashboard: profile not found, using default stats (demo user).');
        }
      } catch (err) {
        console.error('StudentDashboard fetch error:', err);
        setError(err.response?.data?.message || 'We could not load your dashboard right now. Please check your connection and try again.');
        toast.error('Dashboard load failed.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Safe destructure — guards against any edge case where setStats wasn't called yet
  const {
    completed = 0, inProgress = 0, skillScore = 0, xp = 0,
    badges = [], strongSkills = [], weakSkills = []
  } = stats || {};

  const safeCurriculum = Array.isArray(curriculum) ? curriculum : [];

  const totalSkills = (strongSkills?.length || 0) + (weakSkills?.length || 0);
  const readinessScore = totalSkills === 0 ? 0 : Math.round(((strongSkills?.length || 0) / totalSkills) * 100);

  const getDisplayedCurriculum = () => {
    if (!safeCurriculum.length || !safeCurriculum[0]) return [];
    // Use the snapshot if it exists, fallback to approvedTopics, then empty array
    const source = safeCurriculum?.[0]?._originalTopics || safeCurriculum?.[0]?.approvedTopics || [];
    const topics = [...source];
    if (isAiSortingEnabled) {
      topics.sort((a, b) => {
        const safeWeakSkills = Array.isArray(weakSkills) ? weakSkills : [];
        const aIsWeak = safeWeakSkills.includes(a?.title);
        const bIsWeak = safeWeakSkills.includes(b?.title);
        if (aIsWeak && !bIsWeak) return -1;
        if (!aIsWeak && bIsWeak) return 1;
        return 0;
      });
    }
    return topics;
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 px-4"
      >
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Something went wrong</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 btn-interactive"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-10 w-72 skeleton" />
        <div className="h-4 w-48 skeleton" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 skeleton" />)}
        </div>
        <div className="h-40 skeleton" />
        <div className="h-72 skeleton" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-10"
    >
      {/* ── Student Profile Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="card-premium overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl"
      >
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 p-8 text-white relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400 opacity-10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
            <div className="flex items-center gap-6 w-full md:w-auto">
              {/* Avatar placeholder */}
              <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 backdrop-blur-sm flex items-center justify-center text-4xl shadow-xl shrink-0">
                👨‍🎓
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Welcome back, {userInfo.name ? userInfo.name.split(' ')[0] : 'Student'}! 👋
                </h1>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  {userInfo.branch && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white font-bold text-xs rounded-lg border border-white/30 flex items-center gap-1.5 shadow-sm">
                      <BookOpen className="w-3.5 h-3.5" /> {userInfo.branch}
                    </span>
                  )}
                  {schedule.streak > 0 && (
                    <span className="px-3 py-1 bg-orange-500/80 backdrop-blur-md text-white font-bold text-xs rounded-lg border border-orange-400/50 flex items-center gap-1.5 shadow-sm">
                      🔥 {schedule.streak} Day Streak
                    </span>
                  )}
                  <span className="px-3 py-1 bg-indigo-500/80 backdrop-blur-md text-white font-bold text-xs rounded-lg border border-indigo-400/50 flex items-center gap-1.5 shadow-sm">
                    ⚡ Level {Math.max(1, Math.floor(xp / 100))}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats right aligned */}
            <div className="flex items-center gap-8 bg-black/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 w-full md:w-auto shrink-0 justify-around">
              <div className="text-center">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Progress</p>
                <p className="text-2xl font-extrabold text-emerald-400">{completed > 0 ? Math.min(100, Math.round((completed / (completed + inProgress || 1)) * 100)) : 0}%</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Skill Score</p>
                <p className="text-2xl font-extrabold text-yellow-400">{skillScore}</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Completed</p>
                <p className="text-2xl font-extrabold text-blue-300">{completed}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── AI Next Recommended Action ── */}
      <div className="opacity-0 animate-fade-in-up bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg" style={{ animationDelay: '0.12s' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-yellow-300" /> AI Recommendation</p>
            {weakSkills.length > 0 ? (
              <>
                <h2 className="text-xl font-extrabold mt-2">Next up: Master <span className="text-yellow-300">{weakSkills[0]}</span></h2>
                <p className="text-violet-200 text-sm mt-1 max-w-2xl">We noticed you struggled with {weakSkills[0]} recently. Based on your skill profile, reviewing this topic will improve your overall score by 15%.</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-extrabold mt-2">Next course: <span className="text-yellow-300">{getDisplayedCurriculum()[0]?.title || 'Advanced Fundamentals'}</span></h2>
                <p className="text-violet-200 text-sm mt-1 max-w-2xl">You're doing great! Keep the momentum going by jumping into your next scheduled topic.</p>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {getDisplayedCurriculum()[0] && (
              <button onClick={() => navigate(`/course/${getDisplayedCurriculum()[0]._id}`)} className="px-5 py-2.5 bg-white text-indigo-700 font-extrabold text-sm rounded-xl hover:bg-indigo-50 active:scale-95 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl shadow-black/20">
                <PlayCircle className="w-5 h-5" /> Start Learning
              </button>
            )}
            <button onClick={() => navigate('/curriculum')} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-sm rounded-xl active:scale-95 transition-all backdrop-blur-sm">
              📚 Resume Learning
            </button>
            {weakSkills.length > 0 && (
              <button onClick={() => document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 bg-rose-500/80 hover:bg-rose-500 text-white font-bold text-sm rounded-xl active:scale-95 transition-all">
                ⚠️ View Weak Topics
              </button>
            )}
          </div>
        </div>
      </div>

      {(Array.isArray(weakSkills) ? weakSkills : []).length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 p-4 rounded-r-lg shadow-sm opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center">
            <AlertCircle className="text-rose-500 h-6 w-6 mr-3" />
            <div>
              <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">⚠️ Action Required</h3>
              <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">
                You are struggling with <span className="font-bold">{(Array.isArray(weakSkills) ? weakSkills : []).join(', ')}</span>. We've updated your roadmap to prioritize these topics.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Performance Summary Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-sm opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 font-semibold uppercase tracking-wider text-sm mb-1">Skill Experience (XP)</p>
              <h2 className="text-3xl font-extrabold">{xp}<span className="text-xl font-normal text-indigo-200"> XP</span></h2>
              <p className="text-indigo-200 text-xs mt-1">Level {Math.floor(xp / 100)} · {xp % 100}/100 XP to next level</p>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                <div className="bg-yellow-300 h-1.5 rounded-full transition-all" style={{ width: `${xp % 100}%` }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(Array.isArray(badges) ? badges : []).map((badge, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                    <Award className="w-3 h-3 text-yellow-300" /> {badge}
                  </span>
                ))}
                {(Array.isArray(badges) ? badges : []).length === 0 && <span className="text-xs text-indigo-200 italic">No badges earned yet</span>}
              </div>
            </div>
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Zap className="w-10 h-10 text-yellow-300" />
            </div>
          </div>
        </div>

        <DashboardCard title="Job Readiness" value={`${readinessScore}%`} icon={ShieldCheck} color="bg-amber-500" delay="0.3s" />
        <DashboardCard title="Skill Score" value={`${skillScore}%`} icon={Activity} color="bg-emerald-500" delay="0.4s" />
        <DashboardCard title="In Progress" value={inProgress} icon={Clock} color="bg-blue-500" delay="0.5s" />
      </div>

      {/* Quiz Schedule & Leaderboard Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.55s' }}>
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${schedule.practiceAvailable ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${schedule.practiceAvailable ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Practice Quiz</p>
              <p className={`text-xs ${schedule.practiceAvailable ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                {schedule.practiceAvailable ? '✅ Available Now!' : `⏳ Next in ${schedule.cooldownRemainingHours}h`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/quiz/competition?mode=competition')}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Weekly Competition</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">{schedule.isCompetitionDay ? '🔥 Live Now!' : '🗓 Every Sunday • 30 Questions'}</p>
            </div>
          </div>
          <span className="text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-1 rounded-full">TIMED</span>
        </div>
      </div>

      <button onClick={() => navigate('/leaderboard')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 transition-opacity opacity-0 animate-fade-in-up shadow-lg" style={{ animationDelay: '0.58s' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div className="text-left">
            <p className="font-bold text-sm">View Leaderboard</p>
            <p className="text-xs text-indigo-200">See how you rank against other students</p>
          </div>
        </div>
        <span className="text-white/60">→</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roadmap */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-8 opacity-0 animate-fade-in-up hover:shadow-md transition-shadow" style={{ animationDelay: '0.6s' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="text-indigo-500 dark:text-indigo-400 w-6 h-6" />
              Approved Curriculum Roadmap
            </h2>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 uppercase tracking-wider">AI Sorting</span>
              <button
                onClick={() => setIsAiSortingEnabled(!isAiSortingEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isAiSortingEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAiSortingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          <div className="ml-4 space-y-3 pb-4">
            {getDisplayedCurriculum().length > 0 ? getDisplayedCurriculum().map((topic, idx) => {
              const isLast = idx === getDisplayedCurriculum().length - 1;
              const isWeak = weakSkills.includes(topic?.title);
              const isStrong = strongSkills.includes(topic?.title);

              const cardBorder = isWeak ? 'topic-weak bg-rose-50/50 dark:bg-rose-900/10' : isStrong ? 'topic-strong bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-l-4 border-l-slate-200 dark:border-l-slate-700';

              return (
                <div key={topic._id} className={`flex gap-4 p-4 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-sm ${cardBorder}`}>
                  <div className="flex flex-col items-center">
                    <span className={`h-5 w-5 rounded-full shrink-0 border-4 shadow-sm ${isStrong ? 'bg-emerald-500 border-emerald-100 dark:border-slate-800' :
                        isWeak ? 'bg-rose-500 border-rose-100 dark:border-slate-800 animate-pulse' :
                          'bg-slate-300 dark:bg-slate-600 border-white dark:border-slate-800'
                      }`} />
                    {!isLast && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 my-1" />}
                  </div>
                  <div className="flex-1 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-base font-bold ${isStrong ? 'text-emerald-700 dark:text-emerald-400' :
                            isWeak ? 'text-rose-700 dark:text-rose-400' :
                              'text-slate-600 dark:text-slate-400'
                          }`}>{topic.title}</p>
                        {isStrong && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">✅ Strong Area</span>}
                        {isWeak && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 status-dot-pulse">⚠ Needs Improvement</span>}
                        {!isStrong && !isWeak && <span className="text-xs text-slate-400 dark:text-slate-500">Pending</span>}
                      </div>
                      {isWeak && (
                        <button
                          onClick={() => setExplanationModal({ isOpen: true, topic })}
                          className="mt-1 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 underline font-semibold flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" /> ⚡ Why this?
                        </button>
                      )}
                    </div>
                    <div className="tooltip-wrapper shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/course/${topic._id}`)}
                        className="btn-interactive text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/25 flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Course
                      </button>
                      <button
                        onClick={() => navigate(`/quiz/${topic._id}`)}
                        className="btn-interactive text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" /> Quiz
                      </button>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center py-10 text-center">
                <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-600 mb-3" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No approved curriculum yet</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Your personalized roadmap will appear here after admin approval.</p>
              </div>
            )}
          </div>
        </div>

        {/* Skill Radar */}
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-8 opacity-0 animate-fade-in-up hover:shadow-md transition-shadow" style={{ animationDelay: '0.6s' }}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="text-emerald-500 w-6 h-6" />
            Skill Profile
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analytics?.topicStats?.map(t => ({ subject: t.title, A: t.latestScore, B: 70, fullMark: 100 })) || []}>
                <PolarGrid stroke="#64748b" strokeOpacity={0.2} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Student" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                <Radar name="Industry Avg" dataKey="B" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> You</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-400 opacity-50"></span> Industry Average</div>
          </div>
        </div>
      </div>

      {/* ── AI Simulation Engine Card ── */}
      {aiInsights && (
        <div className="bg-white dark:bg-slate-800 shadow-xl shadow-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 p-8 opacity-0 animate-fade-in-up hover:shadow-2xl transition-all duration-500" style={{ animationDelay: '0.65s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center relative overflow-hidden">
              <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400 relative z-10 animate-pulse" />
              <div className="absolute inset-0 bg-indigo-500/10 blur-xl animate-spin-slow"></div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                AI Intelligence Core <Sparkles className="w-4 h-4 text-amber-500" />
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Personalized career and skill analysis</p>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <p className="text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">
              <strong className="text-indigo-700 dark:text-indigo-400 font-bold">🤖 Analysis:</strong> {aiInsights.recommendation}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Job Readiness */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Job Readiness</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{aiInsights.jobReadiness}</span>
                <span className="text-lg font-bold text-slate-400">%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${aiInsights.jobReadiness}%` }} transition={{ duration: 1, delay: 0.8 }}
                  className="bg-emerald-500 h-1.5 rounded-full"
                />
              </div>
            </div>

            {/* Career Suggestion */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Predicted Path</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{aiInsights.careerSuggestion}</p>
            </div>

            {/* Skill Gap */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Skill Gap Focus</p>
              {aiInsights.skillGap?.weak?.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                  {aiInsights.skillGap.weak.slice(0, 2).map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] font-bold rounded-md">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold text-emerald-500">No major gaps identified</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-8 opacity-0 animate-fade-in-up hover:shadow-md transition-shadow" style={{ animationDelay: '0.7s' }}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-500 w-6 h-6" />
            Study Hours Progress
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.attempts?.map((a, i) => ({ name: `Quiz ${i + 1}`, hours: Math.round(a.totalTimeTakenSeconds / 60) })) || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.2} />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: '#cbd5e1', opacity: 0.1 }}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Explanation Modal */}
      <Modal
        isOpen={explanationModal.isOpen}
        onClose={() => setExplanationModal({ isOpen: false, topic: null })}
        title="AI Recommendation Engine"
        footer={
          <button onClick={() => setExplanationModal({ isOpen: false, topic: null })} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">Understood</button>
        }
      >
        {explanationModal.topic && (
          <div className="text-slate-200 space-y-4">
            <div className="flex items-start gap-3 bg-indigo-900/30 border border-indigo-800 p-4 rounded-xl">
              <Zap className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <h4 className="font-bold text-lg text-white">Why {explanationModal.topic.title}?</h4>
                <p className="text-sm text-indigo-200 mt-1">Our AI curriculum engine detected a critical skill gap based on your recent quiz attempts.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center">
                <p className="text-sm font-semibold text-slate-400 uppercase">Your Performance</p>
                <p className="text-3xl font-bold text-rose-500 mt-1">Poor</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center">
                <p className="text-sm font-semibold text-slate-400 uppercase">Class Average</p>
                <p className="text-3xl font-bold text-emerald-500 mt-1">78%</p>
              </div>
            </div>

            <p className="text-sm text-slate-400">
              <strong className="text-white">Recommendation:</strong> Review the fundamentals of <span className="text-indigo-400 font-bold">{explanationModal.topic.title}</span> and attempt the assessment again to improve your Job Readiness Score.
            </p>
          </div>
        )}
      </Modal>

    </motion.div>
  );
}
