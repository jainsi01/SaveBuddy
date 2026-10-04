import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Target,
  Calendar,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
  X,
  Mail,
} from 'lucide-react';
import { fetchGroupGoals, createGroupGoal } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProgressBar from '../../components/goals/ProgressBar';

export default function GroupGoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'travel',
    targetAmount: '',
    deadline: '',
    initialMembersInput: '',
  });

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchGroupGoals();
      setGoals(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load collaborative group goals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const initialMembers = formData.initialMembersInput
        .split(',')
        .map((em) => em.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        targetAmount: Number(formData.targetAmount),
        deadline: formData.deadline,
        initialMembers,
      };

      await createGroupGoal(payload);
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        category: 'travel',
        targetAmount: '',
        deadline: '',
        initialMembersInput: '',
      });
      loadGoals();
    } catch (err) {
      setModalError(err.message || 'Failed to create group goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: user?.currencyPreference || 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-widest text-coffee-500 uppercase">
              Shared Ambitions
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-coffee-100 text-coffee-800">
              <Users className="w-3 h-3 text-coffee-600" />
              <span>Collaborative Pools</span>
            </span>
          </div>
          <h1 className="font-serif text-3xl font-medium text-coffee-950 mt-1">
            Collaborative Group Goals
          </h1>
          <p className="text-xs text-coffee-600 mt-1">
            Pool resources with friends, family, or colleagues with shared accountability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-semibold shadow-warm-sm hover:shadow-warm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Group Goal</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-coffee-500 animate-spin" />
          <p className="text-xs text-coffee-600 font-medium">Loading group goals...</p>
        </div>
      ) : goals.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 border border-coffee-200/80 shadow-warm-sm text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-coffee-100 flex items-center justify-center text-coffee-600 mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-medium text-coffee-950">
              No Group Goals Yet
            </h3>
            <p className="text-xs text-coffee-600 leading-relaxed max-w-sm mx-auto">
              Start a shared fund for an upcoming vacation, group purchase, or joint emergency buffer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-semibold shadow-warm-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Group Goal</span>
          </button>
        </div>
      ) : (
        /* Goals Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <Link
              key={goal.id}
              to={`/group-goals/${goal.id}`}
              className="group bg-white rounded-3xl p-6 border border-coffee-200/80 hover:border-coffee-300 shadow-warm-sm hover:shadow-warm transition flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-coffee-500 uppercase bg-coffee-50 px-2.5 py-1 rounded-lg border border-coffee-100">
                    {goal.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-coffee-700 bg-coffee-100 px-2.5 py-0.5 rounded-full">
                    <Users className="w-3 h-3 text-coffee-500" />
                    <span>{goal.membersCount || 1} {goal.membersCount === 1 ? 'member' : 'members'}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-medium text-coffee-950 group-hover:text-coffee-700 transition">
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-xs text-coffee-600 line-clamp-2 mt-1">
                      {goal.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress & Balances */}
              <div className="space-y-3 pt-2 border-t border-coffee-100">
                <div className="flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-coffee-500 block">Saved</span>
                    <span className="font-bold text-coffee-950 text-sm">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-coffee-500 block">Target</span>
                    <span className="font-semibold text-coffee-800">
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                </div>

                <ProgressBar percentage={goal.progressPercentage} size="sm" showLabel={false} />

                <div className="flex items-center justify-between text-[11px] text-coffee-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-coffee-400" />
                    <span>Due: {formatDate(goal.deadline)}</span>
                  </span>
                  <span className="font-bold text-coffee-700 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    <span>View Pool</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Group Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-950/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-coffee-200/80 shadow-warm-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-coffee-200/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-coffee-100 flex items-center justify-center text-coffee-700">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-coffee-950">
                    Create Collaborative Goal
                  </h3>
                  <p className="text-[11px] text-coffee-500">
                    Pool funds together for a shared objective.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-coffee-400 hover:text-coffee-700 hover:bg-coffee-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-coffee-700 block mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa Trip 2027, Office PS5 Fund"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-coffee-200 focus:outline-none focus:ring-1 focus:ring-coffee-500 text-coffee-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-coffee-700 block mb-1">
                    Target Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="50000"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-coffee-200 focus:outline-none focus:ring-1 focus:ring-coffee-500 text-coffee-950"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-coffee-700 block mb-1">
                    Target Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-coffee-200 focus:outline-none focus:ring-1 focus:ring-coffee-500 text-coffee-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-coffee-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-coffee-200 bg-white focus:outline-none focus:ring-1 focus:ring-coffee-500 text-coffee-950"
                  >
                    <option value="travel">Travel</option>
                    <option value="gadgets">Gadgets</option>
                    <option value="emergency">Emergency</option>
                    <option value="education">Education</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="home">Home</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-coffee-700 block mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Short description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-coffee-200 focus:outline-none focus:ring-1 focus:ring-coffee-500 text-coffee-950"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-coffee-700 block mb-1">
                  Invite Members by Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="alice@example.com, bob@example.com"
                    value={formData.initialMembersInput}
                    onChange={(e) =>
                      setFormData({ ...formData, initialMembersInput: e.target.value })
                    }
                    className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-coffee-200 focus:outline-none focus:ring-1 focus:ring-coffee-500 text-coffee-950"
                  />
                </div>
                <p className="text-[10px] text-coffee-500 mt-1">
                  Comma-separated emails of registered SaveBuddy users. You can also invite members later.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-coffee-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-coffee-700 hover:bg-coffee-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-coffee-500 hover:bg-coffee-600 disabled:opacity-50 rounded-xl shadow-warm-sm transition flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Pool</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
