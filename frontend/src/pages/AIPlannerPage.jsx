import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Target,
  TrendingUp,
  Calendar,
  Sliders,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  Calculator,
  RefreshCw,
  Plus,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AIPlanCard from '../components/ai/AIPlanCard';

export default function AIPlannerPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [error, setError] = useState(null);

  // Plan state
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [planError, setPlanError] = useState(null);

  // What-if simulator state
  const [extraMonthlyContribution, setExtraMonthlyContribution] = useState(1000);

  const currency = user?.currencyPreference || 'INR';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Fetch active goals
  useEffect(() => {
    setLoadingGoals(true);
    api.get('/goals?status=active')
      .then((res) => {
        const active = res.data || [];
        setGoals(active);
        if (active.length > 0) {
          setSelectedGoalId(active[0].id);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load savings goals.');
      })
      .finally(() => {
        setLoadingGoals(false);
      });
  }, []);

  // Fetch or generate plan for selected goal
  const loadPlanForGoal = useCallback(async (goalId) => {
    if (!goalId) return;
    setPlanLoading(true);
    setPlanError(null);
    try {
      // First try to fetch existing plan
      try {
        const res = await api.get(`/goals/${goalId}/ai-plan`);
        setPlan(res.data);
        return;
      } catch (notFound) {
        // If not found, automatically generate initial plan
        const genRes = await api.post(`/goals/${goalId}/ai-plan`, {});
        setPlan(genRes.data);
      }
    } catch (err) {
      setPlanError(err.message || 'Failed to generate AI roadmap.');
      setPlan(null);
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedGoalId) {
      loadPlanForGoal(selectedGoalId);
    }
  }, [selectedGoalId, loadPlanForGoal]);

  const handleRegenerate = async (options) => {
    if (!selectedGoalId) return;
    setRegenerating(true);
    setPlanError(null);
    try {
      const res = await api.post(`/goals/${selectedGoalId}/ai-plan`, options);
      setPlan(res.data);
    } catch (err) {
      setPlanError(err.message || 'Failed to recalibrate plan.');
    } finally {
      setRegenerating(false);
    }
  };

  const selectedGoal = useMemo(() => {
    return goals.find((g) => g.id === selectedGoalId);
  }, [goals, selectedGoalId]);

  // What-if calculation
  const whatIfCalculation = useMemo(() => {
    if (!selectedGoal || !selectedGoal.remainingAmount) return null;

    const remaining = selectedGoal.remainingAmount;
    const daysLeft = selectedGoal.daysRemaining || 30;
    const monthsLeft = Math.max(1, daysLeft / 30);
    const currentMonthlyRate = remaining / monthsLeft;

    const newMonthlyRate = currentMonthlyRate + Number(extraMonthlyContribution);
    const newMonthsNeeded = remaining / newMonthlyRate;
    const monthsSaved = Math.max(0, monthsLeft - newMonthsNeeded);
    const weeksSaved = Math.round(monthsSaved * 4.3);

    return {
      currentMonthlyRate: Math.round(currentMonthlyRate),
      newMonthlyRate: Math.round(newMonthlyRate),
      weeksSaved,
      monthsSaved: Math.round(monthsSaved * 10) / 10,
    };
  }, [selectedGoal, extraMonthlyContribution]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-coffee-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest text-coffee-500 uppercase">
              Financial Intelligence
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Gemini 1.5 Flash</span>
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-coffee-950 mt-1">
            AI Savings Planner
          </h1>
          <p className="text-xs sm:text-sm text-coffee-600 mt-1">
            Calibrate disciplined contribution schedules, simulate what-if scenarios, and accelerate your goal deadlines.
          </p>
        </div>

        {goals.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-coffee-700 hidden sm:inline">Selected Goal:</label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="px-4 py-2 rounded-2xl border border-coffee-200 text-xs font-semibold text-coffee-950 bg-white focus:outline-none focus:border-coffee-500 shadow-sm"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({formatCurrency(g.remainingAmount)} remaining)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loadingGoals ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-coffee-500 animate-spin" />
          <p className="text-xs text-coffee-600 font-medium">Loading savings objectives...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-coffee-200/80 shadow-warm-sm space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center text-3xl mx-auto">
            ✨
          </div>
          <h3 className="font-serif text-2xl font-medium text-coffee-950">No Active Goals to Plan</h3>
          <p className="text-xs text-coffee-600 max-w-sm mx-auto leading-relaxed">
            The AI Planner calibrates pacing milestones for active savings targets. Create your first goal to unlock automated weekly schedules and what-if simulations.
          </p>
          <Link
            to="/goals"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-semibold shadow-warm-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create a Savings Goal</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Goal Selector Pills (Mobile / Quick Switch) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGoalId(g.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition border ${
                  selectedGoalId === g.id
                    ? 'bg-coffee-900 text-white border-coffee-900 shadow-sm'
                    : 'bg-white text-coffee-700 border-coffee-200/80 hover:bg-cream-50'
                }`}
              >
                {g.title}
              </button>
            ))}
          </div>

          {/* Goal Context Summary Card */}
          {selectedGoal && (
            <div className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-coffee-500">Target Amount</span>
                <div className="text-xl font-bold text-coffee-950 mt-0.5">
                  {formatCurrency(selectedGoal.targetAmount)}
                </div>
                <span className="text-[11px] text-coffee-500">Total objective capital</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-coffee-500">Amount Saved</span>
                <div className="text-xl font-bold text-emerald-700 mt-0.5">
                  {formatCurrency(selectedGoal.currentAmount)}
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {selectedGoal.progressPercentage}% completed
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-coffee-500">Remaining</span>
                <div className="text-xl font-bold text-coffee-800 mt-0.5">
                  {formatCurrency(selectedGoal.remainingAmount)}
                </div>
                <span className="text-[11px] text-coffee-500">To reach target</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-coffee-500">Target Date</span>
                <div className="text-xl font-bold text-coffee-950 mt-0.5">
                  {new Date(selectedGoal.deadline).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <span className="text-[11px] text-amber-700 font-medium">
                  {selectedGoal.daysRemaining} days remaining
                </span>
              </div>
            </div>
          )}

          {/* Interactive What-If Simulator Card */}
          {selectedGoal && whatIfCalculation && (
            <div className="bg-gradient-to-br from-cream-50 via-white to-cream-100/60 rounded-3xl p-6 sm:p-8 border border-coffee-200/80 shadow-warm-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-coffee-100 text-coffee-700 flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-medium text-coffee-950">
                      What-If Savings Accelerator
                    </h3>
                    <p className="text-xs text-coffee-600">
                      See how small adjustments to your monthly contributions compress your target timeline.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setExtraMonthlyContribution(amt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        extraMonthlyContribution === amt
                          ? 'bg-coffee-600 text-white shadow-sm'
                          : 'bg-white text-coffee-700 border border-coffee-200 hover:bg-cream-100'
                      }`}
                    >
                      +{formatCurrency(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider & Result Highlight */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
                <div className="md:col-span-2 space-y-3">
                  <div className="flex justify-between text-xs font-semibold text-coffee-800">
                    <span>Extra Contribution: +{formatCurrency(extraMonthlyContribution)} / month</span>
                    <span className="text-coffee-500">Max +{formatCurrency(10000)}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={extraMonthlyContribution}
                    onChange={(e) => setExtraMonthlyContribution(Number(e.target.value))}
                    className="w-full h-2 bg-coffee-200 rounded-lg appearance-none cursor-pointer accent-coffee-600"
                  />
                  <p className="text-[11px] text-coffee-500">
                    By setting aside {formatCurrency(extraMonthlyContribution)} more each month from discretionary spending:
                  </p>
                </div>

                <div className="bg-coffee-900 text-white p-5 rounded-2xl border border-coffee-800 shadow-warm-sm text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                    Timeline Impact
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    {whatIfCalculation.weeksSaved > 0
                      ? `${whatIfCalculation.weeksSaved} Weeks Faster`
                      : 'Earlier Completion'}
                  </div>
                  <p className="text-[11px] text-cream-200">
                    Reach goal in ~{(selectedGoal.daysRemaining / 30 - whatIfCalculation.monthsSaved).toFixed(1)} months
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Plan Roadmap View */}
          {planLoading ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-coffee-200/80 shadow-warm-sm space-y-3">
              <Loader2 className="w-8 h-8 text-coffee-500 animate-spin mx-auto" />
              <h4 className="font-serif text-lg font-medium text-coffee-950">
                Gemini 1.5 Flash is analyzing your savings roadmap...
              </h4>
              <p className="text-xs text-coffee-600 max-w-sm mx-auto">
                Computing milestone cadences, assessing budget achievability, and preparing structured recommendations.
              </p>
            </div>
          ) : planError ? (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-xs text-rose-800 space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Failed to calibrate AI plan</span>
              </div>
              <p>{planError}</p>
              <button
                onClick={() => loadPlanForGoal(selectedGoalId)}
                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl font-semibold transition"
              >
                Try Again
              </button>
            </div>
          ) : plan ? (
            <AIPlanCard
              plan={plan}
              onRegenerate={handleRegenerate}
              regenerating={regenerating}
              currency={currency}
            />
          ) : null}

          {/* Educational Best Practices & Non-Fiduciary Disclaimer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="bg-white rounded-3xl p-6 border border-coffee-200/80 shadow-warm-sm space-y-3">
              <div className="flex items-center gap-2 text-coffee-900 font-semibold text-xs">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Smart Saving Tips for Sustainable Progress</span>
              </div>
              <ul className="text-xs text-coffee-600 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Automate transfers the day after your income arrives to prioritize savings before spending.</li>
                <li>Audit monthly recurring subscriptions once every quarter to free up unallocated cash flow.</li>
                <li>Split windfalls, bonuses, and tax refunds: allocate 50% directly into your top priority goal.</li>
              </ul>
            </div>

            <div className="bg-cream-50/70 rounded-3xl p-6 border border-coffee-200/70 shadow-warm-sm space-y-2 text-xs text-coffee-600">
              <div className="flex items-center gap-2 text-coffee-900 font-semibold">
                <ShieldAlert className="w-4 h-4 text-coffee-500" />
                <span>Non-Fiduciary Educational Notice</span>
              </div>
              <p className="leading-relaxed text-[11px] text-coffee-500">
                All pacing projections, feasibility assessments, and what-if simulations generated by SaveBuddy AI are intended strictly for personal budgeting and educational planning purposes. SaveBuddy does not provide licensed fiduciary investment or financial advisory services.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
