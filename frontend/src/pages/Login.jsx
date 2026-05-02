import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Zap, Shield } from 'lucide-react';

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
  </svg>
);

const InputField = ({ label, type = 'text', value, onChange, required, placeholder, rightElement }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
      />
      {rightElement && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div>
      )}
    </div>
  </div>
);

export default function Login() {
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [branch, setBranch] = useState('CSE');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

  const { login, register, verifyOTP, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      if (step === 'login') {
        await login(email, password);
        toast.success('Welcome back! 🎉');
        navigate('/dashboard');
      } else if (step === 'register') {
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        await register(name, email, password, role, branch);
        toast.success('Account created! Welcome aboard.');
        navigate('/dashboard');
      } else if (step === 'forgot') {
        const res = await forgotPassword(email);
        setSuccessMsg(res.message);
        setStep('reset');
      } else if (step === 'reset') {
        const res = await resetPassword(email, newPassword);
        setSuccessMsg(res.message);
        setTimeout(() => setStep('login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (e, demoRole) => {
    if (e) e.preventDefault();
    const emails = { student: 'student@demo.com', teacher: 'teacher@demo.com', admin: 'admin@demo.com' };
    setDemoLoading(demoRole);
    try {
      setError('');
      const res = await login(emails[demoRole], '123456');
      console.log('Demo login OK, token:', res?.token?.slice(0, 20));
      navigate('/dashboard');
    } catch (err) {
      console.error('Demo login failed:', err);
      setError(err.response?.data?.message || 'Demo login failed');
    } finally {
      setDemoLoading(null);
    }
  };

  const switchStep = (newStep) => { setStep(newStep); setError(''); setSuccessMsg(''); };

  const titles = {
    login: 'Welcome back',
    register: 'Create an account',
    forgot: 'Reset password',
    reset: 'New password',
  };

  const demoRoles = [
    { role: 'admin',   label: 'Admin Demo',   icon: Shield,   grad: 'from-violet-500 to-indigo-600',   shadow: 'shadow-indigo-500/30' },
    { role: 'teacher', label: 'Teacher Demo', icon: Sparkles, grad: 'from-emerald-500 to-teal-600',    shadow: 'shadow-emerald-500/30' },
    { role: 'student', label: 'Student Demo', icon: Zap,      grad: 'from-blue-500 to-indigo-500',     shadow: 'shadow-blue-500/30' },
  ];

  return (
    <div className="hero-mesh dark:hero-mesh min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-300">

      {/* Back link */}
      <Link
        to="/"
        className="fixed top-5 left-5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 group"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl font-extrabold gradient-text tracking-tight">SkillSync</span>
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mt-2 text-xl font-bold text-slate-800 dark:text-white"
            >
              {titles[step]}
            </motion.p>
          </AnimatePresence>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {step === 'login' ? 'Sign in to your account to continue' :
             step === 'register' ? 'Join thousands of learners today' :
             step === 'forgot' ? 'Enter your email to receive a reset link' :
             'Choose a strong password for your account'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card dark:glass-card rounded-3xl p-8 shadow-2xl">

          {/* Error / Success */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm text-center border border-rose-200 dark:border-rose-800/50"
              >
                {error}
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm text-center border border-emerald-200 dark:border-emerald-800/50"
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name (register only) */}
            {step === 'register' && (
              <InputField label="Full Name" value={name} onChange={e => setName(e.target.value)} required placeholder="Alex Johnson" />
            )}

            {/* Email */}
            {(step === 'login' || step === 'register' || step === 'forgot') && (
              <InputField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            )}

            {/* Password */}
            {(step === 'login' || step === 'register') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  {step === 'login' && (
                    <button type="button" onClick={() => switchStep('forgot')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* New Password (reset) */}
            {step === 'reset' && (
              <InputField label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Min 6 characters" />
            )}

            {/* Role + Branch (register) */}
            {step === 'register' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {role === 'student' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Branch</label>
                    <select value={branch} onChange={e => setBranch(e.target.value)} className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                      <option value="CSE">CSE (Computer Science)</option>
                      <option value="ECE">ECE (Electronics & Comm)</option>
                      <option value="EEE">EEE (Electrical & Electronics)</option>
                      <option value="BIPC">BIPC (Biology, Physics, Chemistry)</option>
                      <option value="AGRI">AGRI (Agriculture)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-interactive mt-2 flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting && <Spinner />}
              {submitting ? 'Please wait...' :
               step === 'login' ? 'Sign In' :
               step === 'register' ? 'Create Account' :
               step === 'forgot' ? 'Send Reset Link' : 'Set New Password'}
            </button>
          </form>

          {/* Switch step link */}
          <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
            {(step === 'forgot' || step === 'reset') ? (
              <button onClick={() => switchStep('login')} className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">← Back to sign in</button>
            ) : step === 'login' ? (
              <>Not a member?{' '}<button onClick={() => switchStep('register')} className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">Create an account</button></>
            ) : (
              <>Already have an account?{' '}<button onClick={() => switchStep('login')} className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">Sign in</button></>
            )}
          </p>

          {/* ── Demo Buttons ── */}
          {step === 'login' && (
            <div className="mt-6 pt-6 border-t border-slate-200/70 dark:border-slate-700/50">
              <p className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                ⚡ One-Click Demo
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {demoRoles.map(({ role: r, label, icon: Icon, grad, shadow }) => (
                  <motion.button
                    key={r}
                    type="button"
                    disabled={demoLoading !== null}
                    onClick={(e) => handleDemoLogin(e, r)}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl text-white bg-gradient-to-br ${grad} shadow-lg ${shadow} disabled:opacity-50 transition-all duration-200 cursor-pointer`}
                  >
                    {demoLoading === r
                      ? <Spinner />
                      : <Icon className="w-4 h-4" />
                    }
                    <span className="text-[10px] font-bold leading-tight">{label}</span>
                  </motion.button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-center text-slate-400 dark:text-slate-500">
                Instantly logs you in with a demo account · No setup required
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
