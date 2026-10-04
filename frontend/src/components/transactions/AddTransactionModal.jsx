import React, { useState, useEffect } from 'react';
import { X, Plus, DollarSign, Tag, Calendar, FileText, ArrowDownLeft, ArrowUpRight, Target, Loader2 } from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = {
  income: [
    { id: 'salary', label: 'Salary & Wages' },
    { id: 'freelance', label: 'Freelance & Consulting' },
    { id: 'investment', label: 'Investments & Dividends' },
    { id: 'gift', label: 'Gifts & Allowance' },
    { id: 'other_income', label: 'Other Inflow' },
  ],
  expense: [
    { id: 'food', label: 'Food & Dining' },
    { id: 'rent', label: 'Rent & Housing' },
    { id: 'utilities', label: 'Utilities & Bills' },
    { id: 'shopping', label: 'Shopping & Retail' },
    { id: 'transport', label: 'Transportation & Fuel' },
    { id: 'entertainment', label: 'Entertainment & Leisure' },
    { id: 'health', label: 'Health & Medical' },
    { id: 'other_expense', label: 'Other Expense' },
  ],
  contribution: [
    { id: 'savings', label: 'Savings Goal Allocation' },
    { id: 'emergency', label: 'Emergency Fund' },
  ],
};

export default function AddTransactionModal({ isOpen, onClose, onSave, currency = 'INR' }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [goals, setGoals] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch active goals in case user wants to link a contribution directly to a goal
  useEffect(() => {
    if (isOpen) {
      api.get('/goals?status=active')
        .then((res) => {
          setGoals(res.data || []);
        })
        .catch(() => {
          setGoals([]);
        });
    }
  }, [isOpen]);

  // Adjust category default when type changes
  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'income') setCategory('salary');
    else if (newType === 'expense') setCategory('food');
    else setCategory('savings');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a description or merchant name.');
      return;
    }

    setSubmitting(true);

    try {
      // If it's a contribution and a real goal was selected, also sync to backend goal contributions
      if (type === 'contribution' && selectedGoalId) {
        try {
          await api.post(`/goals/${selectedGoalId}/contributions`, {
            amount: numericAmount,
            date: new Date(date).toISOString(),
            note: note.trim() || title.trim(),
          });
        } catch (contribErr) {
          console.warn('Backend contribution sync failed, recording locally:', contribErr);
        }
      }

      await onSave({
        type,
        amount: numericAmount,
        category,
        title: title.trim(),
        date: new Date(date).toISOString(),
        note: note.trim(),
        goalId: selectedGoalId || null,
      });

      // Reset and close
      setAmount('');
      setTitle('');
      setNote('');
      setSelectedGoalId('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-warm-xl border border-coffee-200/80 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-coffee-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-coffee-500">Cash Flow Activity</span>
            <h2 className="font-serif text-xl font-medium text-coffee-950">Record New Transaction</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 text-coffee-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Type Selector (Tabs) */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-cream-100/70 rounded-2xl border border-coffee-200/60">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-coffee-700 hover:text-coffee-950'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-coffee-700 hover:text-coffee-950'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Income</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('contribution')}
              className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                type === 'contribution'
                  ? 'bg-coffee-600 text-white shadow-sm'
                  : 'text-coffee-700 hover:text-coffee-950'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Goal Deposit</span>
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="font-semibold text-coffee-800 block">Amount ({currency})</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-coffee-400 font-bold">
                {currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-2xl border border-coffee-200/80 focus:border-coffee-500 focus:outline-none text-base font-bold text-coffee-950 bg-cream-50/50"
              />
            </div>
          </div>

          {/* Title / Merchant */}
          <div className="space-y-1">
            <label className="font-semibold text-coffee-800 block">Description / Merchant</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'income'
                  ? 'e.g. Monthly Salary or Client Invoice'
                  : type === 'contribution'
                  ? 'e.g. Deposit towards Vacation'
                  : 'e.g. Supermarket Grocery run'
              }
              className="w-full px-4 py-2.5 rounded-2xl border border-coffee-200/80 focus:border-coffee-500 focus:outline-none text-coffee-950 bg-cream-50/50"
            />
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="font-semibold text-coffee-800 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-coffee-200/80 focus:border-coffee-500 focus:outline-none text-coffee-950 bg-cream-50/50"
            >
              {(CATEGORIES[type] || CATEGORIES.expense).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Goal Allocation when type === 'contribution' */}
          {type === 'contribution' && goals.length > 0 && (
            <div className="space-y-1">
              <label className="font-semibold text-coffee-800 block">Link to Savings Goal (Optional)</label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-coffee-200/80 focus:border-coffee-500 focus:outline-none text-coffee-950 bg-cream-50/50"
              >
                <option value="">-- No specific goal --</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} (Target: {g.targetAmount})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="font-semibold text-coffee-800 block">Transaction Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-coffee-200/80 focus:border-coffee-500 focus:outline-none text-coffee-950 bg-cream-50/50"
            />
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="font-semibold text-coffee-800 block">Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid via UPI / Credit card"
              className="w-full px-4 py-2.5 rounded-2xl border border-coffee-200/80 focus:border-coffee-500 focus:outline-none text-coffee-950 bg-cream-50/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-coffee-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-coffee-200 hover:bg-cream-100 text-coffee-700 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-coffee-500 hover:bg-coffee-600 disabled:opacity-50 text-white font-semibold shadow-warm-sm hover:shadow-warm-md transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Transaction</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
