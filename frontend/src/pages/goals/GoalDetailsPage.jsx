import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Edit3,
  Archive,
  AlertCircle,
  Loader2,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProgressBar from '../../components/goals/ProgressBar';
import GoalFormModal from '../../components/goals/GoalFormModal';

export default function GoalDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const fetchGoal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/goals/${id}`);
      setGoal(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch goal details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const handleUpdateGoal = async (payload) => {
    try {
      const response = await api.put(`/goals/${id}`, payload);
      setGoal(response.data);
      return { success: true };
    } catch (err) {
      return { error: err.message || 'Failed to update goal.' };
    }
  };

  const handleArchiveGoal = async () => {
    if (!window.confirm('Are you sure you want to archive this goal? You can still view it in the archived tab.')) {
      return;
    }
    setArchiving(true);
    try {
      await api.delete(`/goals/${id}`);
      navigate('/goals');
    } catch (err) {
      alert(err.message || 'Failed to archive goal.');
      setArchiving(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: user?.currencyPreference || 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-coffee-500 animate-spin" />
        <p className="text-xs text-coffee-600 font-medium">Loading objective details...</p>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl text-coffee-950 font-medium">Goal Unavailable</h3>
        <p className="text-xs text-coffee-600 leading-relaxed">{error || 'Goal not found or access denied.'}</p>
        <Link
          to="/goals"
          className="inline-flex items-center gap-2 text-xs font-semibold text-coffee-500 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Goals</span>
        </Link>
      </div>
    );
  }

  const isCompleted = goal.status === 'completed' || goal.currentAmount >= goal.targetAmount;
  const isArchived = goal.status === 'archived';

  // Calculate simple weekly pace required
  const weeksLeft = Math.max(1, Math.ceil(goal.daysRemaining / 7));
  const weeklyPace = Math.ceil(goal.remainingAmount / weeksLeft);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/goals"
          className="inline-flex items-center gap-2 text-xs font-semibold text-coffee-700 hover:text-coffee-950 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Goals</span>
        </Link>

        <div className="flex items-center gap-2">
          {!isArchived && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-coffee-200 text-coffee-700 hover:bg-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}
          {!isArchived && (
            <button
              onClick={handleArchiveGoal}
              disabled={archiving}
              className="px-3.5 py-1.5 rounded-xl border border-coffee-200 text-coffee-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Goal Card */}
      <div className="bg-white rounded-3xl p-8 border border-coffee-200/80 shadow-warm-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-widest text-coffee-500 uppercase">
              {goal.category} Objective
            </span>
            <h1 className="font-serif text-3xl font-medium text-coffee-950">{goal.title}</h1>
            {goal.description && (
              <p className="text-xs text-coffee-600 max-w-xl leading-relaxed pt-1">
                {goal.description}
              </p>
            )}
          </div>

          <div>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-sage-100 text-sage-800 border border-sage-300">
                <CheckCircle className="w-4 h-4 text-sage-600" />
                <span>Target Achieved 🎉</span>
              </span>
            ) : isArchived ? (
              <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                Archived Goal
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-coffee-100 text-coffee-800 border border-coffee-200/70">
                Active Schedule
              </span>
            )}
          </div>
        </div>

        {/* Progress Metric Ring & Bar */}
        <div className="p-6 rounded-2xl bg-coffee-50/50 border border-coffee-200/60 space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-coffee-600 font-medium block">Current Balance</span>
              <span className="text-3xl font-bold text-coffee-950 tracking-tight">
                {formatCurrency(goal.currentAmount)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-coffee-600 font-medium block">Total Target</span>
              <span className="text-xl font-bold text-coffee-800">
                {formatCurrency(goal.targetAmount)}
              </span>
            </div>
          </div>

          <ProgressBar percentage={goal.progressPercentage} size="lg" showLabel={true} />
        </div>

        {/* Key Analytical Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Tile 1: Remaining Balance */}
          <div className="p-4 rounded-2xl bg-white border border-coffee-200/70 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center text-coffee-700 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-coffee-500 font-medium block">Remaining</span>
              <span className="text-base font-bold text-coffee-950">
                {formatCurrency(goal.remainingAmount)}
              </span>
            </div>
          </div>

          {/* Tile 2: Days to Deadline */}
          <div className="p-4 rounded-2xl bg-white border border-coffee-200/70 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center text-coffee-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-coffee-500 font-medium block">Timeline</span>
              <span className="text-base font-bold text-coffee-950">
                {goal.daysRemaining > 0 ? `${goal.daysRemaining} Days` : 'Due Today'}
              </span>
            </div>
          </div>

          {/* Tile 3: Weekly Target Pace */}
          <div className="p-4 rounded-2xl bg-white border border-coffee-200/70 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center text-coffee-700 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-coffee-500 font-medium block">Weekly Pacing</span>
              <span className="text-base font-bold text-coffee-950">
                {isCompleted ? 'Target Met' : `${formatCurrency(weeklyPace)} / wk`}
              </span>
            </div>
          </div>
        </div>

        {/* Informational Guidance Footer */}
        <div className="pt-4 border-t border-coffee-100 flex items-center justify-between text-xs text-coffee-500">
          <span>Target Deadline: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span className="text-coffee-700 font-medium italic">SaveBuddy Precision Tracking</span>
        </div>
      </div>

      {/* Edit Goal Modal */}
      <GoalFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateGoal}
        initialData={goal}
      />
    </div>
  );
}
