import { useState, useEffect } from 'react';
import { BookOpen, Users, FileUp, AlertCircle, BarChart2, CheckCircle2, Clock, XCircle, FileText, TrendingUp, Brain, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';

// Removed hardcoded engagementData

const performanceTrends = [
  { week: 'Week 1', score: 65, engagement: 70 },
  { week: 'Week 2', score: 72, engagement: 75 },
  { week: 'Week 3', score: 68, engagement: 60 },
  { week: 'Week 4', score: 82, engagement: 90 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white p-3 rounded-xl shadow-xl border border-slate-700">
        <p className="font-semibold text-sm mb-1">{label || payload[0].name}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardCard = ({ title, value, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className="card-premium p-6 flex items-center gap-5 shadow-sm"
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

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'approved':
      return <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
    case 'pending':
      return <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    case 'rejected':
      return <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"><AlertCircle className="w-3.5 h-3.5" /> Rejected</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"><FileText className="w-3.5 h-3.5" /> Draft</span>;
  }
};

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [curricula, setCurricula] = useState([]);
  const [classAnalytics, setClassAnalytics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [submittingIds, setSubmittingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const fetchCurricula = async () => {
    try {
      const { data } = await api.get('/curriculum/subjects');
      setCurricula(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('fetchCurricula failed silently:', err?.message);
      setCurricula([]);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, analyticsRes, recommendationsRes] = await Promise.all([
          api.get('/curriculum/analytics').catch(() => ({ data: null })),
          api.get('/quiz/analytics/class').catch(() => ({ data: [] })),
          api.get('/curriculum/recommendations').catch(() => ({ data: [] }))
        ]);
        setStats(statsRes.data || null);
        setClassAnalytics(Array.isArray(analyticsRes.data) ? analyticsRes.data : []);
        setRecommendations(Array.isArray(recommendationsRes.data) ? recommendationsRes.data : []);
      } catch (error) {
        console.error('TeacherDashboard fetch error:', error);
        toast.error('Something went wrong loading your dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    fetchCurricula();
  }, []);

  const handleSubmitApproval = async (id, cur) => {
    if (!cur.draftTopics || cur.draftTopics.length === 0) {
      toast.error('Cannot submit: Curriculum must have at least one topic.');
      return;
    }
    
    setSubmittingIds(prev => new Set(prev).add(id));
    try {
      await api.put(`/curriculum/subjects/${id}/submit`);
      toast.success('🚀 Curriculum sent for admin review. You will be notified once approved.');
      fetchCurricula();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit curriculum.');
    } finally {
      setSubmittingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/curriculum/subjects/${id}`);
      toast.success('Curriculum deleted.');
      fetchCurricula();
    } catch (err) {
      toast.error('Failed to delete.');
    }
  };

  const handleCreateDraft = () => {
    setIsDraftModalOpen(true);
    setDraftTitle('');
  };

  const handleCreateDraftSubmit = async (e) => {
    e.preventDefault();
    if (!draftTitle.trim()) return;
    try {
      await api.post('/curriculum/subjects', { title: draftTitle, description: 'New Subject Draft created from dashboard.' });
      toast.success('Draft created successfully.');
      setIsDraftModalOpen(false);
      setDraftTitle('');
      fetchCurricula();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create draft.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <svg className="animate-spin w-10 h-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading teacher dashboard...</p>
      </div>
    );
  }

  // Safe destructure — stats is null until API resolves; arrays may be empty
  const safeStats = stats || {};
  const safeCurricula = Array.isArray(curricula) ? curricula : [];
  const safeClassAnalytics = Array.isArray(classAnalytics) ? classAnalytics : [];
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

  return (
    <div className="space-y-8 pb-10 relative">

      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Teacher Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage curriculum and view class performance.</p>
      </div>

      {/* Smart Warning Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm opacity-0 animate-fade-in-up mb-6" style={{ animationDelay: '0.12s' }}>
        <div className="flex items-center">
          <Clock className="text-amber-500 h-6 w-6 mr-3" />
          <div>
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">Approval Required</h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Changes to approved curricula require admin approval before they are visible to students.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Fake Dynamic Insight */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-center">
            <Brain className="text-indigo-500 h-6 w-6 mr-3" />
            <div>
              <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300">🤖 AI Dynamic Insight</h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
                70% of students struggled with <span className="font-bold">React Hooks</span> this week. Consider scheduling a review session. Engagement is up 15% overall.
              </p>
            </div>
          </div>
        </div>

        {(Array.isArray(safeRecommendations) ? safeRecommendations : []).filter(r => r?.action === 'improve').map((alert) => (
          <div key={alert.id || Math.random()} className="bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 p-4 rounded-r-lg shadow-sm animate-pulse">
            <div className="flex items-center">
              <AlertCircle className="text-rose-500 h-6 w-6 mr-3" />
              <div>
                <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">⚠️ Critical Improvement Needed</h3>
                <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">{alert.reason}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {safeStats.totalTopics !== undefined && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard title="Total Topics" value={safeStats.totalTopics ?? 0} icon={BookOpen} color="bg-indigo-500" delay="0.2s" />
          <DashboardCard title="Students Enrolled" value="142" icon={Users} color="bg-blue-500" delay="0.3s" />
          <DashboardCard title="Outdated Materials" value={safeStats.outdatedTopics ?? 0} icon={AlertCircle} color="bg-rose-500" delay="0.4s" />
          <DashboardCard
            title="Class Avg Score"
            value={safeClassAnalytics.length > 0
              ? `${Math.round(100 - safeClassAnalytics.reduce((a, c) => a + (c.weakPercentage || 0), 0) / safeClassAnalytics.length)}%`
              : '—'}
            icon={BarChart2} color="bg-emerald-500" delay="0.5s"
          />
        </div>
      )}

      {/* ── AI Class Insights Panel ── */}
      {safeClassAnalytics.length > 0 && (() => {
        const sorted = [...safeClassAnalytics].sort((a, b) => (b.weakPercentage || 0) - (a.weakPercentage || 0));
        const mostFailed = sorted[0];
        const criticalTopics = sorted.filter(t => t.isCritical);
        const classAvg = Math.round(100 - sorted.reduce((a, c) => a + (c.weakPercentage || 0), 0) / sorted.length);
        return (
          <div className="space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.52s' }}>
            {/* Critical alerts */}
            {criticalTopics.map(topic => (
              <div key={topic.topicId} className="bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 p-4 rounded-r-lg shadow-sm flex items-center gap-3">
                <AlertCircle className="text-rose-500 h-6 w-6 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-300">🤖 AI Alert: High Failure Rate in "{topic.topicTitle}"</p>
                  <p className="text-sm text-rose-700 dark:text-rose-400">{topic.weakPercentage}% of students are struggling. <span className="font-bold">AI recommends a curriculum update.</span></p>
                </div>
              </div>
            ))}

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Most Failed Topic</p>
                <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{mostFailed?.topicTitle || '—'}</p>
                <p className="text-xs text-slate-400 mt-1">{mostFailed?.weakPercentage || 0}% students weak</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Class Average Score</p>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{classAvg}%</p>
                <p className="text-xs text-slate-400 mt-1">Across all quiz attempts</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Critical Topics</p>
                <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{criticalTopics.length}</p>
                <p className="text-xs text-slate-400 mt-1">Topics with &gt;60% weak rate</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Performance Trend AreaChart */}
              <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" /> Class Performance Trends
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={performanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="score" name="Avg Score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    <Area type="monotone" dataKey="engagement" name="Engagement %" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Strengths vs Weakness RadarChart */}
              <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" /> Topic Proficiency Radar
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={sorted.slice(0, 5).map(t => ({ subject: t.topicTitle.substring(0, 10) + '...', score: 100 - (t.weakPercentage || 0) }))}>
                    <PolarGrid stroke="#64748b" strokeOpacity={0.2} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Proficiency" dataKey="score" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.4} />
                    <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Curriculum Management Workflows */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.55s' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-indigo-500 dark:text-indigo-400 w-6 h-6" />
            My Curriculum
          </h2>
          <button onClick={handleCreateDraft} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition">
            Create Draft
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Topics</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Admin Feedback</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {safeCurricula.length > 0 ? safeCurricula.map((cur) => (
                <tr key={cur._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">{cur?.title || 'Untitled'}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{cur?.draftTopics?.length || 0} Topics</td>
                  <td className="px-4 py-4 text-sm">
                    <StatusBadge status={cur?.status} />
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500 max-w-xs truncate">
                    {cur?.status === 'rejected' && cur?.adminFeedback ? (
                      <span className="text-rose-600 font-medium" title={cur.adminFeedback}>{cur.adminFeedback}</span>
                    ) : (
                      cur?.adminFeedback || '-'
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-right flex justify-end gap-3 items-center h-full">
                    {cur?.status === 'pending' ? (
                      <button disabled className="text-amber-500 font-medium cursor-not-allowed flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div> Waiting...
                      </button>
                    ) : cur?.status === 'approved' ? (
                      <span className="text-emerald-600 font-medium cursor-pointer hover:underline" onClick={() => toast.info('You can edit topics directly. Changes will go to Draft mode.')}>
                        Active (Add Topics)
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleSubmitApproval(cur?._id, cur)}
                        className={`btn-interactive font-semibold flex items-center gap-1 transition ${
                          cur?.draftTopics?.length === 0 ? 'text-slate-400 cursor-not-allowed' :
                          'text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300'
                        }`}
                        disabled={cur?.draftTopics?.length === 0 || submittingIds.has(cur?._id)}
                      >
                        {submittingIds.has(cur?._id) ? (
                          <><div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> Waiting...</>
                        ) : cur?.status === 'rejected' ? 'Resubmit for Approval' : 'Submit for Approval'}
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleDelete(cur?._id)} 
                      className={`ml-2 ${cur?.status === 'pending' ? 'text-slate-300 cursor-not-allowed' : 'text-rose-500 hover:text-rose-700'}`} 
                      title="Delete"
                      disabled={cur?.status === 'pending'}
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                    No curriculum drafts found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-8 opacity-0 animate-fade-in-up hover:shadow-md transition-shadow" style={{ animationDelay: '0.6s' }}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <FileUp className="text-indigo-500 dark:text-indigo-400 w-6 h-6" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => toast.info('Syllabus upload is a demo feature. (Coming soon!)')}
              className="flex flex-col items-center justify-center p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-800">
              <FileUp className="w-8 h-8 mb-2" />
              <span className="font-semibold">Upload Syllabus</span>
            </button>
            <button 
              onClick={() => toast.info('Study material added to your course! (Demo)')}
              className="flex flex-col items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-100 dark:border-blue-800">
              <BookOpen className="w-8 h-8 mb-2" />
              <span className="font-semibold">Add Study Material</span>
            </button>
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 mt-8 flex items-center gap-2">
            <AlertCircle className="text-rose-500 dark:text-rose-400 w-6 h-6" />
            Class Performance Alerts
          </h2>
          <div className="space-y-4">
            {(Array.isArray(safeClassAnalytics) ? safeClassAnalytics : []).length > 0 ? (Array.isArray(safeClassAnalytics) ? safeClassAnalytics : []).map((item, idx) => (
              <div key={idx} className={`p-4 rounded-xl flex items-start gap-4 border ${item.isCritical ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700'}`}>
                {item.isCritical ? <AlertCircle className="text-rose-500 w-6 h-6 shrink-0 mt-0.5" /> : <TrendingUp className="text-indigo-500 w-6 h-6 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{item.topicTitle}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    <span className={item.isCritical ? 'text-rose-600 font-bold' : 'text-indigo-600'}>{item.weakPercentage}% students struggling</span> in this topic.
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic">No class analytics available yet.</p>
            )}
          </div>
        </div>

        {/* Curriculum Health Pie Chart */}
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-8 opacity-0 animate-fade-in-up hover:shadow-md transition-shadow" style={{ animationDelay: '0.7s' }}>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Curriculum Health</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {healthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Engagement Bar Chart */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-8 opacity-0 animate-fade-in-up hover:shadow-md transition-shadow" style={{ animationDelay: '0.8s' }}>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <BarChart2 className="text-blue-500 w-6 h-6" />
          Topic Engagement Analytics
        </h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(Array.isArray(safeClassAnalytics) ? safeClassAnalytics : []).map(a => ({ name: a?.topicTitle || '', attempts: a?.totalAttempts || 0, weakPct: a?.weakPercentage || 0 }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.2} />
              <XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="attempts" name="Total Quiz Attempts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="weakPct" name="Weakness %" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Modal 
        isOpen={isDraftModalOpen} 
        onClose={() => setIsDraftModalOpen(false)} 
        title="Create New Draft"
        footer={
          <>
            <button onClick={() => setIsDraftModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleCreateDraftSubmit} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">Create Draft</button>
          </>
        }
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Draft Title</label>
          <input
            type="text"
            required
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-colors"
            placeholder="e.g., Advanced React Patterns"
          />
        </div>
      </Modal>
    </div>
  );
}
