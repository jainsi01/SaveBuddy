import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Plus,
  Target,
  Clock,
  Coins,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle,
  Crown,
  Sparkles,
} from 'lucide-react';
import api, {
  fetchGroupGoalById,
  addGroupMember,
  removeGroupMember,
  fetchGroupBreakdown,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProgressBar from '../../components/goals/ProgressBar';
import GroupMemberBadge from '../../components/groups/GroupMemberBadge';
import AddMemberModal from '../../components/groups/AddMemberModal';
import MemberContributionChart from '../../components/groups/MemberContributionChart';
import AddContributionModal from '../../components/contributions/AddContributionModal';
import ContributionHistoryList from '../../components/contributions/ContributionHistoryList';

export default function GroupGoalDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Group Breakdown & Ledger state
  const [breakdown, setBreakdown] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [contributionsLoading, setContributionsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modal toggles
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [celebrationBanner, setCelebrationBanner] = useState(null);

  const loadGoalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [goalRes, breakdownRes] = await Promise.all([
        fetchGroupGoalById(id),
        fetchGroupBreakdown(id).catch(() => null),
      ]);
      setGoal(goalRes.data);
      if (breakdownRes) setBreakdown(breakdownRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load group goal details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadContributions = useCallback(async (page = 1) => {
    setContributionsLoading(true);
    try {
      const response = await api.get(`/goals/${id}/contributions?page=${page}&limit=10`);
      setContributions(response.data || []);
      if (response.meta) {
        setPagination({
          page: response.meta.page,
          limit: response.meta.limit,
          total: response.meta.total,
          totalPages: response.meta.totalPages,
        });
      }
    } catch (err) {
      console.warn('Failed to load contributions:', err.message);
    } finally {
      setContributionsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGoalData();
    loadContributions(1);
  }, [loadGoalData, loadContributions]);

  const handleAddMember = async (email) => {
    try {
      await addGroupMember(id, email);
      await loadGoalData();
      return { success: true };
    } catch (err) {
      return { error: err.message || 'Failed to add member.' };
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    const isSelf = userId === user?.id;
    const confirmMsg = isSelf
      ? 'Are you sure you want to leave this group goal?'
      : `Are you sure you want to remove ${memberName} from this group?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await removeGroupMember(id, userId);
      if (isSelf) {
        navigate('/group-goals');
      } else {
        await loadGoalData();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  const handleAddContribution = async (payload) => {
    try {
      const response = await api.post(`/goals/${id}/contributions`, payload);
      const { goalSummary, contribution } = response.data;

      // Update local goal balance
      setGoal((prev) => ({
        ...prev,
        currentAmount: goalSummary.currentAmount,
        remainingAmount: goalSummary.remainingAmount,
        progressPercentage: goalSummary.progressPercentage,
        status: goalSummary.status,
      }));

      // Prepend to transaction feed
      setContributions((prev) => [contribution, ...prev]);

      // Refresh breakdown leaderboard
      const updatedBreakdown = await fetchGroupBreakdown(id).catch(() => null);
      if (updatedBreakdown) setBreakdown(updatedBreakdown.data);

      if (goalSummary.isCompletedNow) {
        setCelebrationBanner('Outstanding! Your group has officially completed this goal! 🎉');
      }

      return { success: true };
    } catch (err) {
      return { error: err.message || 'Failed to log contribution.' };
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
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-coffee-500 animate-spin" />
        <p className="text-xs text-coffee-600 font-medium">Loading group goal details...</p>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl text-coffee-950 font-medium">Group Goal Unavailable</h3>
        <p className="text-xs text-coffee-600 leading-relaxed">{error || 'Access denied or goal not found.'}</p>
        <Link
          to="/group-goals"
          className="inline-flex items-center gap-2 text-xs font-semibold text-coffee-500 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Group Goals</span>
        </Link>
      </div>
    );
  }

  const isOwner = goal.userRole === 'owner';
  const isCompleted = goal.status === 'completed' || goal.currentAmount >= goal.targetAmount;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation & Action Buttons */}
      <div className="flex items-center justify-between">
        <Link
          to="/group-goals"
          className="inline-flex items-center gap-2 text-xs font-semibold text-coffee-700 hover:text-coffee-950 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Group Goals</span>
        </Link>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsAddMemberOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-coffee-200 text-coffee-700 hover:bg-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 text-coffee-600" />
              <span>Invite Member</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsContributionOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-semibold shadow-warm-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Deposit to Pool</span>
          </button>
        </div>
      </div>

      {/* Celebration Banner */}
      {celebrationBanner && (
        <div className="bg-sage-100 border border-sage-300 rounded-3xl p-5 text-xs text-sage-900 flex items-center justify-between gap-3 shadow-warm-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-sage-600 shrink-0" />
            <span className="font-bold text-sm">{celebrationBanner}</span>
          </div>
          <button
            onClick={() => setCelebrationBanner(null)}
            className="text-sage-700 hover:text-sage-950 text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Group Goal Card */}
      <div className="bg-white rounded-3xl p-8 border border-coffee-200/80 shadow-warm-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest text-coffee-500 uppercase">
                {goal.category} Collaborative Goal
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-coffee-100 text-coffee-800">
                <Users className="w-3 h-3 text-coffee-600" />
                <span>{goal.membersCount || 1} Members</span>
              </span>
            </div>

            <h1 className="font-serif text-3xl font-medium text-coffee-950">{goal.title}</h1>
            {goal.description && (
              <p className="text-xs text-coffee-600 max-w-xl leading-relaxed pt-1">
                {goal.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                <Crown className="w-3.5 h-3.5 text-amber-700" />
                <span>Group Owner</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-coffee-100 text-coffee-800">
                Group Member
              </span>
            )}
          </div>
        </div>

        {/* Balance Metric & Progress Bar */}
        <div className="p-6 rounded-2xl bg-coffee-50/50 border border-coffee-200/60 space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-coffee-600 font-medium block">Total Pooled Balance</span>
              <span className="text-3xl font-bold text-coffee-950 tracking-tight">
                {formatCurrency(goal.currentAmount)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-coffee-600 font-medium block">Group Target</span>
              <span className="text-xl font-bold text-coffee-800">
                {formatCurrency(goal.targetAmount)}
              </span>
            </div>
          </div>

          <ProgressBar percentage={goal.progressPercentage} size="lg" showLabel={true} />
        </div>

        {/* Analytical Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white border border-coffee-200/70 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center text-coffee-700 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-coffee-500 font-medium block">Remaining to Target</span>
              <span className="text-base font-bold text-coffee-950">
                {formatCurrency(goal.remainingAmount)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-coffee-200/70 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center text-coffee-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-coffee-500 font-medium block">Time Remaining</span>
              <span className="text-base font-bold text-coffee-950">
                {goal.daysRemaining > 0 ? `${goal.daysRemaining} Days` : 'Due Today'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-coffee-200/70 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center text-coffee-700 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-coffee-500 font-medium block">Active Contributors</span>
              <span className="text-base font-bold text-coffee-950">
                {goal.membersCount || 1} Members
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Column: Member Roster & Contribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Member Roster */}
        <div className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-coffee-200/70">
            <div>
              <h3 className="font-serif text-lg font-medium text-coffee-950">Group Members</h3>
              <p className="text-[11px] text-coffee-500">Authorized group participants.</p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(true)}
                className="text-xs font-semibold text-coffee-600 hover:text-coffee-950 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {goal.members &&
              goal.members.map((m) => (
                <GroupMemberBadge
                  key={m.userId}
                  member={m}
                  isOwnerView={isOwner}
                  currentUserId={user?.id}
                  onRemove={handleRemoveMember}
                  currency={user?.currencyPreference || 'INR'}
                />
              ))}
          </div>
        </div>

        {/* Right Column: Member Contribution Breakdown Chart (EC-6.6, EC-6.7) */}
        <div className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm space-y-4">
          <div className="pb-3 border-b border-coffee-200/70">
            <h3 className="font-serif text-lg font-medium text-coffee-950">Contribution Leaderboard</h3>
            <p className="text-[11px] text-coffee-500">Individual shares toward the group objective.</p>
          </div>

          <MemberContributionChart
            breakdown={breakdown}
            currency={user?.currencyPreference || 'INR'}
          />
        </div>
      </div>

      {/* Group Transaction Ledger */}
      <div className="bg-white rounded-3xl p-8 border border-coffee-200/80 shadow-warm-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-coffee-200/70">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-coffee-500 uppercase">
              Transparent Ledger
            </span>
            <h3 className="font-serif text-xl font-medium text-coffee-950 mt-0.5">
              Group Deposit Activity
            </h3>
            <p className="text-xs text-coffee-600 mt-1">
              Real-time feed of all member contributions toward this goal.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsContributionOpen(true)}
            className="px-4 py-2 rounded-xl bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-semibold shadow-warm-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Deposit</span>
          </button>
        </div>

        <ContributionHistoryList
          contributions={contributions}
          loading={contributionsLoading}
          pagination={pagination}
          onPageChange={loadContributions}
          currency={user?.currencyPreference || 'INR'}
          onAddClick={() => setIsContributionOpen(true)}
        />
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAddMember={handleAddMember}
      />

      {/* Add Contribution Modal */}
      <AddContributionModal
        isOpen={isContributionOpen}
        onClose={() => setIsContributionOpen(false)}
        onSubmit={handleAddContribution}
        goal={goal}
        currency={user?.currencyPreference || 'INR'}
      />
    </div>
  );
}
