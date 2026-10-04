import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Sparkles,
  Plus,
  Users,
  ArrowRight,
  Loader2,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { fetchDashboardSummary } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getMonthlyCashFlow, saveTransaction, getTransactions } from '../services/transactionService';
import StatCard from '../components/dashboard/StatCard';
import UrgentGoalsList from '../components/dashboard/UrgentGoalsList';
import ProgressBar from '../components/goals/ProgressBar';
import AddTransactionModal from '../components/transactions/AddTransactionModal';
import GoalFormModal from '../components/goals/GoalFormModal';
import AddContributionModal from '../components/contributions/AddContributionModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [activeGoals, setActiveGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cash flow state
  const [cashFlow, setCashFlow] = useState({
    income: 50000,
    expenses: 32000,
    availableToSave: 18000,
    savingsRate: 36,
  });

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState(null);

  const currency = user?.currencyPreference || 'INR';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch executive dashboard summary
      const summaryRes = await fetchDashboardSummary();
      setSummary(summaryRes.data);

      // 2. Fetch top active goals
      const goalsRes = await api.get('/goals?status=active');
      setActiveGoals(goalsRes.data || []);

      // 3. Calculate cash flow from user's transactions & profile income
      if (user?.id) {
        const metrics = getMonthlyCashFlow(user.id, user.monthlyIncome);
        setCashFlow(metrics);
      }
    } catch (err) {
      setError(err.message || 'Failed to load financial dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.monthlyIncome]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle saving a transaction
  const handleSaveTransaction = async (txData) => {
    if (user?.id) {
      saveTransaction(user.id, txData);
      loadDashboardData();
    }
  };

  // Handle creating a goal
  const handleCreateGoal = async (goalPayload) => {
    try {
      await api.post('/goals', goalPayload);
      loadDashboardData();
      return { success: true };
    } catch (err) {
      return { error: err.message || 'Failed to create goal.' };
    }
  };

  // Handle quick deposit to goal
  const handleGoalDeposit = async (contributionPayload) => {
    if (!selectedGoalForDeposit) return;
    try {
      await api.post(`/goals/${selectedGoalForDeposit.id}/contributions`, contributionPayload);
      loadDashboardData();
      return { success: true };
    } catch (err) {
      return { error: err.message || 'Failed to log deposit.' };
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.name ? user.name.split(' ')[0] : 'there';

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-coffee-500 animate-spin" />
        <p className="text-xs text-coffee-600 font-medium">Aggregating your financial overview...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl text-coffee-950 font-medium">Dashboard Unavailable</h3>
        <p className="text-xs text-coffee-600 leading-relaxed">{error || 'Could not fetch summary data.'}</p>
        <button
          onClick={loadDashboardData}
          className="px-5 py-2.5 bg-coffee-500 text-white rounded-full text-xs font-semibold shadow-warm-sm hover:bg-coffee-600 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isZeroState = summary.activeGoalsCount === 0 && summary.completedGoalsCount === 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-coffee-200/80 pb-6">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-coffee-500 uppercase block">
            This Month's Financial Health
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-coffee-950 mt-1">
            {getGreeting()}, {userName} 
          </h1>
          <p className="text-xs sm:text-sm text-coffee-600 mt-1">
            Here is your holistic financial overview, active savings pacing, and cash flow summary.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsTxModalOpen(true)}
            className="px-4 py-2.5 rounded-full bg-white hover:bg-cream-100 text-coffee-800 border border-coffee-200/80 text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-coffee-600" />
            <span>Add Transaction</span>
          </button>

          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="px-4 py-2.5 rounded-full bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-semibold shadow-warm-sm hover:shadow-warm-md transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Goal</span>
          </button>
        </div>
      </div>

      {/* 1. Quick Financial Summary (Cards) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-coffee-500">
            Cash Flow & Reserves
          </h2>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-coffee-700 hover:text-coffee-950 hover:underline inline-flex items-center gap-1"
          >
            <span>View All Activity</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly Income */}
          <div className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-coffee-500 uppercase tracking-wider block">
                Monthly Income
              </span>
              <div className="text-2xl font-bold text-emerald-700">
                {formatCurrency(cashFlow.income)}
              </div>
              <p className="text-[11px] text-coffee-500">Earnings this month</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-coffee-500 uppercase tracking-wider block">
                Monthly Expenses
              </span>
              <div className="text-2xl font-bold text-rose-700">
                {formatCurrency(cashFlow.expenses)}
              </div>
              <p className="text-[11px] text-coffee-500">Living costs & leisure</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>

          {/* Available to Save */}
          <div className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-coffee-500 uppercase tracking-wider block">
                Available to Save
              </span>
              <div className="text-2xl font-bold text-coffee-950">
                {formatCurrency(cashFlow.availableToSave)}
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold">
                {cashFlow.savingsRate}% monthly savings capacity
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-cream-100 text-coffee-800 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          {/* Total Saved So Far */}
          <div className="bg-coffee-900 text-white rounded-3xl p-6 border border-coffee-800 shadow-warm-md flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-cream-200 uppercase tracking-wider block">
                Total Saved So Far
              </span>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(summary.totalSaved)}
              </div>
              <p className="text-[11px] text-amber-300 font-medium">
                {summary.activeGoalsCount} active • {summary.completedGoalsCount} completed
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-cream-200 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Current Savings Goals (Overview) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-medium text-coffee-950">Current Savings Goals</h2>
            <p className="text-xs text-coffee-600">Track progress, target dates, and monthly paces.</p>
          </div>
          <Link
            to="/goals"
            className="text-xs font-semibold text-coffee-700 hover:text-coffee-950 hover:underline inline-flex items-center gap-1"
          >
            <span>View All Goals ({activeGoals.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeGoals.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-coffee-200/80 shadow-warm-sm text-center max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 flex items-center justify-center text-2xl mx-auto">
              🎯
            </div>
            <h3 className="font-serif text-lg font-medium text-coffee-950">No active savings goals</h3>
            <p className="text-xs text-coffee-600 max-w-xs mx-auto">
              Start building your wealth by setting your first milestone goal today.
            </p>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="mt-2 px-5 py-2.5 bg-coffee-500 text-white rounded-full text-xs font-semibold shadow-warm-sm hover:bg-coffee-600 transition inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Goal</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeGoals.slice(0, 3).map((goal) => {
              const monthsLeft = Math.max(1, Math.ceil(goal.daysRemaining / 30));
              const monthlyPace = Math.ceil(goal.remainingAmount / monthsLeft);
              const isDueSoon = goal.daysRemaining <= 14;

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm hover:shadow-warm-md hover:border-coffee-300 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream-100 text-coffee-700">
                        {goal.category}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          isDueSoon
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isDueSoon ? 'Needs Attention' : 'On Track'}
                      </span>
                    </div>

                    <Link to={`/goals/${goal.id}`} className="group block">
                      <h3 className="font-serif text-lg font-medium text-coffee-950 group-hover:text-coffee-600 transition line-clamp-1">
                        {goal.title}
                      </h3>
                      {goal.description && (
                        <p className="text-xs text-coffee-500 line-clamp-1 mt-0.5">
                          {goal.description}
                        </p>
                      )}
                    </Link>

                    <div className="pt-2">
                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span className="font-bold text-coffee-950">
                          {formatCurrency(goal.currentAmount)}
                        </span>
                        <span className="text-coffee-500">
                          Target: {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                      <ProgressBar percentage={goal.progressPercentage} size="md" />
                      <div className="flex items-center justify-between text-[11px] text-coffee-500 mt-2">
                        <span>{goal.progressPercentage}% reached</span>
                        <span className="text-coffee-700 font-semibold">
                          ~{formatCurrency(monthlyPace)}/mo pace
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-coffee-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedGoalForDeposit(goal);
                        setIsContributionModalOpen(true);
                      }}
                      className="text-xs font-semibold text-coffee-600 hover:text-coffee-900 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Deposit</span>
                    </button>

                    <Link
                      to={`/goals/${goal.id}`}
                      className="text-xs font-semibold text-coffee-500 hover:text-coffee-900 inline-flex items-center gap-1 group"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Approaching Deadlines & AI Insight Teaser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Approaching Deadlines / Urgent Goals */}
        <div className="lg:col-span-2">
          <UrgentGoalsList
            urgentGoals={summary.urgentGoals}
            currency={currency}
          />
        </div>

        {/* Right Column: AI Insight Preview Card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-coffee-900 via-coffee-950 to-coffee-900 text-white rounded-3xl p-6 sm:p-7 shadow-warm-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-amber-300 border border-white/10">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Gemini Financial Advisor</span>
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-xl font-medium text-cream-100">
                AI Smart Insight
              </h3>
              <p className="text-xs text-cream-300/90 leading-relaxed">
                {activeGoals.length > 0
                  ? `You can save ${formatCurrency(1500)} more this month by optimizing dining and discretionary spending to achieve '${activeGoals[0]?.title}' faster.`
                  : 'Set your first savings goal to receive personalized milestone cadences and spending reduction insights.'}
              </p>
            </div>

            <Link
              to="/ai-planner"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-cream-100 hover:bg-white text-coffee-950 text-xs font-semibold shadow-warm-sm transition w-full group"
            >
              <span>Open AI Savings Planner</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {/* Quick Hub Shortcuts */}
          <div className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm space-y-3">
            <h4 className="font-serif text-base font-medium text-coffee-950">
              Explore SaveBuddy
            </h4>
            <div className="space-y-2">
              <Link
                to="/group-goals"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-cream-50/70 hover:bg-cream-100 transition text-xs font-semibold text-coffee-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-cream-200/60 flex items-center justify-center text-coffee-700">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-coffee-950">Group Savings Pools</span>
                    <span className="text-[10px] text-coffee-500 font-normal">Save together with friends</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-coffee-400" />
              </Link>

              <Link
                to="/transactions"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-cream-50/70 hover:bg-cream-100 transition text-xs font-semibold text-coffee-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-cream-200/60 flex items-center justify-center text-coffee-700">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-coffee-950">Cash Flow Ledger</span>
                    <span className="text-[10px] text-coffee-500 font-normal">Track income & expenses</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-coffee-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        currency={currency}
      />

      <GoalFormModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleCreateGoal}
      />

      {selectedGoalForDeposit && (
        <AddContributionModal
          isOpen={isContributionModalOpen}
          onClose={() => {
            setIsContributionModalOpen(false);
            setSelectedGoalForDeposit(null);
          }}
          goal={selectedGoalForDeposit}
          onSubmit={handleGoalDeposit}
          currency={currency}
        />
      )}
    </div>
  );
}
