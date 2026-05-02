import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const COMPETITION_SECONDS = 20 * 60; // 20 minutes

const QuizChat = () => {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const isCompetition = searchParams.get('mode') === 'competition';
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Competition timer
  const [timeLeft, setTimeLeft] = useState(COMPETITION_SECONDS);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => { fetchQuiz(); }, [topicId, isCompetition]);
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Anti-cheat: warn on tab switch during active quiz
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && currentQuestionIndex >= 0 && !isFinished) {
        toast.warning('⚠️ Tab switch detected! Stay focused during the quiz.', { toastId: 'tab-switch', autoClose: 3000 });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [currentQuestionIndex, isFinished]);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchQuiz = async () => {
    try {
      let data;
      if (isCompetition) {
        const res = await api.get('/quiz/competition');
        data = res.data;
        setQuiz(data);
        setMessages([{
          id: 'welcome',
          text: `🏆 Welcome to the Weekly Competition! 30 questions — 20 minutes. Ready to compete?`,
          sender: 'bot',
          type: 'intro'
        }]);
      } else {
        const res = await api.get(`/quiz/topic/${topicId}`);
        const list = Array.isArray(res.data) ? res.data : [];
        if (list.length === 0) { toast.error('No quiz found.'); navigate('/dashboard'); return; }
        data = list[0];
        setQuiz(data);
        const cooldown = data.cooldownRemainingHours || 0;
        setMessages([{
          id: 'welcome',
          text: cooldown > 0
            ? `⏳ You already took this quiz recently. Next available in ${cooldown} hour(s). Practice answers below are still available!`
            : `Welcome to the ${data.title}! Ready to start your practice quiz?`,
          sender: 'bot',
          type: 'intro'
        }]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load quiz.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    if (!quiz?.questions?.length) { toast.error('This quiz has no questions yet.'); return; }
    setCurrentQuestionIndex(0);
    setStartTime(Date.now());

    if (isCompetition) {
      // Start countdown
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    const firstQuestion = quiz.questions[0];
    setMessages(prev => [...(Array.isArray(prev) ? prev : []),
    { id: 'user-start', text: "Let's start!", sender: 'user' },
    { id: 'q-0', text: firstQuestion.questionText, sender: 'bot', question: firstQuestion }
    ]);
  };

  // Auto-submit when competition timer hits 0
  useEffect(() => {
    if (isCompetition && timeLeft === 0 && currentQuestionIndex >= 0 && !isFinished && !submitted) {
      toast.warning('⏰ Time is up! Auto-submitting...');
      finishQuiz(userAnswers);
    }
  }, [timeLeft]);

  const handleAnswer = (answer) => {
    if (showFeedback || submitted) return;
    const question = quiz?.questions?.[currentQuestionIndex];
    if (!question) return;

    setSelectedAnswer(answer);
    setShowFeedback(true);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const newAnswer = { questionId: question._id, answer, timeTakenSeconds: timeTaken };
    const updatedAnswers = [...(Array.isArray(userAnswers) ? userAnswers : []), newAnswer];
    setUserAnswers(updatedAnswers);

    setMessages(prev => [...(Array.isArray(prev) ? prev : []), { id: `ans-${currentQuestionIndex}`, text: answer, sender: 'user' }]);

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);

      if (currentQuestionIndex < (quiz?.questions?.length || 0) - 1) {
        const nextIndex = currentQuestionIndex + 1;
        const nextQuestion = quiz.questions[nextIndex];
        setCurrentQuestionIndex(nextIndex);
        setStartTime(Date.now());
        setTimeout(() => {
          setMessages(prev => [...(Array.isArray(prev) ? prev : []), { id: `q-${nextIndex}`, text: nextQuestion.questionText, sender: 'bot', question: nextQuestion }]);
        }, 300);
      } else {
        finishQuiz(updatedAnswers);
      }
    }, 1500);
  };

  const finishQuiz = async (finalAnswers) => {
    if (submitted) return;
    setSubmitted(true);
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setMessages(prev => [...(Array.isArray(prev) ? prev : []), { id: 'bot-finishing', text: '🧠 Analyzing your results...', sender: 'bot' }]);

    try {
      const totalTime = COMPETITION_SECONDS - timeLeft; // for competition
      const practiceTime = (Array.isArray(finalAnswers) ? finalAnswers : []).reduce((acc, curr) => acc + (curr.timeTakenSeconds || 0), 0);

      const { data } = await api.post('/quiz/submit', {
        quizId: quiz._id,
        answers: finalAnswers,
        totalTimeTakenSeconds: isCompetition ? totalTime : practiceTime,
        quizType: isCompetition ? 'competition' : 'practice',
      });

      // Badge unlock toasts
      if (Array.isArray(data?.newBadges) && data.newBadges.length > 0) {
        data.newBadges.forEach(badge => {
          toast.success(`🏆 Badge Unlocked: ${badge}!`, { autoClose: 4000 });
        });
      }
      // Streak toast
      if (data?.streak > 1) {
        toast.info(`🔥 ${data.streak}-day streak! Keep it up!`, { autoClose: 3000 });
      }

      const scorePct = ((data?.attempt?.score / data?.attempt?.totalQuestions) * 100).toFixed(1);

      setTimeout(() => {
        setMessages(prev => [...(Array.isArray(prev) ? prev : []), {
          id: 'result',
          text: isCompetition
            ? `🏆 Competition Complete! Score: ${data?.attempt?.score || 0}/${data?.attempt?.totalQuestions || 0} (${scorePct}%). Points: ${data?.leaderboardScore || 0}. Performance: ${data?.attempt?.performanceTag || '—'}.`
            : `✅ Quiz Complete! You scored ${data?.attempt?.score || 0}/${data?.attempt?.totalQuestions || 0} (${scorePct}%). Performance: ${data?.attempt?.performanceTag || '—'}.`,
          sender: 'bot',
          type: 'result',
          result: data?.attempt,
          leaderboardScore: data?.leaderboardScore,
          rank: data?.rank
        }]);
      }, 1000);
    } catch {
      toast.error('Failed to submit quiz results.');
    }
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-950 text-white gap-4">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm animate-pulse">{isCompetition ? 'Loading competition quiz...' : 'Preparing adaptive quiz...'}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 max-w-4xl mx-auto shadow-2xl border-x border-gray-800">
      {/* Header */}
      <div className={`p-4 border-b border-gray-800 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 ${isCompetition ? 'bg-gradient-to-r from-indigo-900/80 to-purple-900/80' : 'bg-gray-900/50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${isCompetition ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900' : 'bg-indigo-600'}`}>
            {isCompetition ? '🏆' : 'AI'}
          </div>
          <div>
            <h2 className="font-bold text-lg">{quiz?.title}</h2>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Online
              </span>
              {currentQuestionIndex >= 0 && !isFinished && (
                <span>• Q {currentQuestionIndex + 1} / {quiz?.questions?.length || 0}</span>
              )}
              {isCompetition && currentQuestionIndex >= 0 && !isFinished && (
                <span className={`font-bold ${timeLeft < 120 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>• ⏱ {formatCountdown(timeLeft)}</span>
              )}
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Progress bar for competition */}
      {isCompetition && currentQuestionIndex >= 0 && !isFinished && (
        <div className="h-1 bg-gray-800">
          <div
            className={`h-full transition-all duration-1000 ${timeLeft < 120 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
            style={{ width: `${(timeLeft / COMPETITION_SECONDS) * 100}%` }}
          />
        </div>
      )}

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {(Array.isArray(messages) ? messages : []).map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.sender === 'bot'
                ? 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700'
                : 'bg-indigo-600 text-white rounded-tr-none'
              }`}>
              <div className="flex justify-between items-start gap-4">
                <p className="leading-relaxed">{msg.text}</p>
                {msg.question?.difficulty && (
                  <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase whitespace-nowrap ${msg.question.difficulty === 'easy' ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
                      msg.question.difficulty === 'medium' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-600/20 text-red-400 border border-red-500/30'
                    }`}>{msg.question.difficulty}</span>
                )}
              </div>

              {/* Start button */}
              {msg.type === 'intro' && !isFinished && currentQuestionIndex === -1 && (
                <button onClick={startQuiz} className={`mt-4 w-full font-bold py-2 rounded-xl transition-all active:scale-95 ${isCompetition ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:opacity-90' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}>
                  {isCompetition ? '🏆 Start Competition' : 'Start Quiz'}
                </button>
              )}

              {/* MCQ Options */}
              {msg.question && !isFinished && msg.id === `q-${currentQuestionIndex}` && (
                <div className="mt-4 space-y-2">
                  {(Array.isArray(msg.question.options) ? msg.question.options : []).map((opt, i) => {
                    let btnClass = 'w-full text-left p-3 rounded-lg border transition-all text-sm ';
                    if (showFeedback) {
                      if (opt === msg.question.correctAnswer) btnClass += 'bg-green-600/20 border-green-500 text-green-400';
                      else if (opt === selectedAnswer) btnClass += 'bg-red-600/20 border-red-500 text-red-400';
                      else btnClass += 'bg-gray-700/50 border-gray-600 opacity-40';
                    } else {
                      btnClass += 'bg-gray-700/50 hover:bg-indigo-600/50 border-gray-600 hover:border-indigo-400 cursor-pointer';
                    }
                    return (
                      <button key={i} disabled={showFeedback} onClick={() => handleAnswer(opt)} className={btnClass}>
                        <span className="mr-2 font-bold text-indigo-400">{['A', 'B', 'C', 'D'][i] || '•'}.</span> {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Result screen */}
              {msg.type === 'result' && (
                <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                  {msg.rank && (
                    <p className="text-center text-sm text-yellow-400 font-bold">🏅 You ranked #{msg.rank} on the leaderboard!</p>
                  )}
                  <div className="flex flex-col gap-2">
                    <button onClick={() => navigate('/leaderboard')} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white font-bold py-2 rounded-xl transition-all">
                      🏆 View Leaderboard
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 rounded-xl transition-colors">
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Footer */}
      <div className={`p-3 text-center text-[10px] uppercase tracking-widest ${isCompetition ? 'bg-indigo-900/30 text-yellow-500' : 'bg-gray-900/30 text-gray-500'}`}>
        {isCompetition ? '🏆 SkillSync Weekly Competition — Ranked Mode' : 'AI-Powered Adaptive Assessment System'}
      </div>
    </div>
  );
};

export default QuizChat;
