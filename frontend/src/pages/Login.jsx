import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Login() {
  const [step, setStep] = useState('login'); // 'login', 'register', 'otp', 'forgot', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [branch, setBranch] = useState('CSE');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'admin', 'teacher', 'student', or null
  
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
        toast.success(`Welcome back! 🎉`);
        navigate('/dashboard');
      } 
      else if (step === 'register') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setSubmitting(false);
          return;
        }
        await register(name, email, password, role, branch);
        toast.success('Account created! Welcome aboard.');
        navigate('/dashboard');
      }
      else if (step === 'forgot') {
        const res = await forgotPassword(email);
        setSuccessMsg(res.message);
        setStep('reset');
      }
      else if (step === 'reset') {
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

  const getTitle = () => {
    switch (step) {
      case 'login': return 'Sign in to your account';
      case 'register': return 'Create a new account';

      case 'forgot': return 'Reset your password';
      case 'reset': return 'Create new password';
      default: return 'Welcome';
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-900 dark:to-indigo-950 transition-colors duration-300">
      <div className="absolute top-4 left-4">
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-transform hover:-translate-x-1 inline-block">
          &larr; Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-4xl font-extrabold leading-9 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
          SkillSync
        </h2>
        <h2 className="mt-2 text-center text-2xl font-bold leading-9 tracking-tight text-slate-900 dark:text-white">
          {getTitle()}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 shadow-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 transition-colors duration-300">
        <form id="auth-form" className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-sm text-center border border-rose-100 dark:border-rose-800">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-sm text-center border border-emerald-100 dark:border-emerald-800">
              {successMsg}
            </div>
          )}

          {step === 'register' && (
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Full Name</label>
              <div className="mt-2">
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-lg border-0 py-2 text-slate-900 dark:text-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 px-3" />
              </div>
            </div>
          )}

          {(step === 'login' || step === 'register' || step === 'forgot') && (
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Email Address</label>
              <div className="mt-2">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-lg border-0 py-2 text-slate-900 dark:text-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 px-3" />
              </div>
            </div>
          )}

          {(step === 'login' || step === 'register') && (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Password</label>
                {step === 'login' && (
                  <div className="text-sm">
                    <button type="button" onClick={() => { setStep('forgot'); setError(''); setSuccessMsg(''); }} className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-lg border-0 py-2 text-slate-900 dark:text-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 px-3" />
              </div>
            </div>
          )}

          {step === 'register' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 block w-full rounded-lg border-0 py-2 text-slate-900 dark:text-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 px-3">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {role === 'student' && (
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Select Branch</label>
                  <select value={branch} onChange={(e) => setBranch(e.target.value)} className="mt-2 block w-full rounded-lg border-0 py-2 text-slate-900 dark:text-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 px-3">
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



          {step === 'reset' && (
            <div className="mt-4">
              <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">New Password</label>
              <div className="mt-2">
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="block w-full rounded-lg border-0 py-2 text-slate-900 dark:text-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 px-3" />
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-interactive flex w-full justify-center items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-60"
            >
              {submitting && (
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
              {submitting ? 'Please wait...' : (step === 'login' ? 'Sign in' : step === 'register' ? 'Sign up' : step === 'forgot' ? 'Reset Password' : 'Confirm Password')}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {(step === 'forgot' || step === 'reset') ? (
            <button onClick={() => { setStep('login'); setError(''); setSuccessMsg(''); }} className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Back to sign in
            </button>
          ) : step === 'login' ? (
            <>Not a member? <button onClick={() => setStep('register')} className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Create an account</button></>
          ) : (
            <>Already have an account? <button onClick={() => setStep('login')} className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Sign in here</button></>
          )}
        </p>

        {/* Fast Demo Accounts */}
        {(step === 'login') && (
          <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
            <p className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
              🚀 One-Click Hackathon Demo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={async () => {
                  setDemoLoading('admin');
                  setEmail('admin@demo.com');
                  setPassword('123456');
                  try {
                    setError('');
                    setSuccessMsg('');
                    await login('admin@demo.com', '123456');
                    navigate('/dashboard');
                  } catch (err) {
                    setError(err.response?.data?.message || 'Authentication failed');
                  } finally {
                    setDemoLoading(null);
                  }
                }}
                className="flex justify-center items-center py-2 px-3 border border-transparent rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 transition shadow-lg shadow-indigo-500/30 disabled:opacity-50"
              >
                {demoLoading === 'admin' ? <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : 'Admin Demo'}
              </button>
              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={async () => {
                  setDemoLoading('teacher');
                  setEmail('teacher@demo.com');
                  setPassword('123456');
                  try {
                    setError('');
                    setSuccessMsg('');
                    await login('teacher@demo.com', '123456');
                    navigate('/dashboard');
                  } catch (err) {
                    setError(err.response?.data?.message || 'Authentication failed');
                  } finally {
                    setDemoLoading(null);
                  }
                }}
                className="flex justify-center items-center py-2 px-3 border border-transparent rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg shadow-emerald-500/30 disabled:opacity-50"
              >
                {demoLoading === 'teacher' ? <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : 'Teacher Demo'}
              </button>
              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={async () => {
                  setDemoLoading('student');
                  setEmail('student@demo.com');
                  setPassword('123456');
                  try {
                    setError('');
                    setSuccessMsg('');
                    await login('student@demo.com', '123456');
                    navigate('/dashboard');
                  } catch (err) {
                    setError(err.response?.data?.message || 'Authentication failed');
                  } finally {
                    setDemoLoading(null);
                  }
                }}
                className="flex justify-center items-center py-2 px-3 border border-transparent rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                {demoLoading === 'student' ? <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : 'Student Demo'}
              </button>
            </div>
            <p className="mt-3 text-xs text-center text-slate-400 dark:text-slate-500">Instantly logs you into the demo account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
