import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, TrendingUp, ShieldCheck, Moon, Sun, Sparkles, Zap, Users } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] } })
};

const features = [
  {
    icon: TrendingUp,
    title: 'Industry Trend Analysis',
    desc: 'Compare your curriculum against current market demands and emerging technologies in real-time.',
    color: 'bg-indigo-500',
    glow: 'glow-indigo',
  },
  {
    icon: BookOpen,
    title: 'Smart Roadmaps',
    desc: 'AI-generated personalized learning paths that bridge skill gaps with precision and context.',
    color: 'bg-violet-500',
    glow: 'glow-purple',
  },
  {
    icon: ShieldCheck,
    title: 'Skill Auditing',
    desc: 'Automatically flag outdated topics and surface modern alternatives curated by AI.',
    color: 'bg-emerald-500',
    glow: 'glow-emerald',
  },
];

const stats = [
  { label: 'Active Learners',   value: '2,500+', icon: Users },
  { label: 'Skills Mapped',    value: '120+',   icon: Zap },
  { label: 'Accuracy Rate',    value: '98%',    icon: Sparkles },
];

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="hero-mesh dark:hero-mesh min-h-screen transition-colors duration-300 overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass dark:glass border-b border-white/20 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <span className="text-2xl font-extrabold gradient-text">SkillSync</span>
            </motion.div>
            <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-slate-800/60 transition-all duration-200"
                aria-label="Toggle Dark Mode"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link to={user ? '/dashboard' : '/login'} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 font-medium text-sm transition-colors">
                {user ? 'Dashboard' : 'Log in'}
              </Link>
              <Link
                to={user ? '/dashboard' : '/login'}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 flex items-center gap-1.5 btn-interactive"
              >
                {user ? 'Go to Dashboard' : 'Get Started'} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative px-6 pt-36 pb-20 lg:px-8 text-center max-w-5xl mx-auto">
        {/* Floating badge */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={0}
          className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-4 py-1.5 rounded-full text-sm font-semibold border border-indigo-200 dark:border-indigo-800/60 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Curriculum Intelligence
        </motion.div>

        <motion.h1
          variants={fadeUp} initial="hidden" animate="show" custom={1}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]"
        >
          Bridge the Gap Between{' '}
          <span className="gradient-text">Curriculum</span>{' '}
          and Industry
        </motion.h1>

        <motion.p
          variants={fadeUp} initial="hidden" animate="show" custom={2}
          className="mt-8 text-lg sm:text-xl leading-8 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
        >
          Analyze academic subjects, identify outdated skills, and generate AI-powered personalized learning roadmaps based on real-time industry trends.
        </motion.p>

        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={3}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to={user ? '/dashboard' : '/login'}
            className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 flex items-center justify-center gap-2 btn-interactive"
          >
            Start Analyzing <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          >
            View Demo
          </Link>
        </motion.div>

        {/* Stat strip */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={4}
          className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass-card dark:glass-card rounded-2xl p-4 text-center">
              <Icon className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Features ── */}
      <div className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Platform Features</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Everything you need to stay relevant
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color, glow }, i) => (
            <motion.div
              key={title}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
              className="glass-card dark:glass-card rounded-2xl p-8 group hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:${glow} transition-all duration-300`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CTA Banner ── */}
      <motion.div
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
        className="mx-6 lg:mx-auto max-w-4xl mb-24 rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 text-center text-white shadow-2xl shadow-indigo-500/30"
      >
        <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-80 animate-float" />
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to close the skills gap?</h2>
        <p className="text-indigo-200 text-lg mb-8">Join thousands of students and educators using SkillSync today.</p>
        <Link
          to={user ? '/dashboard' : '/login'}
          className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-all duration-200 shadow-lg btn-interactive"
        >
          Get Started Free <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-sm text-slate-400 dark:text-slate-600">
        © 2025 SkillSync · Built for Hackathon 🚀
      </footer>
    </div>
  );
}
