import { useState, useEffect } from 'react';
import { Gamepad2, Plus, Trash2, PlayCircle, Image as ImageIcon, UploadCloud } from 'lucide-react';
import api from '../utils/api';
import AlertMessage from '../components/AlertMessage';
import { ConfirmModal } from '../components/Modal';

export default function JigsawManagement() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      const res = await api.get('/jigsaw/admin/all');
      setSets(res.data);
    } catch (err) {
      console.error('Failed to load jigsaw sets', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        setErrorMsg('Please select a valid image file.');
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setErrorMsg('');
    }
  };

  const handleAddSet = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select an image to upload.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Upload Image
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/upload', formData);
      const imageUrl = uploadRes.data.url;

      if (!imageUrl) throw new Error('Image upload failed.');

      // 2. Save Jigsaw
      await api.post('/jigsaw', { imageUrl, isActive });
      
      setFile(null);
      setPreviewUrl('');
      setIsActive(true);
      setSuccessMsg('Jigsaw puzzle created successfully!');
      fetchSets();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create set');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    if (currentActive) return; 
    
    setSets(sets.map(s => ({
      ...s,
      isActive: s._id === id ? true : false
    })));

    try {
      const targetSet = sets.find(s => s._id === id);
      await api.put(`/jigsaw/${id}`, { imageUrl: targetSet.imageUrl, isActive: true });
      fetchSets();
    } catch (err) {
      console.error(err);
      fetchSets();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/jigsaw/${deleteTarget}`);
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
            <div className="p-2 bg-amber-600/20 rounded-lg text-amber-400">
              <Gamepad2 className="w-8 h-8" />
            </div>
            Jigsaw Management
          </h1>
          <p className="mt-2 text-slate-400 font-medium">Upload images to be split into jigsaw puzzles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ADD NEW SET FORM */}
        <div className="lg:col-span-1">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-xl sticky top-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="text-amber-400" /> Create New Jigsaw
            </h2>

            <form onSubmit={handleAddSet} className="space-y-5">
              <AlertMessage message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
              <AlertMessage message={successMsg} type="success" onClose={() => setSuccessMsg('')} />

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Puzzle Image
                </label>
                
                {previewUrl ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-slate-700 bg-[#f5f5f5] mb-3 group flex items-center justify-center">
                    <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button" 
                        onClick={() => { setFile(null); setPreviewUrl(''); }}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video rounded-xl border-2 border-dashed border-slate-600 bg-[#0f172a] hover:bg-slate-800 transition-colors mb-3 flex flex-col items-center justify-center cursor-pointer group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-10 h-10 text-slate-500 mb-2 group-hover:text-amber-400 transition-colors" />
                    <span className="text-slate-400 font-medium text-sm">Click or drag image to upload</span>
                    <span className="text-slate-500 text-xs mt-1">Preferably 16:9 aspect ratio</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 bg-[#0f172a] p-4 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-[#1e293b] text-amber-600 focus:ring-amber-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-300 cursor-pointer">
                  Set as Active Puzzle immediately
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !file}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-amber-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Uploading & Saving...' : 'Upload & Save Jigsaw'}
              </button>
            </form>
          </div>
        </div>

        {/* LIST OF SETS */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-white mb-6">Saved Jigsaws</h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading jigsaws...</div>
          ) : sets.length === 0 ? (
            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-12 text-center text-slate-400 border-dashed">
              <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No jigsaws created yet.</p>
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
                        onClick={() => setDeleteTarget(set._id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete set"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-[#f5f5f5] border border-slate-700 mt-2 flex items-center justify-center">
                    <img src={set.imageUrl} alt="Jigsaw Preview" className="max-w-full max-h-full object-contain" />
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
        title="Delete Jigsaw Puzzle" 
        message="Are you sure you want to delete this jigsaw puzzle? This cannot be undone." 
      />
    </div>
  );
}
