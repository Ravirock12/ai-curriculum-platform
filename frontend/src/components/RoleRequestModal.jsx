import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, X, ChevronDown, Send, CheckCircle2, Clock, XCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const BRANCHES = ['CSE', 'ECE', 'EEE', 'BIPC', 'AGRI'];

const StatusBadge = ({ status }) => {
  const map = {
    pending:  { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',  Icon: Clock,       label: 'Pending Review' },
    approved: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', Icon: CheckCircle2, label: 'Approved' },
    rejected: { color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',     Icon: XCircle,     label: 'Rejected' },
  };
  const { color, Icon, label } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
  );
};

const RoleRequestModal = ({ isOpen, onClose, existingRequest }) => {
  const [requestedBranch, setRequestedBranch] = useState('CSE');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('role-request', { requestedBranch, reason });
      toast.success('🎓 Role request submitted! An admin will review it shortly.');
      onClose(true); // true = refresh needed
    } catch (err) {
      console.error('Error submitting role request:', err);
      const msg = err.response?.data?.message || 'Failed to submit request.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onClose(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Request Teacher Role</h2>
                    <p className="text-indigo-200 text-xs mt-0.5">Submit for admin review</p>
                  </div>
                </div>
                <button onClick={() => onClose(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Existing request info */}
            {existingRequest && (
              <div className="mx-6 mt-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Existing Request</p>
                <div className="flex items-center justify-between">
                  <StatusBadge status={existingRequest.status} />
                  <span className="text-xs text-slate-500">{new Date(existingRequest.createdAt).toLocaleDateString()}</span>
                </div>
                {existingRequest.adminNote && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 italic">
                    Admin note: "{existingRequest.adminNote}"
                  </p>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Teaching Branch</label>
                <div className="relative">
                  <select
                    value={requestedBranch}
                    onChange={e => setRequestedBranch(e.target.value)}
                    className="w-full appearance-none px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Why do you want to be a teacher? <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Share your teaching experience or motivation..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">{reason.length}/500</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="flex-1 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || existingRequest?.status === 'pending'}
                  className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Send className="w-4 h-4" /> Submit Request</>
                  )}
                </button>
              </div>

              {existingRequest?.status === 'pending' && (
                <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                  ⏳ Your request is under review. You cannot submit another one yet.
                </p>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RoleRequestModal;
