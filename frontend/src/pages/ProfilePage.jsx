import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Coins, Wallet, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    currencyPreference: user?.currencyPreference || 'INR',
    monthlyIncome: user?.monthlyIncome || '',
    savingsConstraints: user?.savingsConstraints || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    clearError();
    setSuccessMessage('');
    setLocalError('');
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setLocalError('');

    const payload = {
      currencyPreference: formData.currencyPreference,
      monthlyIncome: formData.monthlyIncome === '' ? null : Number(formData.monthlyIncome),
      savingsConstraints: formData.savingsConstraints.trim() || null,
    };

    if (payload.monthlyIncome !== null && (isNaN(payload.monthlyIncome) || payload.monthlyIncome < 0)) {
      setLocalError('Monthly income must be a valid positive number.');
      return;
    }

    setSubmitting(true);
    const result = await updateProfile(payload);
    setSubmitting(false);

    if (result.success) {
      setSuccessMessage('Your financial profile has been successfully updated.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="border-b border-coffee-200/80 pb-6">
        <span className="text-xs font-bold tracking-widest text-coffee-500 uppercase">
          Account & Preferences
        </span>
        <h1 className="font-serif text-3xl font-medium text-coffee-950 mt-1">
          Financial Profile
        </h1>
        <p className="text-xs text-coffee-600 mt-1">
          Configure your financial context so the Gemini AI advisor can calibrate realistic savings roadmaps.
        </p>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4 text-xs text-sage-800 flex items-center gap-2.5">
          <Check className="w-4 h-4 text-sage-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {(localError || authError) && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{localError || authError}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-8 border border-coffee-200/80 shadow-warm-sm space-y-6">
        {/* User Identity Info */}
        <div className="flex items-center gap-4 pb-6 border-b border-coffee-200/70">
          <div className="w-14 h-14 rounded-full bg-coffee-900 border border-coffee-500/40 flex items-center justify-center text-coffee-100 font-serif font-bold text-2xl shadow-warm-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="space-y-0.5">
            <h3 className="font-serif text-xl font-medium text-coffee-950">{user?.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-coffee-600">
              <Mail className="w-3.5 h-3.5 text-coffee-400" />
              <span>{user?.email}</span>
            </div>
            <p className="text-[11px] text-coffee-400">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '2026'}
            </p>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Currency Preference */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-coffee-500" />
              <span>Display Currency</span>
            </label>
            <select
              name="currencyPreference"
              value={formData.currencyPreference}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition"
            >
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
            </select>
          </div>

          {/* Monthly Income */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-coffee-500" />
              <span>Estimated Monthly Income (Optional)</span>
            </label>
            <input
              type="number"
              name="monthlyIncome"
              value={formData.monthlyIncome}
              onChange={handleChange}
              placeholder="e.g. 50000"
              min="0"
              className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300"
            />
            <p className="text-[11px] text-coffee-500 italic">
              Used strictly by Gemini AI to assess goal feasibility without making unrealistic savings recommendations.
            </p>
          </div>

          {/* Savings Constraints Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-coffee-800 block flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-coffee-500" />
              <span>Fixed Expenses / Savings Constraints (Optional)</span>
            </label>
            <textarea
              name="savingsConstraints"
              value={formData.savingsConstraints}
              onChange={handleChange}
              rows="3"
              maxLength="300"
              placeholder="e.g. Fixed rent ₹15,000/mo, annual bonus in December..."
              className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 text-coffee-950 bg-coffee-50/40 transition placeholder:text-coffee-300 resize-none"
            />
            <div className="flex justify-between text-[11px] text-coffee-400">
              <span>Guidance for AI roadmap generation.</span>
              <span>{formData.savingsConstraints.length} / 300</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-coffee-500 hover:bg-coffee-600 disabled:opacity-50 text-white rounded-xl font-semibold shadow-warm-sm hover:shadow-warm-md transition flex items-center justify-center gap-2 mt-4"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <span>Save Financial Preferences</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
