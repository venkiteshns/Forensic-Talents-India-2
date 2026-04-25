import { useState, useEffect } from 'react';
import { Gamepad2, Plus, Trash2, CheckCircle, XCircle, AlertTriangle, PlayCircle, Edit2, X } from 'lucide-react';
import api from '../utils/api';
import AlertMessage from '../components/AlertMessage';
import { ConfirmModal } from '../components/Modal';

export default function WordSearchManagement() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [wordInput, setWordInput] = useState('');
  const [words, setWords] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      const res = await api.get('/word-search/admin/all');
      setSets(res.data);
    } catch (err) {
      console.error('Failed to load word sets', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = (e) => {
    e.preventDefault();
    const value = wordInput.trim().toUpperCase();

    if (!/^[A-Z]{3,15}$/.test(value)) {
      setErrorMsg('Word must be 3-15 letters long and contain only letters.');
      return;
    }
    if (words.includes(value)) {
      setErrorMsg('Word is already added.');
      return;
    }
    if (words.length >= 15) {
      setErrorMsg('Maximum of 15 words allowed.');
      return;
    }

    setWords([...words, value]);
    setWordInput('');
    setErrorMsg('');
  };

  const handleRemoveWord = (wordToRemove) => {
    setWords(words.filter(w => w !== wordToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (wordInput.trim()) {
        handleAddWord(e);
      } else {
        handleAddSet(e); // Allow enter to submit form if input is empty
      }
    }
  };

  const handleAddSet = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (words.length < 5) {
        throw new Error(`Please provide at least 5 words. (You provided ${words.length})`);
      }

      if (editTargetId) {
        await api.put(`/word-search/${editTargetId}`, { words, isActive });
        setSuccessMsg('Puzzle Set updated successfully!');
        setEditTargetId(null);
      } else {
        await api.post('/word-search', { words, isActive });
        setSuccessMsg('Puzzle Set created successfully!');
      }
      
      setWords([]);
      setWordInput('');
      setIsActive(true);
      fetchSets();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || (editTargetId ? 'Failed to update set' : 'Failed to create set'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (set) => {
    setWords(set.words || []);
    setWordInput('');
    setIsActive(set.isActive);
    setEditTargetId(set._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActive = async (id, currentActive) => {
    if (currentActive) return; // Already active, do nothing
    
    // Optimistic UI update
    setSets(sets.map(s => ({
      ...s,
      isActive: s._id === id ? true : false
    })));

    try {
      const targetSet = sets.find(s => s._id === id);
      await api.put(`/word-search/${id}`, { words: targetSet.words, isActive: true });
      fetchSets();
    } catch (err) {
      console.error(err);
      fetchSets(); // Revert on failure
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/word-search/${deleteTarget}`);
      setSets(sets.filter(s => s._id !== deleteTarget));
    } catch (err) {
      console.error('Failed to delete', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-700/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
              <Gamepad2 className="w-8 h-8" />
            </div>
            Word Search Puzzles
          </h1>
          <p className="mt-2 text-slate-400 font-medium">Create and manage word sets for the interactive game.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ADD NEW SET FORM */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-xl sticky top-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              {editTargetId ? <Edit2 className="text-blue-400" /> : <Plus className="text-blue-400" />} 
              {editTargetId ? 'Edit Set' : 'Create New Set'}
            </h2>

            <form onSubmit={handleAddSet} className="space-y-5">
              <AlertMessage message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
              <AlertMessage message={successMsg} type="success" onClose={() => setSuccessMsg('')} />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-300">
                    Target Words
                  </label>
                  <span className="text-xs font-medium text-slate-400">
                    {words.length} / 15 words added
                  </span>
                </div>
                
                <div className="flex flex-col xl:flex-row gap-2 mb-3 w-full">
                  <input
                    type="text"
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a word (A-Z)"
                    disabled={words.length >= 15}
                    className="flex-1 min-w-0 bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddWord}
                    disabled={!wordInput.trim() || words.length >= 15 || wordInput.length < 3}
                    className="shrink-0 whitespace-nowrap w-full xl:w-auto bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[100px] bg-[#0f172a] border border-slate-700 rounded-xl p-4">
                  {words.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-medium">
                      No words added yet. Add at least 5 words.
                    </div>
                  ) : (
                    words.map((word, idx) => (
                      <span 
                        key={idx} 
                        className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-lg bg-blue-600/20 text-blue-300 text-sm font-semibold border border-blue-500/20 animate-in fade-in zoom-in-95 duration-200"
                      >
                        {word}
                        <button
                          type="button"
                          onClick={() => handleRemoveWord(word)}
                          className="p-1 hover:bg-blue-500/20 rounded-md transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 font-medium">
                  <span>• Min 5, Max 15 words</span>
                  <span>• 3-15 chars per word</span>
                  <span>• Only letters allowed</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#0f172a] p-4 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-[#1e293b] text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-300 cursor-pointer">
                  Set as Active Puzzle immediately
                </label>
              </div>

              <div className="flex flex-col xl:flex-row gap-3 w-full">
                <button
                  type="submit"
                  disabled={submitting || words.length < 5}
                  className="w-full xl:flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Saving...' : (editTargetId ? 'Update Word Search' : 'Save Word Search')}
                </button>
                
                {editTargetId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditTargetId(null);
                      setWords([]);
                      setWordInput('');
                      setIsActive(true);
                    }}
                    className="w-full xl:w-auto px-6 py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors shrink-0"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* LIST OF SETS */}
        <div className="flex-1 min-w-0 space-y-4">
          <h2 className="text-xl font-bold text-white mb-6">Saved Puzzle Sets</h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading puzzles...</div>
          ) : sets.length === 0 ? (
            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-12 text-center text-slate-400 border-dashed">
              <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No puzzle sets created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sets.map(set => (
                <div 
                  key={set._id} 
                  className={`bg-[#1e293b] rounded-2xl border transition-all p-5 shadow-lg ${
                    set.isActive ? 'border-green-500/50 ring-1 ring-green-500/20' : 'border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      {set.isActive ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20 uppercase tracking-wide">
                          <PlayCircle className="w-3.5 h-3.5" /> Active Game
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700 uppercase tracking-wide">
                          Inactive
                        </span>
                      )}
                      <span className="text-xs font-medium text-slate-500">
                        {new Date(set.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!set.isActive && (
                        <button
                          onClick={() => handleToggleActive(set._id, set.isActive)}
                          className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
                        >
                          Make Active
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(set)}
                        className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="Edit set"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(set._id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete set"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {set.words.map((word, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 rounded-lg bg-[#0f172a] text-slate-300 text-sm font-semibold border border-slate-700"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-xs font-medium text-slate-500">
                    Total words: <span className="text-slate-300">{set.words.length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <ConfirmModal 
        isOpen={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        onConfirm={handleDelete} 
        title="Delete Word Search Set" 
        message="Are you sure you want to delete this word set? This cannot be undone." 
      />
    </div>
  );
}
