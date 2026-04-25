import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Image as ImageIcon, X } from 'lucide-react';
import api from '../utils/api';
import Modal, { ConfirmModal } from '../components/Modal';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';
import FormField, { inputClass } from '../components/FormField';

const EMPTY = { title: '', description: '', eventDate: '' };

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // Form State
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Files State
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [additionalPreviewUrls, setAdditionalPreviewUrls] = useState([]);
  
  // Existing Images (for edit mode)
  const [existingImages, setExistingImages] = useState([]);

  const { toasts, toast, removeToast } = useToast();

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try { setEvents((await api.get('/events')).data); }
    catch { toast({ message: 'Failed to load events', type: 'error' }); }
  };

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
    setCoverFile(null);
    setCoverPreviewUrl('');
    setAdditionalFiles([]);
    setAdditionalPreviewUrls([]);
    setExistingImages([]);
  };

  const openAdd = () => { 
    resetForm();
    setIsFormOpen(true); 
  };

  const openEdit = (event) => {
    resetForm();
    setForm({
      title: event.title,
      description: event.description,
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : ''
    });
    setEditingId(event._id);
    setCoverPreviewUrl(event.coverImage || '');
    setExistingImages(event.images || []);
    setIsFormOpen(true);
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  // Cover Image Handlers
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreviewUrl(''); // Note: If in edit mode, this just clears preview but backend won't change unless new file is uploaded or we explicitly delete it (we don't support deleting cover, only replacing)
  };

  // Additional Images Handlers
  const handleAdditionalChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Calculate total including existing
    const totalCount = existingImages.length + additionalFiles.length + files.length;
    if (totalCount > 9) {
      toast({ message: 'Maximum 9 additional images allowed (10 total including cover).', type: 'error' });
      return;
    }
    
    const newFiles = [...additionalFiles, ...files];
    setAdditionalFiles(newFiles);
    
    const newUrls = files.map(file => URL.createObjectURL(file));
    setAdditionalPreviewUrls([...additionalPreviewUrls, ...newUrls]);
  };

  const removeAdditionalFile = (index) => {
    const newFiles = [...additionalFiles];
    newFiles.splice(index, 1);
    setAdditionalFiles(newFiles);

    const newUrls = [...additionalPreviewUrls];
    newUrls.splice(index, 1);
    setAdditionalPreviewUrls(newUrls);
  };

  const removeExistingImage = (index) => {
    const newExisting = [...existingImages];
    newExisting.splice(index, 1);
    setExistingImages(newExisting);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingId && !coverFile) {
      toast({ message: 'Cover image is required for new events', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('eventDate', form.eventDate);
      
      if (editingId) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      if (coverFile) formData.append('coverImage', coverFile);
      
      additionalFiles.forEach(file => {
        formData.append('additionalImages', file);
      });

      if (editingId) {
        await api.put(`/events/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ message: 'Event updated successfully' });
      } else {
        await api.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast({ message: 'Event added successfully' });
      }
      
      setIsFormOpen(false);
      fetchEvents();
    } catch (err) { 
      toast({ message: err.response?.data?.message || 'Failed to save event', type: 'error' }); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/events/${deleteTarget._id}`);
      toast({ message: 'Event deleted' });
      setDeleteTarget(null);
      fetchEvents();
    } catch { toast({ message: 'Failed to delete', type: 'error' }); }
  };

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-700/20">
            <Calendar className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Events Management</h1>
            <p className="text-xs text-slate-500">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-purple-600">
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-[#1e293b] p-14 text-center">
          <Calendar className="mb-3 h-12 w-12 text-slate-600" />
          <p className="text-sm text-slate-400">No events yet. Add your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <div key={event._id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-[#1e293b] transition-all duration-200 hover:border-slate-600 hover:shadow-lg hover:shadow-black/20">
              {/* Preview Section */}
              <div className="w-full h-48 bg-slate-900/50 border-b border-slate-700/50 relative overflow-hidden group">
                {event.coverImage ? (
                  <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5">
                  <ImageIcon size={14} /> {event.images?.length || 0}
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-semibold text-slate-100 leading-snug">{event.title}</h3>
                <p className="text-xs text-purple-400 font-bold mb-1">
                  {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'No Date Set'}
                </p>
                <p className="mt-1.5 line-clamp-3 text-xs text-slate-400 leading-relaxed">{event.description}</p>
                <div className="mt-3 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Added on {new Date(event.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-slate-700/50 px-5 py-3">
                <button onClick={() => openEdit(event)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white">
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => setDeleteTarget(event)} title="Delete"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-900/30 text-red-400 transition-colors hover:bg-red-900/60 hover:text-red-300">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? "Edit Event" : "Add Event"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Event Title">
            <input required type="text" className={inputClass} placeholder="Annual Forensic Conference 2026" value={form.title} onChange={set('title')} />
          </FormField>
          
          <FormField label="Event Date">
            <input required type="date" className={inputClass} value={form.eventDate} onChange={set('eventDate')} />
          </FormField>

          <FormField label="Description">
            <textarea required rows={4} className={inputClass} placeholder="Details about the event..." value={form.description} onChange={set('description')} />
          </FormField>
          
          <div className="space-y-4 border-t border-slate-700/50 pt-4">
            
            {/* Cover Image Input */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cover Image (Required)
              </label>
              {!coverPreviewUrl ? (
                <input 
                  type="file" 
                  accept="image/*"
                  required={!editingId}
                  onChange={handleCoverChange}
                  className="w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-900/30 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-purple-400 hover:file:bg-purple-900/50 cursor-pointer" 
                />
              ) : (
                <div className="relative group w-full max-w-[200px] aspect-video rounded-lg overflow-hidden border border-slate-600">
                  <img src={coverPreviewUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={removeCover} className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="text-red-400 mb-1" size={20} />
                    <span className="text-white text-xs font-semibold">Change Cover</span>
                  </button>
                </div>
              )}
            </div>

            {/* Additional Images Input */}
            <div className="border-t border-slate-700/50 pt-4">
              <label className="mb-1 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>Additional Images</span>
                <span className="text-purple-400">{existingImages.length + additionalFiles.length}/9 Max</span>
              </label>
              
              <input 
                type="file" 
                multiple
                accept="image/*"
                onChange={handleAdditionalChange}
                disabled={(existingImages.length + additionalFiles.length) >= 9}
                className="w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-300 hover:file:bg-slate-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              
              {/* Live Preview Grid for Additional Images */}
              {(existingImages.length > 0 || additionalPreviewUrls.length > 0) && (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    
                    {/* Existing Images */}
                    {existingImages.map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-700">
                        <img src={url} alt={`Existing ${idx+1}`} className="w-full h-full object-cover opacity-80" />
                        <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {/* New Uploads Preview */}
                    {additionalPreviewUrls.map((url, idx) => (
                      <div key={`new-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-green-700/50">
                        <img src={url} alt={`New Preview ${idx+1}`} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 w-full bg-green-600/90 text-white text-[9px] font-bold py-0.5 text-center uppercase tracking-widest">New</div>
                        <button type="button" onClick={() => removeAdditionalFile(idx)} className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
          
          <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
            <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={saving || (existingImages.length + additionalFiles.length) > 9} className="rounded-lg bg-purple-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-600 disabled:opacity-50">
              {saving ? 'Saving...' : editingId ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Event" message={`Delete "${deleteTarget?.title}"? This will remove all associated images. This cannot be undone.`} />
    </div>
  );
}
