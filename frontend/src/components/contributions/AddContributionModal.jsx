import React, { useState } from 'react';
import { X, Plus, Calendar, AlignLeft, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

export default function AddContributionModal({ isOpen, onClose, onSubmit, goal, currency = 'INR' }) {
  if (!isOpen || !goal) return null;

  const todayString = new Date().toISOString().split('T')[0];

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayString);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const numAmount = Number(amount) || 0;
  const newProjectedTotal = (goal.currentAmount || 0) + numAmount;
  const newProjectedProgress = goal.targetAmount > 0
    ? Math.min(100, Math.round((newProjectedTotal / goal.targetAmount) * 100))
    : 0;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleAddPreset = (val) => {
    setError('');
    setAmount((prev) => {
      const currentVal = Number(prev) || 0;
      return (currentVal + val).toString();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid contribution amount greater than zero.');
      return;
    }

    if (!date) {
      setError('Please select a valid contribution date.');
      return;
    }

    const payload = {
      amount: val,
      date: new Date(date).toISOString(),
      note: note.trim(),
    };

    setSubmitting(true);
    const result = await onSubmit(payload);
    setSubmitting(false);

    if (result && result.error) {
      setError(result.error);
    } else {
      setAmount('');
      setNote('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-950/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-coffee-200/80 shadow-warm-lg space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-coffee-400 hover:text-coffee-700 transition p-1 rounded-full hover:bg-coffee-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <span className="text-[11px] font-bold tracking-widest text-coffee-500 uppercase">
            Record Deposit
          </span>
          <h2 className="font-serif text-2xl font-medium text-coffee-950 mt-0.5">
            Add Contribution
          </h2>
          <p className="text-xs text-coffee-600 mt-1">
            Contributing to <strong className="text-coffee-900">{goal.title}</strong>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block text-[11px] uppercase tracking-wider">
              Quick Add Presets
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="py-1.5 px-2 bg-coffee-50 hover:bg-coffee-100 text-coffee-800 font-semibold rounded-xl border border-coffee-200/70 transition text-center shadow-xs"
                >
                  +{formatCurrency(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Field */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Contribution Amount *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-500 font-semibold text-sm">
                ₹
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setError('');
                  setAmount(e.target.value);
                }}
                placeholder="e.g. 2000"
                min="1"
                step="any"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 font-bold text-base bg-coffee-50/40 transition placeholder:text-coffee-300"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Live Dynamic Projection Preview */}
          {numAmount > 0 && (
            <div className="p-3.5 rounded-2xl bg-sage-50/70 border border-sage-200/60 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex justify-between text-sage-800 font-semibold">
                <span>Projected New Balance:</span>
                <span>{formatCurrency(newProjectedTotal)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-sage-700">
                <span>New Progress Pace:</span>
                <span>{newProjectedProgress}% of target</span>
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Contribution Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={date}
                max={todayString}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Note / Memo */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Note / Memo (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 pt-3 pointer-events-none text-coffee-400">
                <AlignLeft className="w-4 h-4" />
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="2"
                maxLength={200}
                placeholder="e.g. October savings transfer, freelance bonus..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300 resize-none"
              />
            </div>
            <div className="text-right text-[10px] text-coffee-400">
              {note.length} / 200
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-coffee-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-coffee-200 text-coffee-700 hover:bg-coffee-100 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || numAmount <= 0}
              className="px-6 py-2.5 rounded-xl bg-coffee-500 hover:bg-coffee-600 disabled:opacity-50 text-white font-semibold shadow-warm-sm transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging Deposit...</span>
                </>
              ) : (
                <span>Confirm Contribution</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
