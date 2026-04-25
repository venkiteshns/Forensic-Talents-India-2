import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, CheckCircle, XCircle, Star } from 'lucide-react';
import api from '../utils/api';
import { ConfirmModal } from '../components/Modal';
import Toast from '../components/Toast';
import { useToast } from '../components/useToast';

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toasts, toast, removeToast } = useToast();

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try { setReviews((await api.get('/admin/reviews')).data); }
    catch { toast({ message: 'Failed to load reviews', type: 'error' }); }
  };

  const toggleApproval = async (review) => {
    try {
      await api.put(`/reviews/${review._id}/approve`);
      toast({ message: `Review ${review.isApproved ? 'unapproved' : 'approved'}` });
      fetchReviews();
    } catch {
      toast({ message: 'Failed to update approval status', type: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/reviews/${deleteTarget._id}`);
      toast({ message: 'Review deleted' });
      setDeleteTarget(null);
      fetchReviews();
    } catch { toast({ message: 'Failed to delete', type: 'error' }); }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={14} className={i < rating ? "text-amber-400 fill-amber-400" : "text-slate-600"} />
    ));
  };

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700/20">
            <MessageSquare className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Reviews Management</h1>
            <p className="text-xs text-slate-500">{reviews.length} review{reviews.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-[#1e293b] p-14 text-center">
          <MessageSquare className="mb-3 h-12 w-12 text-slate-600" />
          <p className="text-sm text-slate-400">No reviews yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map(review => (
            <div key={review._id} className={`flex flex-col rounded-2xl border ${review.isApproved ? 'border-teal-700/30' : 'border-amber-700/30'} bg-[#1e293b] transition-all duration-200 hover:border-slate-600 hover:shadow-lg hover:shadow-black/20 overflow-hidden`}>
              {/* Header */}
              <div className={`flex items-center justify-between px-5 py-3.5 ${review.isApproved ? 'bg-teal-900/20' : 'bg-amber-900/20'}`}>
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-sm ${review.isApproved ? 'bg-teal-600' : 'bg-amber-600'}`}>
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{review.name}</p>
                    <p className="text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {renderStars(review.rating)}
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs text-slate-500 mb-2">{review.email}</p>
                <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-slate-600 pl-3 py-1">"{review.review}"</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-slate-700/50 px-5 py-3 bg-slate-900/30">
                <button 
                  onClick={() => toggleApproval(review)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${review.isApproved ? 'bg-amber-900/40 text-amber-400 hover:bg-amber-900/60' : 'bg-teal-900/40 text-teal-400 hover:bg-teal-900/60'}`}
                >
                  {review.isApproved ? (
                    <><XCircle size={14} /> Unapprove</>
                  ) : (
                    <><CheckCircle size={14} /> Approve</>
                  )}
                </button>
                <button onClick={() => setDeleteTarget(review)} title="Delete"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-900/30 text-red-400 transition-colors hover:bg-red-900/60 hover:text-red-300">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Review" message={`Delete review from "${deleteTarget?.name}"? This cannot be undone.`} />
    </div>
  );
}
