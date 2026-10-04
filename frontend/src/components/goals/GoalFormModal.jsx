import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, Coins, AlignLeft, Shield, Loader2, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  { value: 'emergency', label: 'Safety & Emergency' },
  { value: 'travel', label: 'Travel & Trips' },
  { value: 'gadgets', label: 'Tech & Gadgets' },
  { value: 'education', label: 'Education' },
  { value: 'vehicle', label: 'Vehicle & Mobility' },
  { value: 'home', label: 'Home & Living' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'other', label: 'General Savings' },
];

export default function GoalFormModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const isEditing = Boolean(initialData);

  // Tomorrow's date in YYYY-MM-DD format for min deadline attribute (EC-3.3)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateString = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    targetAmount: '',
    deadline: '',
    initialContribution: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || 'other',
        targetAmount: initialData.targetAmount || '',
        deadline: initialData.deadline ? initialData.deadline.split('T')[0] : '',
        initialContribution: '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'other',
        targetAmount: '',
        deadline: '',
        initialContribution: '',
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setError('');
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setError('Goal title must be at least 3 characters long.');
      return;
    }
    const targetNum = Number(formData.targetAmount);
    if (isNaN(targetNum) || targetNum <= 0) {
      setError('Please enter a valid target amount greater than zero.');
      return;
    }
    if (!formData.deadline) {
      setError('Please select a target deadline date in the future.');
      return;
    }
    if (new Date(formData.deadline) <= new Date()) {
      setError('Target deadline must be in the future.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      targetAmount: targetNum,
      deadline: new Date(formData.deadline).toISOString(),
    };

    if (!isEditing && formData.initialContribution) {
      const initNum = Number(formData.initialContribution);
      if (isNaN(initNum) || initNum < 0) {
        setError('Initial contribution must be a positive number or zero.');
        return;
      }
      payload.initialContribution = initNum;
    }

    setSubmitting(true);
    const result = await onSubmit(payload);
    setSubmitting(false);

    if (result && result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-950/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 border border-coffee-200/80 shadow-warm-lg space-y-6 relative max-h-[90vh] overflow-y-auto">
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
            {isEditing ? 'Update Target' : 'New Objective'}
          </span>
          <h2 className="font-serif text-2xl font-medium text-coffee-950 mt-0.5">
            {isEditing ? 'Edit Savings Goal' : 'Create a Savings Goal'}
          </h2>
          <p className="text-xs text-coffee-600 mt-1">
            Define your financial target, timeline, and category to start tracking your progress.
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
          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Goal Title *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
                <Target className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Goa Trip 2027 or MacBook Fund"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300"
                maxLength={100}
                required
              />
            </div>
          </div>

          {/* Category & Target Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="font-semibold text-coffee-800 block">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Amount */}
            <div className="space-y-1.5">
              <label className="font-semibold text-coffee-800 block">Target Amount *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400 font-semibold">
                  ₹
                </div>
                <input
                  type="number"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleChange}
                  placeholder="50000"
                  min="1"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300"
                  required
                />
              </div>
            </div>
          </div>

          {/* Target Deadline */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Target Deadline Date *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                min={minDateString}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Initial Contribution (Only on Create) */}
          {!isEditing && (
            <div className="space-y-1.5">
              <label className="font-semibold text-coffee-800 block">
                Starting Contribution (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-coffee-400 font-semibold">
                  ₹
                </div>
                <input
                  type="number"
                  name="initialContribution"
                  value={formData.initialContribution}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block">Description / Notes (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              maxLength={500}
              placeholder="Why are you saving for this? Any specifics..."
              className="w-full px-4 py-2 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-coffee-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-coffee-200 text-coffee-700 hover:bg-coffee-100 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-coffee-500 hover:bg-coffee-600 disabled:opacity-50 text-white font-semibold shadow-warm-sm transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Create Goal'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
