import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Loader2, Mail } from 'lucide-react';

/**
 * AddMemberModal Component (FR-07, EC-6.1 - EC-6.3)
 * Modal form allowing the group owner to invite registered users by email.
 */
export default function AddMemberModal({ isOpen, onClose, onAddMember }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid user email address.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await onAddMember(email.trim());
    setLoading(false);

    if (result.success) {
      setEmail('');
      onClose();
    } else {
      setError(result.error || 'Failed to add member to the group.');
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-950/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-coffee-200/80 shadow-warm-lg space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-coffee-200/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-coffee-100 flex items-center justify-center text-coffee-700">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-coffee-950">Invite Group Member</h3>
              <p className="text-[11px] text-coffee-500">Add a registered SaveBuddy user to this goal.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-xl text-coffee-400 hover:text-coffee-700 hover:bg-coffee-50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert (EC-6.1, EC-6.2, EC-6.3) */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-coffee-700 block mb-1.5">
              User Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-coffee-200 bg-white text-coffee-950 placeholder-coffee-400 focus:outline-none focus:ring-2 focus:ring-coffee-500/20 focus:border-coffee-500 transition"
              />
            </div>
            <p className="text-[10px] text-coffee-500 mt-1.5">
              The user must already have a registered SaveBuddy account.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-coffee-700 hover:bg-coffee-50 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-coffee-500 hover:bg-coffee-600 disabled:opacity-50 rounded-xl shadow-warm-sm transition flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Inviting...</span>
                </>
              ) : (
                <span>Add Member</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
