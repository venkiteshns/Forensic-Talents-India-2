import { useState, useEffect } from 'react';
import { Gamepad2, Plus, Trash2, PlayCircle, UploadCloud, GripHorizontal } from 'lucide-react';
import api from '../utils/api';
import AlertMessage from '../components/AlertMessage';
import { ConfirmModal } from '../components/Modal';

export default function MatchingManagement() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [useIcons, setUseIcons] = useState(true);
  const [files, setFiles] = useState([]); // File objects
  const [previewUrls, setPreviewUrls] = useState([]); // URLs for preview
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
      const res = await api.get('/matching/admin/all');
      setSets(res.data);
    } catch (err) {
      console.error('Failed to load matching sets', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files);
    
    // Validate images
    const validFiles = selected.filter(f => f.type.startsWith('image/'));
    if (validFiles.length !== selected.length) {
      setErrorMsg('Some files were rejected because they are not valid images.');
    } else {
      setErrorMsg('');
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      const urls = validFiles.map(f => URL.createObjectURL(f));
      setPreviewUrls(prev => [...prev, ...urls]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSet = async (e) => {
    e.preventDefault();
    
    if (!useIcons && files.length < 4) {
      setErrorMsg(`Please upload at least 4 images for the matching game. (You have ${files.length})`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let uploadedImages = [];

      if (!useIcons && files.length > 0) {
        // Upload all files concurrently
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await api.post('/upload', formData);
          return uploadRes.data.url;
        });

        uploadedImages = await Promise.all(uploadPromises);
      }

      await api.post('/matching', { 
        useIcons, 
        images: uploadedImages, 
        isActive 
      });
      
      setFiles([]);
      setPreviewUrls([]);
      setUseIcons(true);
      setIsActive(true);
      setSuccessMsg('Matching game created successfully!');
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
      await api.put(`/matching/${id}`, { 
        useIcons: targetSet.useIcons, 
        images: targetSet.images, 
        isActive: true 
      });
      fetchSets();
    } catch (err) {
      console.error(err);
      fetchSets();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/matching/${deleteTarget}`);
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
            <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-400">
              <Gamepad2 className="w-8 h-8" />
            </div>
            Matching Game Management
          </h1>
          <p className="mt-2 text-slate-400 font-medium">Create memory card sets using predefined forensic icons or custom uploaded images.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ADD NEW SET FORM */}
        <div className="lg:col-span-1">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-xl sticky top-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="text-emerald-400" /> Create New Set
            </h2>

            <form onSubmit={handleAddSet} className="space-y-6">
              <AlertMessage message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
              <AlertMessage message={successMsg} type="success" onClose={() => setSuccessMsg('')} />

              {/* Toggle Input Mode */}
              <div className="bg-[#0f172a] p-2 rounded-xl flex items-center border border-slate-700">
                <button
                  type="button"
                  onClick={() => setUseIcons(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    useIcons ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Use Forensic Icons
                </button>
                <button
                  type="button"
                  onClick={() => setUseIcons(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    !useIcons ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload Images
                </button>
              </div>

              {/* Dynamic Input Area */}
              {useIcons ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                  <GripHorizontal className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
                  <h3 className="text-emerald-300 font-bold mb-2">Default Icons Mode</h3>
                  <p className="text-sm text-emerald-200/70">
                    This set will use the predefined high-quality forensic SVG icons (DNA, Fingerprints, Microscope, etc.). No uploads required.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-300">
                    Upload Custom Images (Min 4)
                  </label>
                  
                  <div className="relative border-2 border-dashed border-slate-600 bg-[#0f172a] hover:bg-slate-800 transition-colors p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleFilesChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-10 h-10 text-slate-500 mb-2 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-slate-400 font-medium text-sm">Select multiple images</span>
                  </div>

                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                          <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {previewUrls.length > 0 && previewUrls.length < 4 && (
                    <p className="text-xs text-amber-400 font-medium mt-1">
                      You need at least {4 - previewUrls.length} more image(s).
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 bg-[#0f172a] p-4 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-[#1e293b] text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-300 cursor-pointer">
                  Set as Active Match Game
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || (!useIcons && files.length < 4)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Saving...' : 'Save Matching Game'}
              </button>
            </form>
          </div>
        </div>

        {/* LIST OF SETS */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-white mb-6">Saved Sets</h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading matching sets...</div>
          ) : sets.length === 0 ? (
            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-12 text-center text-slate-400 border-dashed">
              <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No matching games created yet.</p>
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

                  {set.useIcons ? (
                    <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-700 flex items-center justify-center gap-2 text-slate-400 text-sm font-medium">
                      <GripHorizontal className="w-5 h-5" /> Default SVG Icons
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-slate-400 mb-2">Custom Images ({set.images?.length || 0})</p>
                      <div className="flex flex-wrap gap-2">
                        {set.images?.slice(0, 5).map((img, idx) => (
                          <div key={idx} className="w-10 h-10 rounded border border-slate-600 overflow-hidden bg-slate-800">
                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {set.images?.length > 5 && (
                          <div className="w-10 h-10 rounded border border-slate-600 bg-[#0f172a] flex items-center justify-center text-xs text-slate-400 font-bold">
                            +{set.images.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
        title="Delete Matching Game" 
        message="Are you sure you want to delete this matching game? This cannot be undone." 
      />
    </div>
  );
}
