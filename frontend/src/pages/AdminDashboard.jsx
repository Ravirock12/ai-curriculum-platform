import { useState, useEffect } from 'react';
import { Users, ShieldCheck, Activity, Settings, CheckCircle2, XCircle, AlertCircle, TrendingDown, Brain, BarChart2, GraduationCap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import api from '../services/api';
import Modal from '../components/Modal';
import { useNotifications } from '../context/NotificationContext';
import { toast } from 'react-toastify';


const DashboardCard = ({ title, value, icon: Icon, color, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className="card-premium p-6 flex items-center gap-5 shadow-sm"
  >
    <div className={`p-3.5 rounded-2xl ${color} text-white shadow-lg shrink-0`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="mt-0.5 text-3xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{sub}</p>}
    </div>
  </motion.div>
);

const PIE_COLORS = ['#10b981', '#3b82f6', '#ef4444'];

const userGrowthData = [
  { name: 'Jan', users: 40 },
  { name: 'Feb', users: 85 },
  { name: 'Mar', users: 120 },
  { name: 'Apr', users: 190 },
  { name: 'May', users: 256 },
];

const courseEngagementData = [
  { name: 'W1', hours: 120 },
  { name: 'W2', hours: 250 },
  { name: 'W3', hours: 400 },
  { name: 'W4', hours: 580 },
];

const roleDistributionData = [
  { name: 'Students', value: 204 },
  { name: 'Teachers', value: 45 },
  { name: 'Admins', value: 7 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 text-white p-3 rounded-xl shadow-xl border border-slate-700">
        <p className="font-semibold text-sm mb-1">{label || payload[0].name}</p>
        {payload.map((e, i) => (
          <p key={i} className="text-xs" style={{ color: e.color }}>{e.name}: <span className="font-bold">{e.value}</span></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [classAnalytics, setClassAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingCurriculumId, setRejectingCurriculumId] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  // Impact Modal State
  const [impactModal, setImpactModal] = useState({ isOpen: false, req: null });

  // Role Request State
  const [roleRequests, setRoleRequests] = useState([]);
  const [roleRequestLoading, setRoleRequestLoading] = useState({});

  // Role Approve Modal State
  const [isRoleApproveModalOpen, setIsRoleApproveModalOpen] = useState(false);
  const [approvingRoleReq, setApprovingRoleReq] = useState(null);
  const [selectedRoleBranch, setSelectedRoleBranch] = useState('CSE');

  const openRoleApproveModal = (req) => {
    setApprovingRoleReq(req);
    setSelectedRoleBranch(req.requestedBranch || 'CSE');
    setIsRoleApproveModalOpen(true);
  };

  const fetchRoleRequests = async () => {
    try {
      const { data } = await api.get('admin/requests?status=pending');
      console.log('AdminDashboard RoleRequests Fetch Result:', data);
      setRoleRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchRoleRequests failed:', err);
    }
  };

  const handleRoleReview = async (id, status, adminSelectedBranch = null) => {
    setRoleRequestLoading(prev => ({ ...prev, [id]: true }));
    try {
      const payload = { status };
      if (status === 'approved') {
        payload.adminSelectedBranch = adminSelectedBranch;
      }
      await api.patch(`role-requests/${id}/review`, payload);
      toast.success(status === 'approved' ? `✅ Role granted! User assigned to ${adminSelectedBranch}.` : '❌ Request rejected.');
      if (status === 'approved') setIsRoleApproveModalOpen(false);
      fetchRoleRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setRoleRequestLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const fetchCurriculum = async () => {
    try {
      const { data } = await api.get('curriculum/subjects');
      setPendingRequests(Array.isArray(data) ? data.filter(c => c?.status === 'pending') : []);
    } catch (error) {
      console.error('Error fetching curriculum:', error);
      setPendingRequests([]);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('curriculum/analytics').catch(() => ({ data: null })),
          api.get('quiz/analytics/class').catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data || null);
        setClassAnalytics(Array.isArray(analyticsRes.data) ? analyticsRes.data : []);
      } catch (error) {
        console.error('AdminDashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    fetchCurriculum();
    fetchRoleRequests();
  }, []);

  const openRejectModal = (id) => {
    setRejectingCurriculumId(id);
    setRejectFeedback('');
    setIsRejectModalOpen(true);
  };

  const handleReview = async (id, status, feedback = '') => {
    try {
      await api.put(`curriculum/subjects/${id}/review`, { status, adminFeedback: feedback });
      if (status === 'approved') {
        toast.success('✅ Curriculum approved and published to all students!');
      } else {
        toast.info('📩 Feedback sent to teacher. Curriculum returned for revision.');
      }
      setIsRejectModalOpen(false);
      fetchCurriculum();
    } catch (error) {
      console.error(error);
    }
  };

  const handleHardDelete = async (id) => {
    try {
      await api.delete(`curriculum/subjects/${id}`);
      toast.success('Curriculum permanently deleted from database.');
      fetchCurriculum();
    } catch (error) {
      toast.error('Failed to delete curriculum.');
    }
  };

  // ── AI Insights derived from classAnalytics ──
  const safeAnalytics = Array.isArray(classAnalytics) ? classAnalytics : [];
  const criticalTopics = safeAnalytics.filter(t => (t.weakPercentage || 0) > 60);

  useEffect(() => {
    if (criticalTopics.length > 0) {
      criticalTopics.forEach(topic => {
        addNotification({
          title: 'Curriculum Alert',
          message: `High failure rate in "${topic.topicTitle}" (${topic.weakPercentage}%). AI recommends a content update.`,
          type: 'error',
          role: 'admin',
          link: '/analytics'
        });
      });
    }
    if (pendingRequests.length > 0) {
      addNotification({
        title: 'Pending Approvals',
        message: `You have ${pendingRequests.length} curriculum requests waiting for review.`,
        type: 'warning',
        role: 'admin',
        link: '/dashboard'
      });
    }
  }, [criticalTopics.length, pendingRequests.length, addNotification]);

  const mostWeakTopic = [...safeAnalytics].sort((a, b) => (b.weakPercentage || 0) - (a.weakPercentage || 0))[0];
  const avgClassScore = safeAnalytics.length > 0
    ? Math.round(100 - safeAnalytics.reduce((a, c) => a + (c.weakPercentage || 0), 0) / safeAnalytics.length)
    : null;
  // Curriculum health: % of topics NOT critical
  const healthScore = safeAnalytics.length > 0
    ? Math.round(((safeAnalytics.length - criticalTopics.length) / safeAnalytics.length) * 100)
    : 100;
  const healthPieData = [
    { name: 'Healthy', value: safeAnalytics.length - criticalTopics.length },
    { name: 'At Risk', value: criticalTopics.length },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 relative">

      {/* Header */}
      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Portal</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">System overview, AI insights, and approval management.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <DashboardCard title="Total Users" value="256" icon={Users} color="bg-indigo-500" sub="Active learners" />
        <DashboardCard title="Active Topics" value={stats?.totalTopics ?? '—'} icon={Activity} color="bg-blue-500" sub="Across all branches" />
        <DashboardCard title="Pending Approvals" value={pendingRequests.length} icon={ShieldCheck} color="bg-amber-500" sub={pendingRequests.length > 0 ? 'Requires action' : 'All clear'} />
        <DashboardCard
          title="Curriculum Health"
          value={`${healthScore}%`}
          icon={Settings}
          color={healthScore >= 80 ? 'bg-emerald-500' : healthScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}
          sub={healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Needs attention' : 'Critical'}
        />
      </div>

      {/* ── AI Insights Panel ── */}
      {safeAnalytics.length > 0 && (
        <div className="space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>

          {/* AI Banner */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs text-violet-200 font-bold uppercase tracking-widest">AI System Intelligence</p>
                <p className="font-extrabold text-lg">
                  {criticalTopics.length > 0
                    ? `${criticalTopics.length} topic${criticalTopics.length > 1 ? 's' : ''} need${criticalTopics.length === 1 ? 's' : ''} curriculum update`
                    : 'All curricula are performing well 🎉'}
                </p>
                {mostWeakTopic && (
                  <p className="text-violet-200 text-sm mt-0.5">
                    Weakest area: <span className="font-bold text-yellow-300">{mostWeakTopic.topicTitle}</span>
                    {' '}({mostWeakTopic.weakPercentage}% students struggling)
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 shrink-0 flex-wrap">
              {avgClassScore !== null && (
                <div className="text-center bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <p className="text-xs text-violet-200 uppercase tracking-wider">Class Avg</p>
                  <p className="text-2xl font-extrabold">{avgClassScore}%</p>
                </div>
              )}
              <div className="text-center bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
                <p className="text-xs text-violet-200 uppercase tracking-wider">Health</p>
                <p className="text-2xl font-extrabold">{healthScore}%</p>
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar chart: top failing topics */}
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-500" /> Top Failing Topics
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={[...safeAnalytics].sort((a, b) => (b.weakPercentage || 0) - (a.weakPercentage || 0)).slice(0, 6)}
                  margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="topicTitle" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="weakPercentage" name="Weak %" radius={[4, 4, 0, 0]}
                    fill="#f43f5e"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie: curriculum health */}
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" /> Curriculum Health Score
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={healthPieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {healthPieData.map((_, i) => (
                      <Cell key={i} fill={['#10b981', '#ef4444'][i]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Analytics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* User Growth */}
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Platform Usage & Growth
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={userGrowthData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="users" name="Active Users" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* User Role Distribution */}
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> User Role Distribution
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={roleDistributionData} cx="50%" cy="50%" outerRadius={65} innerRadius={40} dataKey="value" label={false} paddingAngle={5}>
                    {roleDistributionData.map((_, i) => (
                      <Cell key={i} fill={['#3b82f6', '#8b5cf6', '#f59e0b'][i]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum Approval Queue */}
      <div className="grid grid-cols-1 gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-8 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-indigo-500 w-6 h-6" />
              Curriculum Approval Queue
              {pendingRequests.length > 0 && (
                <span className="ml-2 px-2.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold rounded-full">
                  {pendingRequests.length} pending
                </span>
              )}
            </h2>
            <button onClick={() => toast.info('Displaying all curriculum items (Demo).')} className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Change Request</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Topics</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {(Array.isArray(pendingRequests) ? pendingRequests : []).length > 0
                  ? (Array.isArray(pendingRequests) ? pendingRequests : []).map(req => (
                    <tr key={req?._id || Math.random()} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-white">{req?.title || 'Untitled'}</td>
                      <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                        <span>{req?.draftTopics?.length || 0} draft</span>
                        {req?.approvedTopics?.length > 0 && <span className="text-xs text-slate-400 ml-1">({req.approvedTopics.length} live)</span>}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold">Pending Review</span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex gap-2 items-center">
                          <button onClick={() => setImpactModal({ isOpen: true, req })} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Approve</button>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button onClick={() => openRejectModal(req._id)} className="text-rose-600 dark:text-rose-400 font-semibold hover:text-rose-800 dark:hover:text-rose-300 transition-colors">Reject</button>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button onClick={() => handleHardDelete(req._id)} className="text-red-500 hover:text-red-700 transition-colors" title="Hard delete">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  : (
                    <tr>
                      <td colSpan="4" className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        No pending approval requests. All clear!
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Curriculum"
        footer={
          <>
            <button onClick={() => setIsRejectModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button
              onClick={() => handleReview(rejectingCurriculumId, 'rejected', rejectFeedback)}
              disabled={!rejectFeedback.trim()}
              className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${!rejectFeedback.trim() ? 'bg-rose-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}`}
            >
              Send Feedback & Reject
            </button>
          </>
        }
      >
        <div className="mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Provide detailed feedback so the teacher knows what needs revision.</p>
          <textarea
            required rows={4} autoFocus
            value={rejectFeedback}
            onChange={(e) => setRejectFeedback(e.target.value)}
            placeholder="E.g., Please add more practical assignments to the React module."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:text-white transition-colors"
          />
        </div>
      </Modal>

      {/* Impact Preview Modal */}
      <Modal
        isOpen={impactModal.isOpen}
        onClose={() => setImpactModal({ isOpen: false, req: null })}
        title="Admin Impact Preview"
        footer={
          <>
            <button onClick={() => setImpactModal({ isOpen: false, req: null })} className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button
              onClick={() => { handleReview(impactModal.req._id, 'approved'); setImpactModal({ isOpen: false, req: null }); }}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
            >
              Confirm Approval
            </button>
          </>
        }
      >
        {impactModal.req && (
          <div className="mb-4 space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300">System Impact Analysis</h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                Approving this version will instantly update the live roadmap for <span className="font-bold text-emerald-900 dark:text-emerald-200">142 active students</span>.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Live Topics To Replace</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{impactModal.req.approvedTopics?.length || 0}</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl text-center">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">New Draft Topics</p>
                <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-300 mt-1">{impactModal.req.draftTopics?.length || 0}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 italic mt-4 text-center">
              Are you sure you want to deploy these changes to production?
            </p>
          </div>
        )}
      </Modal>

      {/* ── Role Upgrade Requests ── */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="text-violet-500 w-6 h-6" />
            Role Upgrade Requests
            {roleRequests.length > 0 && (
              <span className="ml-2 px-2.5 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-xs font-bold rounded-full">
                {roleRequests.length} pending
              </span>
            )}
          </h2>
        </div>

        {roleRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No pending role upgrade requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {roleRequests.map(req => (
                  <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{req.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{req.userId?.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold">
                        {req.requestedBranch}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                      <p className="truncate">{req.reason || <span className="italic opacity-50">No reason provided</span>}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openRoleApproveModal(req)}
                          disabled={roleRequestLoading[req._id]}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition"
                        >
                          {roleRequestLoading[req._id] ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleRoleReview(req._id, 'rejected')}
                          disabled={roleRequestLoading[req._id]}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50 border border-rose-200 dark:border-rose-800 rounded-lg transition"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isRoleApproveModalOpen}
        onClose={() => setIsRoleApproveModalOpen(false)}
        title="Approve Role Upgrade"
        footer={
          <>
            <button onClick={() => setIsRoleApproveModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button
              onClick={() => handleRoleReview(approvingRoleReq._id, 'approved', selectedRoleBranch)}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              disabled={roleRequestLoading[approvingRoleReq?._id]}
            >
              {roleRequestLoading[approvingRoleReq?._id] ? 'Approving...' : 'Confirm Approval'}
            </button>
          </>
        }
      >
        <div className="mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            You are approving a role upgrade for <span className="font-bold text-slate-900 dark:text-white">{approvingRoleReq?.userId?.name}</span>.
            Please select the specific branch they will be assigned to. DO NOT rely on user input.
          </p>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign Branch</label>
          <select
            value={selectedRoleBranch}
            onChange={(e) => setSelectedRoleBranch(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-colors"
          >
            <option value="CSE">Computer Science (CSE)</option>
            <option value="ECE">Electronics (ECE)</option>
            <option value="EEE">Electrical (EEE)</option>
            <option value="BIPC">Biology / Medical (BIPC)</option>
            <option value="AGRI">Agriculture (AGRI)</option>
          </select>
        </div>
      </Modal>

    </div>
  );
}
