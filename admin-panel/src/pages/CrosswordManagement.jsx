import { useState, useEffect } from 'react';
import { Gamepad2, Plus, Trash2, PlayCircle, Edit2 } from 'lucide-react';
import api from '../utils/api';
import AlertMessage from '../components/AlertMessage';
import { ConfirmModal } from '../components/Modal';

export default function CrosswordManagement() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [wordPairs, setWordPairs] = useState([{ word: '', clue: '' }]);
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
      const res = await api.get('/crossword/admin/all');
      setSets(res.data);
    } catch (err) {
      console.error('Failed to load crossword sets', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPair = () => {
    setWordPairs([...wordPairs, { word: '', clue: '' }]);
  };

  const handleRemovePair = (index) => {
    if (wordPairs.length > 1) {
      const newPairs = [...wordPairs];
      newPairs.splice(index, 1);
      setWordPairs(newPairs);
    }
  };

  const handleChange = (index, field, value) => {
    const newPairs = [...wordPairs];
    if (field === 'word') {
      newPairs[index][field] = value.toUpperCase().replace(/[^A-Z]/g, '');
    } else {
      newPairs[index][field] = value;
    }
    setWordPairs(newPairs);
  };

  const handleAddSet = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Validate
      const uniqueWords = new Set();
      const validPairs = [];

      for (let i = 0; i < wordPairs.length; i++) {
        const { word, clue } = wordPairs[i];
        if (!word || !clue) continue;

        if (word.length < 3) throw new Error(`Word "${word}" must be at least 3 characters long.`);
        if (uniqueWords.has(word)) throw new Error(`Duplicate word found: "${word}".`);
        
        uniqueWords.add(word);
        validPairs.push({ word, clue });
      }

      if (validPairs.length < 3) throw new Error("Please provide at least 3 valid word/clue pairs.");

      if (editTargetId) {
        await api.put(`/crossword/${editTargetId}`, { words: validPairs, isActive });
        setSuccessMsg('Crossword updated successfully!');
        setEditTargetId(null);
      } else {
        await api.post('/crossword', { words: validPairs, isActive });
        setSuccessMsg('Crossword created successfully!');
      }
      
      setWordPairs([{ word: '', clue: '' }]);
      setIsActive(true);
      fetchSets();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || (editTargetId ? 'Failed to update set' : 'Failed to create set'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (set) => {
    setWordPairs(set.words.length > 0 ? set.words : [{ word: '', clue: '' }]);
    setIsActive(set.isActive);
    setEditTargetId(set._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActive = async (id, currentActive) => {
    if (currentActive) return; 
    
    setSets(sets.map(s => ({
      ...s,
      isActive: s._id === id ? true : false
    })));

    try {
      const targetSet = sets.find(s => s._id === id);
      await api.put(`/crossword/${id}`, { words: targetSet.words, isActive: true });
      fetchSets();
    } catch (err) {
      console.error(err);
      fetchSets();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/crossword/${deleteTarget}`);
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
            <div className="p-2 bg-purple-600/20 rounded-lg text-purple-400">
              <Gamepad2 className="w-8 h-8" />
            </div>
            Crossword Management
          </h1>
          <p className="mt-2 text-slate-400 font-medium">Create and manage clues for the Crossword puzzle.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ADD NEW SET FORM */}
        <div className="lg:col-span-1">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-xl sticky top-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              {editTargetId ? <Edit2 className="text-purple-400" /> : <Plus className="text-purple-400" />} 
              {editTargetId ? 'Edit Crossword' : 'Create New Crossword'}
            </h2>

            <form onSubmit={handleAddSet} className="space-y-5">
              <AlertMessage message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
              <AlertMessage message={successMsg} type="success" onClose={() => setSuccessMsg('')} />

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {wordPairs.map((pair, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-[#0f172a] p-3 rounded-xl border border-slate-700">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={pair.word}
                        onChange={(e) => handleChange(idx, 'word', e.target.value)}
                        placeholder="WORD (e.g. DNA)"
                        className="w-full bg-[#1e293b] border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 uppercase"
                        required
                      />
                      <input
                        type="text"
                        value={pair.clue}
                        onChange={(e) => handleChange(idx, 'clue', e.target.value)}
                        placeholder="Clue for this word..."
                        className="w-full bg-[#1e293b] border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                    {wordPairs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePair(idx)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddPair}
                className="w-full py-2.5 border border-dashed border-slate-600 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Word & Clue
              </button>

              <div className="flex items-center gap-3 bg-[#0f172a] p-4 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-[#1e293b] text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-300 cursor-pointer">
                  Set as Active Crossword immediately
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-purple-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Saving...' : (editTargetId ? 'Update Crossword' : 'Save Crossword')}
                </button>
                
                {editTargetId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditTargetId(null);
                      setWordPairs([{ word: '', clue: '' }]);
                      setIsActive(true);
                    }}
                    className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* LIST OF SETS */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-white mb-6">Saved Crosswords</h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading crosswords...</div>
          ) : sets.length === 0 ? (
            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-12 text-center text-slate-400 border-dashed">
              <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No crosswords created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sets.map(set => (
                <div 
                  key={set._id} 
                  className={`bg-[#1e293b] rounded-2xl border transition-all p-5 shadow-lg flex flex-col ${
                    set.isActive ? 'border-green-500/50 ring-1 ring-green-500/20' : 'border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      {set.isActive ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20 uppercase tracking-wide">
                          <PlayCircle className="w-3.5 h-3.5" /> Active
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
                        className="p-1.5 text-slate-500 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors"
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

                  <div className="mt-auto pt-2 text-sm font-medium text-slate-400">
                    Contains <strong className="text-white">{set.words?.length || 0}</strong> words & clues.
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
        title="Delete Crossword" 
        message="Are you sure you want to delete this crossword? This cannot be undone." 
      />
    </div>
  );
}
