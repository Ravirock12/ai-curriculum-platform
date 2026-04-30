import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Sparkles, AlertTriangle, PlusCircle, RefreshCw, TrendingUp, CheckCircle2, ArrowRight, Zap, Target, History, ArrowDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [trends, setTrends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsRes, recommendationsRes, analyticsRes] = await Promise.all([
          api.get('/curriculum/trends'),
          api.get('/curriculum/recommendations'),
          api.get('/curriculum/analytics')
        ]);
        setTrends(Array.isArray(trendsRes.data) ? trendsRes.data : []);
        setRecommendations(Array.isArray(recommendationsRes.data) ? recommendationsRes.data : []);
        setAnalytics(analyticsRes.data || null);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Format data for Scatter Chart (Demand vs Growth)
  const safeTrends = Array.isArray(trends) ? trends : [];
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];
  const scatterData = safeTrends.map(t => ({
    x: t?.demandScore ?? 0,
    y: t?.growthRate ?? 0,
    z: 100, // Dot size
    name: t?.skill ?? ''
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/90 text-white p-3 rounded-lg shadow-xl border border-slate-700 backdrop-blur-sm">
          <p className="font-bold text-lg">{data.name}</p>
          <p className="text-slate-300">Demand: <span className="text-white font-medium">{data.x}</span></p>
          <p className="text-slate-300">Growth: <span className="text-white font-medium">{data.y}%</span></p>
        </div>
      );
    }
    return null;
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'add': return <PlusCircle className="w-5 h-5 text-emerald-500" />;
      case 'update': return <RefreshCw className="w-5 h-5 text-blue-500" />;
      case 'deprecate': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'prerequisite_gap': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <CheckCircle2 className="w-5 h-5 text-slate-500" />;
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      High: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
      Medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      Low: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[priority] || styles.Medium}`}>
        {priority} Priority
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Intelligence Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">AI-driven insights and curriculum health analytics.</p>
        </div>
        {analytics && (
          <div className="flex gap-4">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Avg Relevance</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{analytics?.avgRelevanceScore || 0}<span className="text-sm text-slate-400 font-normal">/100</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Demo Highlight: Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-rose-100 font-medium text-sm mb-1 uppercase tracking-wider">Most Outdated</p>
            <h3 className="text-2xl font-bold">Legacy Callbacks</h3>
            <p className="text-rose-200 text-sm mt-1">Relevance: 20/100</p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl"><History className="w-8 h-8 text-rose-100" /></div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-emerald-100 font-medium text-sm mb-1 uppercase tracking-wider">Top In-Demand</p>
            <h3 className="text-2xl font-bold">AI / Data Science</h3>
            <p className="text-emerald-200 text-sm mt-1">Growth: +30%</p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl"><Zap className="w-8 h-8 text-emerald-100" /></div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-amber-100 font-medium text-sm mb-1 uppercase tracking-wider">Biggest Gap</p>
            <h3 className="text-2xl font-bold">Node.js Backend</h3>
            <p className="text-amber-200 text-sm mt-1">Students struggling</p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl"><Target className="w-8 h-8 text-amber-100" /></div>
        </div>
      </div>

      {/* Visual Storytelling: Before vs After */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.18s' }}>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <RefreshCw className="text-blue-500 w-6 h-6" />
          Curriculum Transformation
        </h2>
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-6 rounded-2xl w-full">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-4">Old Curriculum (Outdated)</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-rose-100 dark:border-rose-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">HTML 4 Basics</span>
                <span className="text-xs font-bold text-rose-500 bg-rose-100 dark:bg-rose-900/30 px-2 py-1 rounded">Score: 30</span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-rose-100 dark:border-rose-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Legacy Callbacks</span>
                <span className="text-xs font-bold text-rose-500 bg-rose-100 dark:bg-rose-900/30 px-2 py-1 rounded">Score: 20</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full">
              <ArrowRight className="w-8 h-8 text-slate-400 hidden lg:block" />
              <ArrowDown className="w-8 h-8 text-slate-400 block lg:hidden" />
            </div>
          </div>

          <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-2xl w-full">
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4">Recommended Curriculum</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">HTML5 / Semantic Web</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">Score: 80</span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Async/Await & Promises</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">Score: 85</span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Generative AI Integration</span>
                <span className="text-xs font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded">Score: 98</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <section className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Recommendations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeRecommendations.length > 0 ? safeRecommendations.map((rec) => (
            <div key={rec.id} className="group relative bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getActionIcon(rec.action)}
                    <span className="font-bold text-lg text-slate-800 dark:text-white capitalize">{(rec.action ?? '').replace('_', ' ')}</span>
                  </div>
                  {getPriorityBadge(rec.priority)}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{rec.target}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{rec.reason}</p>
                
                {Array.isArray(rec.roadmap) && rec.roadmap.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Suggested Path</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      {rec.roadmap.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm border ${idx === rec.roadmap.length - 1 ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300 ring-2 ring-indigo-500/20' : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>{step}</span>
                          {idx < rec.roadmap.length - 1 && <ArrowRight className="w-4 h-4 text-slate-400" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-300">
                Take Action &rarr;
              </div>
            </div>
          )) : (
            <div className="col-span-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 border-dashed">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Curriculum is up to date!</h3>
              <p className="text-slate-500 dark:text-slate-400">No new AI recommendations at this time.</p>
            </div>
          )}
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Scatter Chart (Hot Skills Quadrant) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Skill Momentum Matrix</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Demand Score vs. Growth Rate</p>
            </div>
            <TrendingUp className="text-slate-400 dark:text-slate-500 w-5 h-5" />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.2} />
                <XAxis type="number" dataKey="x" name="Demand" domain={[0, 100]} tick={{fill: '#64748b'}} />
                <YAxis type="number" dataKey="y" name="Growth" tick={{fill: '#64748b'}} />
                <ZAxis type="number" dataKey="z" range={[100, 300]} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{strokeDasharray: '3 3'}} />
                <Scatter name="Skills" data={scatterData} fill="#8b5cf6">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart (Category Coverage) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Industry Radar</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Current market demand by skill area</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={safeTrends}>
                <PolarGrid stroke="#64748b" strokeOpacity={0.2} />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Demand" dataKey="demandScore" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Existing Bar Chart as bottom row */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Absolute Demand Ranking</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safeTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.2} />
              <XAxis dataKey="skill" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{fill: '#cbd5e1', opacity: 0.2}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
              <Bar dataKey="demandScore" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
