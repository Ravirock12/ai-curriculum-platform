import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Trophy, Clock, Star, ArrowLeft, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const RANK_STYLES = [
  'bg-yellow-400/20 border-yellow-400 text-yellow-300',
  'bg-gray-400/20 border-gray-400 text-gray-300',
  'bg-amber-700/20 border-amber-600 text-amber-400',
];

const RANK_ICONS = ['🥇', '🥈', '🥉'];

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

export default function Leaderboard() {
  const navigate = useNavigate();
  const [type, setType] = useState('competition');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [data, setData] = useState({ leaderboard: [], myEntry: null });
  const [loading, setLoading] = useState(true);
  const [liveFlash, setLiveFlash] = useState(false);
  const socketRef = useRef(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // Socket.IO connection
  useEffect(() => {
    const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => console.log('🔴 Leaderboard socket connected'));

    socket.on('leaderboardUpdated', (payload) => {
      // Flash indicator + refetch
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 2000);
      toast.info(`🏅 ${payload?.newEntry?.name || 'Someone'} just submitted a score!`, { autoClose: 3000 });
      fetchLeaderboard();
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [type, branchFilter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const branchParam = branchFilter !== 'ALL' ? `&branch=${branchFilter}` : '';
      const { data: res } = await api.get(`/quiz/leaderboard?type=${type}${branchParam}`);
      setData(res);
    } catch {
      setData({ leaderboard: [], myEntry: null });
    } finally {
      setLoading(false);
    }
  };

  const entries = Array.isArray(data.leaderboard) ? data.leaderboard : [];
  const myEntry = data.myEntry;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <Trophy className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold text-white">Leaderboard</h1>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full transition-all ${
                  liveFlash ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white/70'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${liveFlash ? 'bg-white' : 'bg-green-400'} animate-pulse`} />
                  LIVE
                </span>
              </div>
              <p className="text-white/70 text-sm">Updates in real-time as scores come in</p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex gap-2 bg-white/10 p-1 rounded-xl backdrop-blur-sm">
              {['competition', 'practice'].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all ${type === t ? 'bg-white text-indigo-700 shadow' : 'text-white/70 hover:text-white'}`}
                >
                  {t === 'competition' ? '🏆 Competition' : '📘 Practice'}
                </button>
              ))}
            </div>

            {/* Branch Filter */}
            <div className="flex gap-1 bg-white/10 p-1 rounded-xl backdrop-blur-sm flex-wrap">
              {['ALL', 'CSE', 'ECE', 'EEE', 'BIPC', 'AGRI'].map(b => (
                <button
                  key={b}
                  onClick={() => setBranchFilter(b)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                    branchFilter === b
                      ? 'bg-white text-indigo-700 shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* My Entry Banner */}
        {myEntry && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/40 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Your Rank</p>
                <p className="text-white font-bold text-lg">#{myEntry.rank} — {myEntry.score} pts</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Correct: {myEntry.correctAnswers}/{myEntry.totalQuestions}</p>
              <p className="text-xs text-gray-400">Time: {formatTime(myEntry.timeTaken)}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm animate-pulse">Loading rankings...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-semibold">No results yet</p>
            <p className="text-gray-500 text-sm mt-1">
              {type === 'competition' ? "Complete this week's competition quiz to appear here!" : 'Complete a practice quiz to appear here!'}
            </p>
            <button onClick={() => navigate('/dashboard')} className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-sm">
              Take a Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top 3 podium */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[entries[1], entries[0], entries[2]].map((entry, podiumIdx) => {
                if (!entry) return <div key={podiumIdx} />;
                const realRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
                const isMe = entry.userId?.toString() === userInfo._id?.toString();
                return (
                  <div key={podiumIdx} className={`flex flex-col items-center p-4 rounded-2xl border ${RANK_STYLES[realRank-1]} ${podiumIdx === 1 ? 'scale-110 shadow-xl' : ''} ${isMe ? 'ring-2 ring-white/40' : ''}`}>
                    <div className="text-3xl mb-1">{RANK_ICONS[realRank-1]}</div>
                    <p className={`font-bold text-sm text-center truncate w-full text-center ${isMe ? 'text-white' : ''}`}>{entry.name} {isMe ? '(You)' : ''}</p>
                    <p className="text-xs opacity-70 mb-2">{entry.branch}</p>
                    <p className="text-xl font-extrabold">{entry.score}</p>
                    <p className="text-[10px] opacity-60">pts</p>
                    <p className="text-[10px] opacity-60 mt-1">{formatTime(entry.timeTaken)}</p>
                  </div>
                );
              })}
            </div>

            {/* Full table */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-800/50 text-xs font-bold uppercase tracking-wider text-gray-400">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Branch</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-2 text-center">Correct</div>
                <div className="col-span-1 text-center">
                  <Clock className="w-3 h-3 mx-auto" />
                </div>
              </div>
              {entries.map((entry, idx) => {
                const isMe = entry.userId?.toString() === userInfo._id?.toString();
                return (
                  <div
                    key={entry._id || idx}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 border-t border-gray-800 text-sm transition-colors ${isMe ? 'bg-indigo-600/15 border-indigo-500/30' : 'hover:bg-gray-800/40'}`}
                  >
                    <div className="col-span-1 font-bold text-gray-400">
                      {idx < 3 ? RANK_ICONS[idx] : `#${idx + 1}`}
                    </div>
                    <div className="col-span-4 font-semibold truncate">
                      {entry.name} {isMe && <span className="text-indigo-400 text-xs">(You)</span>}
                    </div>
                    <div className="col-span-2 text-gray-400 text-xs flex items-center">
                      <span className="px-2 py-0.5 bg-gray-700 rounded-full">{entry.branch}</span>
                    </div>
                    <div className="col-span-2 text-center font-bold text-indigo-300">{entry.score}</div>
                    <div className="col-span-2 text-center text-gray-300">
                      {entry.correctAnswers}/{entry.totalQuestions}
                    </div>
                    <div className="col-span-1 text-center text-xs text-gray-400">{formatTime(entry.timeTaken)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
