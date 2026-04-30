import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle, Clock, BookOpen, PlusCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

// Spinner helper
const Spinner = ({ className = 'w-4 h-4' }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const getStatusBadge = (status) => {
  switch (status) {
    case 'outdated':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><AlertCircle className="w-3 h-3 mr-1"/> Outdated</span>;
    case 'emerging':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1"/> Emerging</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><CheckCircle className="w-3 h-3 mr-1"/> Relevant</span>;
  }
};

export default function Curriculum() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [subjectTitle, setSubjectTitle] = useState('');
  const [subjectDescription, setSubjectDescription] = useState('');
  const [deleteSubjectId, setDeleteSubjectId] = useState(null);
  const [savingSubject, setSavingSubject] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(false);

  // Topic States
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [topicFormData, setTopicFormData] = useState({
    title: '', description: '', difficulty: 'beginner', estimatedTimeHours: 1, relevanceScore: 50
  });
  const [savingTopic, setSavingTopic] = useState(false);
  const [deleteTopicId, setDeleteTopicId] = useState(null);
  const [deletingTopic, setDeletingTopic] = useState(false);

  const { user } = useAuth();
  const isEditable = user?.role === 'admin' || user?.role === 'teacher';

  const fetchCurriculum = async () => {
    try {
      const { data } = await api.get('/curriculum/subjects');
      setSubjects(data || []);
    } catch (error) {
      toast.error('Failed to load curriculum. Please try again.');
      setSubjects([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchCurriculum();
      setLoading(false);
    };
    load();
  }, []);

  // --- Subject Handlers ---
  const handleAddSubject = () => {
    setEditingSubjectId(null);
    setSubjectTitle('');
    setSubjectDescription('');
    setIsSubjectModalOpen(true);
  };

  const handleEditSubject = (subject) => {
    setEditingSubjectId(subject._id);
    setSubjectTitle(subject.title);
    setSubjectDescription(subject.description || '');
    setIsSubjectModalOpen(true);
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!subjectTitle.trim()) return;
    setSavingSubject(true);
    try {
      if (editingSubjectId) {
        await api.put(`/curriculum/subjects/${editingSubjectId}`, { title: subjectTitle, description: subjectDescription });
        toast.success('Subject updated successfully.');
      } else {
        await api.post('/curriculum/subjects', { title: subjectTitle, description: subjectDescription || 'New subject.' });
        toast.success('Subject created as a draft.');
      }
      setIsSubjectModalOpen(false);
      setSubjectTitle('');
      setSubjectDescription('');
      fetchCurriculum();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSavingSubject(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteSubjectId) return;
    setDeletingSubject(true);
    try {
      await api.delete(`/curriculum/subjects/${deleteSubjectId}`);
      toast.success('Subject removed.');
      setDeleteSubjectId(null);
      fetchCurriculum();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete. Please try again.');
    } finally {
      setDeletingSubject(false);
    }
  };

  // --- Topic Handlers ---
  const openAddTopicModal = (subjectId) => {
    setActiveSubjectId(subjectId);
    setEditingTopicId(null);
    setTopicFormData({ title: '', description: '', difficulty: 'beginner', estimatedTimeHours: 1, relevanceScore: 50 });
    setIsTopicModalOpen(true);
  };

  const openEditTopicModal = (topic) => {
    setEditingTopicId(topic._id);
    setTopicFormData({
      title: topic.title,
      description: topic.description || '',
      difficulty: topic.difficulty || 'beginner',
      estimatedTimeHours: topic.estimatedTimeHours || 1,
      relevanceScore: topic.relevanceScore || 50
    });
    setIsTopicModalOpen(true);
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!topicFormData.title.trim()) return;
    setSavingTopic(true);
    try {
      if (editingTopicId) {
        await api.put(`/curriculum/topics/${editingTopicId}`, topicFormData);
        toast.success('Topic updated. Changes saved to draft.');
      } else {
        await api.post(`/curriculum/subjects/${activeSubjectId}/topics`, topicFormData);
        toast.success('Topic added to draft. Submit for approval when ready.');
      }
      setIsTopicModalOpen(false);
      fetchCurriculum();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSavingTopic(false);
    }
  };

  const confirmDeleteTopic = async () => {
    if (!deleteTopicId) return;
    setDeletingTopic(true);
    try {
      await api.delete(`/curriculum/topics/${deleteTopicId}`);
      toast.success('Topic removed from draft.');
      setDeleteTopicId(null);
      fetchCurriculum();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete topic.');
    } finally {
      setDeletingTopic(false);
    }
  };

  // Choose the right array based on role
  const getTopicsForSubject = (subject) => {
    if (user?.role === 'student') {
      return subject?.approvedTopics || [];
    }
    // Teacher / Admin sees draft topics (their working copy)
    return subject?.draftTopics || [];
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Spinner className="w-10 h-10 text-indigo-500" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading curriculum...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Curriculum Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === 'student' ? 'Your approved curriculum roadmap.' : 'Manage and submit curriculum for admin approval.'}
          </p>
        </div>
        {isEditable && (
          <button
            onClick={handleAddSubject}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Subject
          </button>
        )}
      </div>

      {/* Subject List */}
      <div className="space-y-6">
        {(subjects || []).length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No curriculum found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {isEditable ? 'Create a subject to get started.' : 'No approved curriculum has been published yet.'}
            </p>
          </div>
        ) : (
          (subjects || []).map((subject, sIdx) => {
            const topics = getTopicsForSubject(subject);
            return (
              <div key={subject._id} className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: `${0.15 + sIdx * 0.1}s` }}>
                {/* Subject Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{subject?.title || 'Untitled'}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{subject?.description}</p>
                  </div>
                  {isEditable && (
                    <div className="flex items-center space-x-3 ml-4 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        subject?.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        subject?.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        subject?.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>{subject?.status || 'draft'}</span>
                      <button onClick={() => handleEditSubject(subject)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Edit</button>
                      <button onClick={() => setDeleteSubjectId(subject?._id)} className="text-sm text-rose-600 dark:text-rose-400 hover:underline font-medium">Remove</button>
                    </div>
                  )}
                </div>

                {/* Add Topic Button */}
                {isEditable && subject?.status !== 'pending' && (
                  <div className="px-6 py-2.5 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-right">
                    <button
                      onClick={() => openAddTopicModal(subject?._id)}
                      className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 ml-auto"
                    >
                      <PlusCircle className="w-4 h-4" /> Add Topic
                    </button>
                  </div>
                )}
                {isEditable && subject?.status === 'pending' && (
                  <div className="px-6 py-2.5 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20 text-right">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">⏳ Pending approval — editing is locked</span>
                  </div>
                )}

                {/* Topic List */}
                <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {(Array.isArray(topics) ? topics : []).length > 0 ? (Array.isArray(topics) ? topics : []).map((topic) => (
                    <li key={topic?._id || Math.random()} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{topic?.title}</h3>
                            {getStatusBadge(topic?.status)}
                          </div>
                          {topic?.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{topic.description}</p>}
                          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {topic?.estimatedTimeHours || 0}h</span>
                            <span className="capitalize font-medium">{topic?.difficulty}</span>
                            <span>Relevance: <strong className={(topic?.relevanceScore || 0) >= 70 ? 'text-emerald-600' : (topic?.relevanceScore || 0) >= 40 ? 'text-amber-600' : 'text-rose-600'}>{topic?.relevanceScore || 0}/100</strong></span>
                          </div>
                        </div>
                        {isEditable && subject?.status !== 'pending' && (
                          <div className="ml-4 shrink-0 flex items-center gap-3">
                            <button onClick={() => openEditTopicModal(topic)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Edit</button>
                            <button onClick={() => setDeleteTopicId(topic?._id)} className="text-sm text-rose-600 dark:text-rose-400 hover:underline font-medium">Delete</button>
                          </div>
                        )}
                      </div>
                    </li>
                  )) : (
                    <li className="p-8 text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {user?.role === 'student'
                          ? 'No approved topics yet. Waiting for admin approval.'
                          : 'No draft topics yet. Click "+ Add Topic" to get started.'}
                      </p>
                    </li>
                  )}
                </ul>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !savingSubject && setIsSubjectModalOpen(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md relative z-10 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingSubjectId ? 'Edit Subject' : 'Add New Subject'}</h2>
            </div>
            <form onSubmit={handleSubjectSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject Title</label>
                <input
                  type="text" required autoFocus value={subjectTitle}
                  onChange={(e) => setSubjectTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="e.g., Introduction to Python"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea
                  value={subjectDescription} onChange={(e) => setSubjectDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="Brief description..." rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsSubjectModalOpen(false)} disabled={savingSubject} className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={savingSubject} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2">
                  {savingSubject && <Spinner />}
                  {editingSubjectId ? 'Save Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation */}
      {deleteSubjectId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !deletingSubject && setDeleteSubjectId(null)} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm relative z-10 p-6 text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><AlertCircle className="w-7 h-7" /></div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Remove Subject?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteSubjectId(null)} disabled={deletingSubject} className="px-5 py-2.5 w-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={deletingSubject} className="px-5 py-2.5 w-full text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {deletingSubject && <Spinner />}Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Topic Modal */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !savingTopic && setIsTopicModalOpen(false)} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md relative z-10 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingTopicId ? 'Edit Topic' : 'Add Topic'}</h2>
            </div>
            <form onSubmit={handleTopicSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic Title</label>
                  <input type="text" required autoFocus value={topicFormData.title}
                    onChange={(e) => setTopicFormData({...topicFormData, title: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea rows={2} value={topicFormData.description}
                    onChange={(e) => setTopicFormData({...topicFormData, description: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (Hours)</label>
                    <input type="number" min="0.5" step="0.5" required value={topicFormData.estimatedTimeHours}
                      onChange={(e) => setTopicFormData({...topicFormData, estimatedTimeHours: Number(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                    <select value={topicFormData.difficulty}
                      onChange={(e) => setTopicFormData({...topicFormData, difficulty: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Relevance Score (0–100)</label>
                  <input type="number" min="0" max="100" required value={topicFormData.relevanceScore}
                    onChange={(e) => setTopicFormData({...topicFormData, relevanceScore: Number(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsTopicModalOpen(false)} disabled={savingTopic} className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={savingTopic} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2">
                  {savingTopic && <Spinner />}
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Topic Confirmation */}
      {deleteTopicId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !deletingTopic && setDeleteTopicId(null)} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm relative z-10 p-6 text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><AlertCircle className="w-7 h-7" /></div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Topic?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This will remove the topic from your draft.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTopicId(null)} disabled={deletingTopic} className="px-5 py-2.5 w-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
              <button onClick={confirmDeleteTopic} disabled={deletingTopic} className="px-5 py-2.5 w-full text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {deletingTopic && <Spinner />}Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
